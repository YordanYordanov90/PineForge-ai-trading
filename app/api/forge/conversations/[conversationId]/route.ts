import {
  deleteConversation,
  getConversationForUser,
  updateConversationScriptId,
  updateConversationTitle,
  verifyScriptOwnership,
} from '@/lib/db';
import { updateConversationSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { resolveOwnedConversationRoute } from '@/lib/api/resolve-owned-conversation-route';

type RouteContext = { params: Promise<{ conversationId: string }> };

/**
 * Loads a single Forge conversation including the full `messages`
 * array (spec 54 → GET detail). Owner-scoped via the resolver, which
 * surfaces 400 (bad id) / 403 (not yours) / 404 (gone) per spec.
 *
 * After the ownership pre-check passes, the loader runs a second
 * SELECT that pulls the full row. Two queries is intentional — the
 * resolver is shared with PATCH/DELETE which don't need the body, so
 * folding the body fetch into the resolver would over-fetch for
 * the mutation paths.
 */
export async function GET(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { conversationId: conversationIdParam } = await context.params;
  const route = await resolveOwnedConversationRoute(
    guard.ctx.userId,
    conversationIdParam,
  );
  if (!route.ok) return route.response;

  const conversation = await getConversationForUser(
    route.userId,
    route.conversationId,
  );

  if (!conversation) {
    return apiError('Conversation not found', 404);
  }

  return apiSuccess({ conversation });
}

/**
 * Renames a conversation (spec 54 → PATCH). v1 only supports title;
 * the message body is owned exclusively by the streaming endpoint
 * (spec 55) so this route never touches `messages`. The update bumps
 * `updated_at` so the rename also floats the conversation to the top
 * of the list view.
 */
export async function PATCH(req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { conversationId: conversationIdParam } = await context.params;
  const route = await resolveOwnedConversationRoute(
    guard.ctx.userId,
    conversationIdParam,
  );
  if (!route.ok) return route.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = updateConversationSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const { title, scriptId } = parsed.data;

  // At least one field must be present for a meaningful update.
  if (title === undefined && scriptId === undefined) {
    return apiInvalidRequest();
  }

  let updated: Awaited<ReturnType<typeof updateConversationTitle>> = null;

  // Handle script attach / change / detach first (spec 61.2).
  if (scriptId !== undefined) {
    // Extra belt-and-suspenders ownership check for the explicit null case
    // (the DB helper already does the positive-number check).
    if (scriptId != null) {
      const owned = await verifyScriptOwnership(route.userId, scriptId);
      if (!owned) {
        return apiError('Script does not belong to this user', 403);
      }
    }

    updated = await updateConversationScriptId(
      route.userId,
      route.conversationId,
      scriptId,
    );

    if (!updated) {
      // Either ownership race or DB failure; treat as 403 for foreign script
      // to avoid leaking existence.
      return apiError('Cannot attach this script', 403);
    }
  }

  // Handle title rename (can be combined with scriptId change in one call).
  if (title !== undefined) {
    const titleUpdated = await updateConversationTitle(
      route.userId,
      route.conversationId,
      title,
    );
    if (titleUpdated) {
      updated = titleUpdated;
    } else if (!updated) {
      // Title-only failure path (no prior scriptId change succeeded).
      return apiError('Failed to update conversation', 500);
    }
  }

  if (!updated) {
    return apiError('Failed to update conversation', 500);
  }

  return apiSuccess({ conversation: updated });
}

/**
 * Deletes a conversation and all its messages (spec 54 → DELETE).
 *
 * No FK cascade concerns — `agent_conversations` is a leaf table
 * (nothing references its id) so a straight row delete is sufficient.
 * Both `id` and `user_id` participate in the WHERE clause via the
 * helper so cross-user deletes are structurally impossible even if
 * the resolver were bypassed.
 */
export async function DELETE(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { conversationId: conversationIdParam } = await context.params;
  const route = await resolveOwnedConversationRoute(
    guard.ctx.userId,
    conversationIdParam,
  );
  if (!route.ok) return route.response;

  await deleteConversation(route.userId, route.conversationId);

  return apiSuccess({ ok: true });
}
