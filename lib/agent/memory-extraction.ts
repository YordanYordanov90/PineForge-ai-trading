import 'server-only';

import { generateObject } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod';

import {
  getAgentMemoryForUser,
  getMemoryLastUpdated,
  getScriptCountForUser,
  listRecentConversationsWithMessages,
  upsertAgentMemory,
} from '@/lib/db';
import type {
  AgentMessage,
  AgentToolResult,
  AgentUserProfile,
  SavedConversation,
} from '@/lib/types/agent';
import type { GrokModelId } from '@/lib/types';

/**
 * Forge Agent memory extraction (spec 56).
 *
 * Background process invoked from spec 55's `onFinish` callback after
 * a Forge turn has already streamed back to the client. Pulls the most
 * recent conversations + the existing profile, asks the LLM to update
 * the structured `AgentUserProfile`, validates the output against the
 * Zod schema below, merges it with the existing profile, and upserts
 * the result.
 *
 * Cost-control invariants (spec § Cost Control):
 *   - `generateObject` (cheaper than `streamText`)
 *   - `temperature: 0` (deterministic, no creative drift)
 *   - `maxOutputTokens: 800` (the profile is small)
 *   - debounce: at most once per hour per user
 *   - input cap: ~6000 tokens (3 conversations × ~2000 tokens each,
 *     enforced by {@link PER_CONVERSATION_CHAR_BUDGET})
 *   - **does not** count against the user's daily AI quota — the
 *     parent Forge POST already paid for one quota slot, this is an
 *     internal maintenance pass piggy-backing on the same turn
 *
 * Privacy invariant: every helper here is owner-scoped via the
 * `userId` parameter. The extractor never sees a conversation, script
 * count, or memory row for any user other than the caller of the
 * parent Forge turn.
 */

/**
 * Spec § Trigger — at least four user messages in the conversation
 * (`enough signal to extract meaningful preferences — not on the first
 * quick question`).
 */
export const MIN_USER_MESSAGES_FOR_EXTRACTION = 4;

/**
 * Spec § Trigger — at least one hour since the last extraction.
 * Debounce runs against `agent_memory.updated_at`, not the in-memory
 * profile, so a rapid multi-tab session can't bypass it.
 */
export const EXTRACTION_DEBOUNCE_MS = 60 * 60 * 1000;

/**
 * Spec § Extraction Flow — fetch the 3 most recently updated
 * conversations (full messages). Older threads have already
 * contributed to a previous extraction window.
 */
export const RECENT_CONVERSATIONS_LIMIT = 3;

/**
 * Per-conversation excerpt char budget (~2000 tokens at 4 chars/token).
 * Enforced after the excerpt is built; older messages are kept in
 * favour of the head so the LLM sees the start of the conversation
 * (intent) plus as many later turns as fit.
 */
const PER_CONVERSATION_CHAR_BUDGET = 8000;

const MEMORY_EXTRACTION_MAX_OUTPUT_TOKENS = 800;

/**
 * Zod schema matching spec 56 verbatim. The Zod schema is intentionally
 * tighter than {@link AgentUserProfile} (string-typed `riskTolerance`)
 * so the LLM output is guaranteed to land on one of the three canonical
 * values; storage stays string-typed for future flexibility.
 *
 * `lastExtractedAt` and `totalStrategiesGenerated` are accepted for
 * round-trip compatibility but always overwritten in the merge step
 * (spec § Output Schema — "set during the merge step, not by the LLM").
 */
