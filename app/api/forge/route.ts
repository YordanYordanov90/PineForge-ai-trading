import { xai } from '@ai-sdk/xai';
import { stepCountIs, streamText, type ModelMessage } from 'ai';
import { apiError } from '@/lib/api/envelope';
import { refreshStreamLock } from '@/lib/rate-limit/concurrency';
import { buildForgeSystemPrompt } from '@/lib/agent/system-prompt';
import { buildForgeTools } from '@/lib/agent/build-forge-tools';
import { buildUserAgentMessage } from '@/lib/agent/persist-turn';
import { agentHistoryToModelMessages } from '@/lib/agent/agent-history-to-model';
import { runForgePreflight } from '@/lib/agent/forge-preflight';
import { handleForgeTurnFinish } from '@/lib/agent/forge-turn-finish';
import { FORGE_AGENT_MAX_STEPS } from '@/lib/config/constants';
import { devWarn } from '@/lib/dev-log';

/**
 * Forge Agent streaming endpoint.
 * Auth, rate limit, lock, memory injection, tool calling, persistence, tips, extraction.
 */
export async function POST(req: Request) {
  const preflight = await runForgePreflight(req);
  if (!preflight.ok) return preflight.response;

  const { ctx } = preflight;
  const systemPrompt = buildForgeSystemPrompt(
    ctx.profile,
    ctx.scriptContext,
    ctx.conversation.type,
  );
  const userAgentMessage = buildUserAgentMessage(ctx.message);
  const modelMessages: ModelMessage[] = [
    ...agentHistoryToModelMessages(ctx.conversation.messages),
    { role: 'user', content: ctx.message },
  ];
  const isFirstExchange = ctx.conversation.title == null;

  const tools = buildForgeTools({
    userId: ctx.userId,
    clerkId: ctx.guard.userId,
    plan: ctx.guard.plan,
    model: ctx.model,
    signal: req.signal,
  });

  try {
    const result = streamText({
      model: xai(ctx.model),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(FORGE_AGENT_MAX_STEPS),
      temperature: 0.4,
      abortSignal: req.signal,
      onAbort: () => {
        void ctx.releaseLock();
      },
      onStepFinish: () => {
        void refreshStreamLock(ctx.guard.userId, 'forge');
      },
      onFinish: async (event) => {
        await handleForgeTurnFinish({
          userId: ctx.userId,
          conversationId: ctx.conversationId,
          message: ctx.message,
          conversation: ctx.conversation,
          profile: ctx.profile,
          model: ctx.model,
          userAgentMessage,
          isFirstExchange,
          steps: event.steps,
          signal: req.signal,
          releaseLock: ctx.releaseLock,
        });
      },
      onError: ({ error }) => {
        devWarn('[forge] stream error', error);
        void ctx.releaseLock();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    devWarn('[forge] streamText threw', error);
    await ctx.releaseLock();
    return apiError('Forge encountered an error. Please try again.', 502);
  }
}