import {
  createConversation,
  ensureDbUserForClerkId,
  getDbUserIdByClerk,
  listConversationsForUser,
} from '@/lib/db';
import { createConversationSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';

/**
 * Lists the caller's Forge conversations (spec 54 → GET).
 *
 * Soft-empty pattern: signed-in callers without a DB user row yet
 * (sign-up race before the user sync runs) get `{ conversations: [] }`
 * rather than a 404, so the `/forge` UI can render an empty sidebar
 * without an error state. Conversations are returned in
 * `updated_at desc` order, capped at the storage cap, and never
 * include the `messages` array — detail loads happen via the per-id
 * route.
 */
export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiSuccess({ conversations: [] });
  }

  const conversations = await listConversationsForUser(userId);

  return apiSuccess({ conversations });
}

/**
 * Creates a new Forge conversation (spec 54 → POST).
 *
 * Auto-provisions a DB user row via `ensureDbUserForClerkId` so a
 * freshly-signed-in user can start chatting before the background user
 * sync resolves. When `scriptId` is supplied, the helper verifies the
 * script belongs to the caller — a foreign or missing script returns
 * 403 (no row-existence leak per spec). If the user already has
 * `MAX_CONVERSATIONS_PER_USER` conversations, the helper evicts the
 * oldest by `updated_at` before inserting (FIFO; no pinned
 * conversations in v1).
 */
export async function POST(req: Request) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await ensureDbUserForClerkId(guard.ctx.userId);

  const body: unknown = await req.json().catch(() => null);
  const parsed = createConversationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const convoType = parsed.data.type ?? 'general';
  const result = await createConversation(
    userId,
    parsed.data.scriptId ?? null,
    convoType,
  );

  if (!result.ok) {
    if (result.reason === 'script-not-owned') {
      return apiError('Forbidden', 403);
    }
    return apiError('Failed to create conversation', 500);
  }

  return apiSuccess({ conversation: result.conversation });
}