export const agentUserProfileSchema = z.object({
  preferredMarkets: z
    .array(z.string().max(20))
    .max(10)
    .optional()
    .describe('Markets the user has built strategies for (e.g. BTC, ETH, SPY).'),
  preferredTimeframes: z
    .array(z.string().max(10))
    .max(8)
    .optional()
    .describe('Chart timeframes the user has worked with (e.g. 5m, 15m, 1h).'),
  preferredIndicators: z
    .array(z.string().max(30))
    .max(10)
    .optional()
    .describe('Indicators the user has used (e.g. RSI, MACD, VWAP, EMA).'),
  riskTolerance: z
    .enum(['conservative', 'moderate', 'aggressive'])
    .optional()
    .describe(
      'Risk tolerance inferred from stop-loss tightness and position sizing language.',
    ),
  strategyPatterns: z
    .array(z.string().max(30))
    .max(8)
    .optional()
    .describe(
      'High-level strategy patterns the user repeats (e.g. momentum, mean reversion, breakout).',
    ),
  averageHealthScore: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Approximate average Health Score across the user\'s strategies.'),
  totalStrategiesGenerated: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      'Computed from a count of the user\'s scripts table — overwritten in the merge step.',
    ),
  insights: z
    .array(z.string().max(200))
    .max(10)
    .optional()
    .describe(
      'Specific actionable observations about the user\'s habits or preferences (no generic notes).',
    ),
  lastExtractedAt: z
    .string()
    .optional()
    .describe('ISO timestamp — overwritten in the merge step.'),
});

export type ExtractedAgentUserProfile = z.infer<typeof agentUserProfileSchema>;

/**
 * Spec § Extraction Prompt — system prompt verbatim from the spec.
 * Kept as an exported constant so spec 58's guardrail audit can assert
 * the extraction prompt and the conversation prompt enforce the same
 * "do not invent / preserve unless contradicted" rules.
 */
export const MEMORY_EXTRACTION_SYSTEM = `You are a preference extraction assistant. Given a user's recent conversations with a Pine Script strategy assistant, extract or update their trading preferences profile.

Rules:
- Only extract preferences that are clearly stated or strongly implied
- Do not invent preferences the user hasn't shown
- Preserve existing preferences unless the user explicitly contradicts them
- Keep insights actionable and specific (not generic observations)
- Cap arrays at their maximum lengths`;

/**
 * Builds the user prompt from the existing profile + recent
 * conversations. Pure function — no DB reads, no LLM calls, no env
 * access — so spec 58's guardrail tests can snapshot the exact text
 * the LLM would see for any input.
 */
export function buildMemoryExtractionUserPrompt(
  existingProfile: AgentUserProfile,
  conversations: SavedConversation[],
): string {
  const profileSection =
    Object.keys(existingProfile).length === 0
      ? 'No profile yet.'
      : JSON.stringify(existingProfile, null, 2);

  const conversationSection =
    conversations.length === 0
      ? 'No recent conversations.'
      : conversations
          .map((conv, idx) => formatConversationExcerpt(conv, idx + 1))
          .join('\n\n---\n\n');

  return `## Current Profile

${profileSection}

## Recent Conversations

${conversationSection}

## Task

Update the profile based on these conversations. Return the complete updated profile (not just the diff). If a section has no clear signal in the conversations, omit it.`;
}

function formatConversationExcerpt(
  conv: SavedConversation,
  index: number,
): string {
  const title = conv.title?.trim() || `Untitled conversation ${index}`;
  const lines: string[] = [`### ${title}`];

  for (const msg of conv.messages) {
    if (msg.role === 'user') {
      const content = msg.content.trim();
      if (content.length > 0) {
        lines.push(`User: ${content}`);
      }
      continue;
    }
    if (msg.role === 'tool') {
      for (const result of msg.toolResults ?? []) {
        const summary = summariseToolResult(result);
        if (summary) {
          lines.push(`Tool[${result.name}]: ${summary}`);
        }
      }
      continue;
    }
    // Assistant messages: surface only the tool-call decisions, not the
    // free text. The user's own messages are the primary signal; the
    // assistant's narrative is mostly a paraphrase that would dilute
    // the prompt budget without adding extractable preferences.
    if (msg.toolCalls?.length) {
      const names = msg.toolCalls.map((c) => c.name).join(', ');
      lines.push(`Assistant called: ${names}`);
    }
  }

  const joined = lines.join('\n');
  if (joined.length <= PER_CONVERSATION_CHAR_BUDGET) return joined;
  return `${joined.slice(0, PER_CONVERSATION_CHAR_BUDGET)}\n... (truncated)`;
}

