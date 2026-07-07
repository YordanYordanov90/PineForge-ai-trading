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
import { devWarn } from '@/lib/dev-log';

/**
 * Background memory profile extraction (spec 56).
 * Runs post-stream in onFinish; uses generateObject + merge with debounce.
 * Never counts against user quota; owner-scoped only.
 */

export const MIN_USER_MESSAGES_FOR_EXTRACTION = 4;
export const EXTRACTION_DEBOUNCE_MS = 60 * 60 * 1000;
export const RECENT_CONVERSATIONS_LIMIT = 3;

const PER_CONVERSATION_CHAR_BUDGET = 8000;

const MEMORY_EXTRACTION_MAX_OUTPUT_TOKENS = 800;

/** Zod schema for extraction (tighter enum etc than storage profile). */
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
  // Internal append-only list of shown tip ids (never from LLM).
  seenTips: z
    .array(z.string().max(40))
    .max(50)
    .optional()
    .describe('Internal bookkeeping (do not modify).'),
});

export type ExtractedAgentUserProfile = z.infer<typeof agentUserProfileSchema>;

export const MEMORY_EXTRACTION_SYSTEM = `You are a preference extraction assistant. Given a user's recent conversations with a Pine Script strategy assistant, extract or update their trading preferences profile.

Rules:
- Only extract preferences that are clearly stated or strongly implied
- Do not invent preferences the user hasn't shown
- Preserve existing preferences unless the user explicitly contradicts them
- Keep insights actionable and specific (not generic observations)
- Cap arrays at their maximum lengths`;

/** Strips internal bookkeeping before sending profile JSON to the LLM. */
function profileWithoutSeenTips(
  profile: AgentUserProfile,
): Omit<AgentUserProfile, 'seenTips'> {
  const { seenTips, ...rest } = profile;
  void seenTips;
  return rest;
}

/** Pure builder for the extraction user prompt (profile + recent conv excerpts). */
export function buildMemoryExtractionUserPrompt(
  existingProfile: AgentUserProfile,
  conversations: SavedConversation[],
): string {
  const profileForPrompt = profileWithoutSeenTips(existingProfile);

  const profileSection =
    Object.keys(profileForPrompt).length === 0
      ? 'No profile yet.'
      : JSON.stringify(profileForPrompt, null, 2);

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

/** Count user messages (used to decide if extraction has enough signal). */
export function countUserMessages(messages: ReadonlyArray<AgentMessage>): number {
  let n = 0;
  for (const m of messages) {
    if (m.role === 'user') n += 1;
  }
  return n;
}

/** Array merge with cap + case-insensitive dedup (newest survive on overflow). */
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

/** Insights merge: append + lowercase dedup + cap (oldest evicted). */
function mergeInsights(
  existing: string[] | undefined,
  extracted: string[] | undefined,
  cap: number,
): string[] | undefined {
  return uniqueMerge(existing, extracted, cap, true);
}

/**
 * Merge extracted profile into existing (additive arrays with cap, scalar replace).
 * Script count and lastExtractedAt are always server-authoritative.
 */
export function mergeProfiles(
  existing: AgentUserProfile,
  extracted: ExtractedAgentUserProfile,
  scriptCount: number,
): AgentUserProfile {
  const mergedSeen = uniqueMerge(
    existing.seenTips,
    extracted.seenTips,
    50,
    false,
  );

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
    seenTips: mergedSeen,
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

async function getMemoryExtractionSkipReason(
  userId: number,
  messages: ReadonlyArray<AgentMessage>,
): Promise<MaybeExtractMemoryReason | null> {
  if (countUserMessages(messages) < MIN_USER_MESSAGES_FOR_EXTRACTION) {
    return 'too-few-user-messages';
  }

  const lastUpdated = await getMemoryLastUpdated(userId);
  if (
    lastUpdated &&
    Date.now() - lastUpdated.getTime() < EXTRACTION_DEBOUNCE_MS
  ) {
    return 'debounced';
  }

  return null;
}

async function extractProfileViaLlm(
  model: GrokModelId,
  userPrompt: string,
): Promise<ExtractedAgentUserProfile | null> {
  try {
    const { object } = await generateObject({
      model: xai(model),
      schema: agentUserProfileSchema,
      system: MEMORY_EXTRACTION_SYSTEM,
      prompt: userPrompt,
      temperature: 0,
      maxOutputTokens: MEMORY_EXTRACTION_MAX_OUTPUT_TOKENS,
    });
    return object;
  } catch (error) {
    devWarn('[forge-memory] generateObject failed', error);
    return null;
  }
}

async function persistMergedProfile(
  userId: number,
  merged: AgentUserProfile,
): Promise<boolean> {
  try {
    await upsertAgentMemory(userId, merged);
    return true;
  } catch (error) {
    devWarn('[forge-memory] upsert failed', error);
    return false;
  }
}

/**
 * Runs extraction when trigger conditions met (min messages + debounce).
 * Fire-and-forget; failures are silent and never affect the chat UX.
 * Always called after the user stream has completed.
 */
export async function maybeExtractAndPersistMemory(
  input: MaybeExtractMemoryInput,
): Promise<MaybeExtractMemoryResult> {
  const skipReason = await getMemoryExtractionSkipReason(
    input.userId,
    input.conversation.messages,
  );
  if (skipReason) {
    return { ran: false, reason: skipReason };
  }

  const [existingProfile, conversations, scriptCount] = await Promise.all([
    getAgentMemoryForUser(input.userId),
    listRecentConversationsWithMessages(input.userId, RECENT_CONVERSATIONS_LIMIT),
    getScriptCountForUser(input.userId),
  ]);

  if (conversations.length === 0) {
    return { ran: false, reason: 'no-conversations' };
  }

  const userPrompt = buildMemoryExtractionUserPrompt(existingProfile, conversations);
  const extracted = await extractProfileViaLlm(input.model, userPrompt);
  if (!extracted) {
    return { ran: false, reason: 'extraction-failed' };
  }

  const merged = mergeProfiles(existingProfile, extracted, scriptCount);
  const persisted = await persistMergedProfile(input.userId, merged);
  if (!persisted) {
    return { ran: false, reason: 'persist-failed' };
  }

  return { ran: true };
}
