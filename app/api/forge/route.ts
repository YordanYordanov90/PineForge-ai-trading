import { xai } from '@ai-sdk/xai';
import { stepCountIs, streamText, type ModelMessage } from 'ai';
import { apiError, apiInvalidRequest } from '@/lib/api/envelope';
import { jsonApiError, protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import {
  acquireStreamLock,
  bindStreamLockRelease,
  refreshStreamLock,
} from '@/lib/rate-limit/concurrency';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import {
  appendMessages,
  getAgentMemoryForUser,
  getConversationForUser,
  getDbUserIdByClerk,
  rowToSavedScript,
  updateConversationTitle,
} from '@/lib/db';
import { db } from '@/lib/db/client';
import { scripts } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { forgeMessageSchema } from '@/lib/api/validation';
import {
  FORGE_AGENT_MAX_STEPS,
  MAX_MESSAGES_PER_CONVERSATION,
} from '@/lib/config/constants';
import { buildForgeSystemPrompt } from '@/lib/agent/system-prompt';
import { buildForgeTools } from '@/lib/agent/build-forge-tools';
import {
  buildUserAgentMessage,
  generateConversationTitle,
  stepsToAgentMessages,
} from '@/lib/agent/persist-turn';
import { maybeExtractAndPersistMemory } from '@/lib/agent/memory-extraction';
import type { AgentMessage } from '@/lib/types/agent';

/**
 * Forge Agent streaming endpoint (spec 55).
 *
 * Single POST handler. Owns:
 *   - auth + rate limit + plan via {@link protectAiRoute}
 *   - one-stream-per-user concurrency lock via {@link acquireStreamLock}
 *   - conversation ownership check (foreign / missing / message-cap)
 *   - long-term memory injection ({@link getAgentMemoryForUser})
 *   - optional active-script context ({@link conversation.scriptId})
 *   - `streamText` orchestration with the spec-53 forge tools
 *   - persistence of the turn + auto-title on first exchange
 *
 * Per spec § Scope Limits: this route does NOT own conversation CRUD
 * (spec 54), memory extraction (spec 56), the UI (spec 57), or the
 * canonical guardrails block (spec 58 — for now, the system prompt
 * carries a minimum-viable guardrail block; spec 58 will replace it).
 */
export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = forgeMessageSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const { conversationId, message } = parsed.data;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiError('User not found', 404);
  }

  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) {
    return apiError('Conversation not found.', 404);
  }

  if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
    return apiError(
      'This conversation has reached the message limit. Please start a new one.',
      400,
    );
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, undefined);
  if (!entitlement.ok) {
    return jsonApiError(403, entitlement.message);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const lock = await acquireStreamLock(guard.ctx.userId, 'forge');
  if (!lock.acquired) {
    return jsonApiError(409, 'A Forge conversation is already in progress.');
  }

  const releaseLock = bindStreamLockRelease(lock, req.signal);

  // Pre-stream IO that can fail without making the conversation broken — if
  // any of these throw we release the lock and return 502 so the user can
  // retry without orphaning a stream slot.
  let scriptContext: Awaited<ReturnType<typeof loadScriptContext>>;
  let profile: Awaited<ReturnType<typeof getAgentMemoryForUser>>;
  try {
    [profile, scriptContext] = await Promise.all([
      getAgentMemoryForUser(userId),
      loadScriptContext(userId, conversation.scriptId),
    ]);
  } catch {
    await releaseLock();
    return apiError('Forge encountered an error. Please try again.', 502);
  }

  const systemPrompt = buildForgeSystemPrompt(
    profile,
    scriptContext,
    conversation.type,
  );
  const userAgentMessage = buildUserAgentMessage(message);
  const modelMessages: ModelMessage[] = [
    ...agentHistoryToModelMessages(conversation.messages),
    { role: 'user', content: message },
  ];
  const isFirstExchange = conversation.title == null;

  const tools = buildForgeTools({
    userId,
    clerkId: guard.ctx.userId,
    plan: guard.ctx.plan,
    model: entitlement.model,
    signal: req.signal,
  });

  try {
    const result = streamText({
      model: xai(entitlement.model),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(FORGE_AGENT_MAX_STEPS),
      temperature: 0.4,
      abortSignal: req.signal,
      onAbort: () => {
        void releaseLock();
      },
      onStepFinish: () => {
        void refreshStreamLock(guard.ctx.userId, 'forge');
      },
      onFinish: async (event) => {
        let postTurnMessages: AgentMessage[] = conversation.messages;
        try {
          const newAgentMessages: AgentMessage[] = [
            userAgentMessage,
            ...stepsToAgentMessages(event.steps),
          ];

          postTurnMessages = [...conversation.messages, ...newAgentMessages];

          await appendMessages(conversationId, userId, newAgentMessages);

          if (isFirstExchange) {
            const title = await generateConversationTitle(
              message,
              entitlement.model,
              req.signal,
            );
            await updateConversationTitle(userId, conversationId, title);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[forge] persist-turn failed', error);
          }
        }

        // Spec 56 — fire-and-forget memory extraction. Runs *after* the
        // user has already received the stream, so any failure here is
        // silent and never surfaces in the chat. The helper owns its
        // own trigger / debounce checks.
        void maybeExtractAndPersistMemory({
          userId,
          conversation: { messages: postTurnMessages },
          model: entitlement.model,
        });

        void releaseLock();
      },
      onError: ({ error }) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[forge] stream error', error);
        }
        void releaseLock();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[forge] streamText threw', error);
    }
    await releaseLock();
    return apiError('Forge encountered an error. Please try again.', 502);
  }
}

/**
 * Loads the optional `scriptId` seeded by `/forge?scriptId=<id>`. Owner-
 * scoped — a foreign or missing script silently returns `undefined` so
 * the system prompt simply omits the active-script section. We never
 * surface a "script not yours" error here because the conversation row
 * was already verified to be the caller's, and the `scriptId` FK is
 * NOT cascaded — a script can be deleted after the conversation was
 * seeded, and that's a normal recoverable state.
 */
async function loadScriptContext(
  userId: number,
  scriptId: number | null,
): Promise<
  | undefined
  | {
      title: string;
      prompt: string;
      script: string;
      tags?: string[];
    }
> {
  if (scriptId == null) return undefined;

  const [row] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);
  if (!row) return undefined;

  const saved = rowToSavedScript(row);
  return {
    title: saved.name,
    prompt: saved.prompt,
    script: saved.script,
    tags: saved.tags,
  };
}

/**
 * Converts the persisted {@link AgentMessage} thread into AI SDK
 * {@link ModelMessage}s for the next turn.
 *
 * v1 conversion is text-only — assistant turns drop their `toolCalls`
 * payload and tool messages are skipped. Rationale: replaying the
 * exact tool-call/tool-result pairs into a fresh `streamText` adds
 * provider-specific edge cases (id format mismatch, content-array
 * vs string content) without much benefit, because the assistant
 * text already summarises what the tools returned. If a future spec
 * needs full replay, this single function is the only place to
 * upgrade.
 */
function agentHistoryToModelMessages(
  history: ReadonlyArray<AgentMessage>,
): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const msg of history) {
    if (msg.role === 'user') {
      if (msg.content.length > 0) {
        out.push({ role: 'user', content: msg.content });
      }
      continue;
    }
    if (msg.role === 'assistant') {
      if (msg.content.length > 0) {
        out.push({ role: 'assistant', content: msg.content });
      }
      continue;
    }
    // Tool messages are dropped in v1 — the assistant's follow-up
    // text in the next step already paraphrases the tool result.
  }
  return out;
}