function summariseToolResult(result: AgentToolResult): string | null {
  if (result.isError) return null;
  const value = result.result;
  if (value == null || typeof value !== 'object') return null;

  const obj = value as Record<string, unknown>;

  if (result.name === 'run_health_score') {
    const score = obj.score;
    const verdict = obj.verdict;
    if (typeof score === 'number') {
      return typeof verdict === 'string'
        ? `Health Score ${score}/10 (${verdict})`
        : `Health Score ${score}/10`;
    }
  }

  if (result.name === 'search_user_scripts') {
    const count = obj.count;
    if (typeof count === 'number') {
      return `found ${count} matching scripts`;
    }
  }

  if (result.name === 'run_backtest_summary') {
    const title = obj.title;
    if (typeof title === 'string') {
      return `Backtest plan: ${title}`;
    }
  }

  if (result.name === 'generate_alert_templates') {
    const templates = Array.isArray(obj.templates) ? obj.templates : null;
    if (templates) {
      return `generated ${templates.length} alert templates`;
    }
  }

  return null;
}

/**
 * Counts user-role messages in a conversation. Spec 55's `onFinish`
 * uses this to evaluate the {@link MIN_USER_MESSAGES_FOR_EXTRACTION}
 * trigger before invoking the extractor — keeps the trigger logic in
 * one place.
 */
export function countUserMessages(messages: ReadonlyArray<AgentMessage>): number {
  let n = 0;
  for (const m of messages) {
    if (m.role === 'user') n += 1;
  }
  return n;
}

/**
 * Case-insensitive union for markets / timeframes / indicators. New
 * items go to the end so the eviction (`out.length - cap`) trims the
 * oldest first when the array overflows. Empty inputs collapse to
 * `undefined` so the persisted JSON stays compact (spec § Output
 * Schema — every field is optional).
 */
function uniqueMerge(
  existing: string[] | undefined,
  extracted: string[] | undefined,
  cap: number,
  caseInsensitive: boolean,
): string[] | undefined {
  if (!existing?.length && !extracted?.length) return undefined;

  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const key = caseInsensitive ? value.toLowerCase() : value;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(value);
  };

  for (const v of existing ?? []) push(v);
  for (const v of extracted ?? []) push(v);

  if (out.length === 0) return undefined;
  if (out.length <= cap) return out;
  return out.slice(out.length - cap);
}

/**
 * Insights merge — spec § Merge Logic v1: append, dedup by trimmed
 * lowercase, trim oldest at the cap. A future spec can replace this
 * with semantic-similarity replacement; the signature stays the same.
 */
function mergeInsights(
  existing: string[] | undefined,
  extracted: string[] | undefined,
  cap: number,
): string[] | undefined {
  return uniqueMerge(existing, extracted, cap, true);
}

/**
 * Spec § Merge Logic — combine the existing profile with the LLM's
 * extracted profile. Arrays are merged additively (with FIFO eviction
 * at the cap); scalars (`riskTolerance`, `averageHealthScore`) are
 * replacement when extracted, fall back to existing otherwise.
 *
 * `totalStrategiesGenerated` is always overwritten with the live
 * `count(*)` from the scripts table (spec § Output Schema). The LLM
 * does not get to set this even if it tries.
 *
 * `lastExtractedAt` is always set to the current ISO timestamp so the
 * debounce on the next turn measures from the actual write, not from
 * a value the LLM may have hallucinated.
 */
