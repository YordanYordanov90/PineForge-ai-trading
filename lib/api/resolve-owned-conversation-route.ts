import { eq } from 'drizzle-orm';
import { agentConversations } from '@/drizzle/schema';
import { db, getDbUserIdByClerk } from '@/lib/db';
import { apiError } from '@/lib/api/envelope';
import { parsePositiveInt } from '@/lib/api/parse-route-id';

export type OwnedConversationRouteOk = {
  ok: true;
  userId: number;
  conversationId: number;
};
export type OwnedConversationRouteDenied = {
  ok: false;
  response: Response;
};

/**
 * Resolves the DB user + conversation id and asserts ownership for
 * narrow `/api/forge/conversations/[conversationId]/*` routes (spec 54).
 *
 * Spec 54 enumerates 403 and 404 as distinct outcomes for GET / PATCH /
 * DELETE on the detail route, so the resolver intentionally surfaces
 * both — "exists but owned by another user" → 403, "doesn't exist at
 * all" → 404. The existence leak here is deliberate per spec: agent
 * conversation ids are not enumerable from the client (no public list
 * of all conversation ids in the system) so the leak surface is
 * negligible compared with the UX benefit of "this conversation no
 * longer exists" vs "you're not allowed".
 *
 * - 400 — id segment is not a positive integer
 * - 404 — caller has no DB user row, or the conversation row is absent
 * - 403 — conversation exists but belongs to a different user
 *
 * Callers must pass an already-validated Clerk user id from
 * `protectDataRoute` — the session check is not duplicated here.
 */
export async function resolveOwnedConversationRoute(
  clerkUserId: string,
  conversationIdParam: string,
): Promise<OwnedConversationRouteOk | OwnedConversationRouteDenied> {
  const conversationId = parsePositiveInt(conversationIdParam);
  if (conversationId == null) {
    return {
      ok: false,
      response: apiError('Invalid conversation id', 400),
    };
  }

  const userId = await getDbUserIdByClerk(clerkUserId);
  if (userId == null) {
    return {
      ok: false,
      response: apiError('User not found', 404),
    };
  }

  const [existing] = await db
    .select({ userId: agentConversations.userId })
    .from(agentConversations)
    .where(eq(agentConversations.id, conversationId))
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      response: apiError('Conversation not found', 404),
    };
  }

  if (existing.userId !== userId) {
    return {
      ok: false,
      response: apiError('Forbidden', 403),
    };
  }

  return { ok: true, userId, conversationId };
}
