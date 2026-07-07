import 'server-only';

import { apiError, apiInvalidRequest } from '@/lib/api/envelope';
import {
  jsonApiError,
  protectAiRoute,
  type ProtectedAiContext,
} from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import {
  acquireStreamLock,
  bindStreamLockRelease,
} from '@/lib/rate-limit/concurrency';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import {
  getAgentMemoryForUser,
  getConversationForUser,
  getDbUserIdByClerk,
} from '@/lib/db';
import { forgeMessageSchema } from '@/lib/api/validation';
import { MAX_MESSAGES_PER_CONVERSATION } from '@/lib/config/constants';
import { loadForgeScriptContext, type ForgeScriptContext } from '@/lib/agent/forge-script-context';
import type { AgentUserProfile, SavedConversation } from '@/lib/types/agent';
import type { GrokModelId } from '@/lib/types';

export type ForgePreflightContext = {
  guard: ProtectedAiContext;
  userId: number;
  conversationId: number;
  message: string;
  conversation: SavedConversation;
  model: GrokModelId;
  profile: AgentUserProfile;
  scriptContext: ForgeScriptContext | undefined;
  releaseLock: () => Promise<void>;
};

export async function runForgePreflight(
  req: Request,
): Promise<{ ok: true; ctx: ForgePreflightContext } | { ok: false; response: Response }> {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard;

  const body: unknown = await req.json().catch(() => null);
  const parsed = forgeMessageSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiInvalidRequest() };
  }

  const { conversationId, message } = parsed.data;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return { ok: false, response: apiError('User not found', 404) };
  }

  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) {
    return { ok: false, response: apiError('Conversation not found.', 404) };
  }

  if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
    return {
      ok: false,
      response: apiError(
        'This conversation has reached the message limit. Please start a new one.',
        400,
      ),
    };
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, undefined);
  if (!entitlement.ok) {
    return { ok: false, response: jsonApiError(403, entitlement.message) };
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return { ok: false, response: missingKey };

  const lock = await acquireStreamLock(guard.ctx.userId, 'forge');
  if (!lock.acquired) {
    return { ok: false, response: jsonApiError(409, 'A Forge conversation is already in progress.') };
  }

  const releaseLock = bindStreamLockRelease(lock, req.signal);

  try {
    const [profile, scriptContext] = await Promise.all([
      getAgentMemoryForUser(userId),
      loadForgeScriptContext(userId, conversation.scriptId),
    ]);

    return {
      ok: true,
      ctx: {
        guard: guard.ctx,
        userId,
        conversationId,
        message,
        conversation,
        model: entitlement.model,
        profile,
        scriptContext,
        releaseLock,
      },
    };
  } catch {
    await releaseLock();
    return { ok: false, response: apiError('Forge encountered an error. Please try again.', 502) };
  }
}