export function mergeProfiles(
  existing: AgentUserProfile,
  extracted: ExtractedAgentUserProfile,
  scriptCount: number,
): AgentUserProfile {
  return {
    preferredMarkets: uniqueMerge(
      existing.preferredMarkets,
      extracted.preferredMarkets,
      10,
      true,
    ),
    preferredTimeframes: uniqueMerge(
      existing.preferredTimeframes,
      extracted.preferredTimeframes,
      8,
      true,
    ),
    preferredIndicators: uniqueMerge(
      existing.preferredIndicators,
      extracted.preferredIndicators,
      10,
      true,
    ),
    riskTolerance: extracted.riskTolerance ?? existing.riskTolerance,
    strategyPatterns: uniqueMerge(
      existing.strategyPatterns,
      extracted.strategyPatterns,
      8,
      false,
    ),
    averageHealthScore:
      extracted.averageHealthScore ?? existing.averageHealthScore,
    totalStrategiesGenerated: scriptCount,
    insights: mergeInsights(existing.insights, extracted.insights, 10),
    lastExtractedAt: new Date().toISOString(),
  };
}

export type MaybeExtractMemoryInput = {
  /** DB user id (`users.id`). */
  userId: number;
  /** Conversation that just streamed — used for the trigger check. */
  conversation: { messages: ReadonlyArray<AgentMessage> };
  /** Grok model resolved for the parent Forge turn. */
  model: GrokModelId;
};

export type MaybeExtractMemoryReason =
  | 'too-few-user-messages'
  | 'debounced'
  | 'no-conversations'
  | 'extraction-failed'
  | 'persist-failed';

export type MaybeExtractMemoryResult =
  | { ran: true }
  | { ran: false; reason: MaybeExtractMemoryReason };

/**
 * Conditional entry point — runs the full extraction flow when the
 * spec § Trigger conditions are met, no-ops silently otherwise. Spec
 * 55's `onFinish` callback is the only caller in v1.
 *
 * Failure modes are swallowed (returned as a `{ ran: false, reason }`
 * value) — extraction is fire-and-forget maintenance and must never
 * surface as an error in the chat UI. A failed extraction simply
 * leaves the existing profile in place; the next eligible turn will
 * try again.
 *
 * No `AbortSignal` parameter on purpose — extraction runs *after* the
 * user's stream completes, so coupling it to `req.signal` would
 * sometimes terminate it as the request is finalising. Vercel's
 * function timeout is the upper bound; the LLM call is sized at 800
 * output tokens to stay well under that ceiling.
 */
export async function maybeExtractAndPersistMemory(
  input: MaybeExtractMemoryInput,
): Promise<MaybeExtractMemoryResult> {
  const userMessageCount = countUserMessages(input.conversation.messages);
  if (userMessageCount < MIN_USER_MESSAGES_FOR_EXTRACTION) {
    return { ran: false, reason: 'too-few-user-messages' };
  }

  const lastUpdated = await getMemoryLastUpdated(input.userId);
  if (
    lastUpdated &&
    Date.now() - lastUpdated.getTime() < EXTRACTION_DEBOUNCE_MS
  ) {
    return { ran: false, reason: 'debounced' };
  }

  const [existingProfile, conversations, scriptCount] = await Promise.all([
    getAgentMemoryForUser(input.userId),
    listRecentConversationsWithMessages(input.userId, RECENT_CONVERSATIONS_LIMIT),
    getScriptCountForUser(input.userId),
  ]);

  if (conversations.length === 0) {
    return { ran: false, reason: 'no-conversations' };
  }

  const userPrompt = buildMemoryExtractionUserPrompt(
    existingProfile,
    conversations,
  );

  let extracted: ExtractedAgentUserProfile;
  try {
    const { object } = await generateObject({
      model: xai(input.model),
      schema: agentUserProfileSchema,
      system: MEMORY_EXTRACTION_SYSTEM,
      prompt: userPrompt,
      temperature: 0,
      maxOutputTokens: MEMORY_EXTRACTION_MAX_OUTPUT_TOKENS,
    });
    extracted = object;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[forge-memory] generateObject failed', error);
    }
    return { ran: false, reason: 'extraction-failed' };
  }

  const merged = mergeProfiles(existingProfile, extracted, scriptCount);

  try {
    await upsertAgentMemory(input.userId, merged);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[forge-memory] upsert failed', error);
    }
    return { ran: false, reason: 'persist-failed' };
  }

  return { ran: true };
}
