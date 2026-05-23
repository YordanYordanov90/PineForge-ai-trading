import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { agentConversations, scripts } from '@/drizzle/schema';
import type { AgentMessage, SavedConversation } from '@/lib/types/agent';
import { MAX_CONVERSATIONS_PER_USER } from '@/lib/config/constants';
import { db } from './client';
import {
  rowToAgentConversation,
  rowToAgentConversationSummary,
  type AgentConversationSummaryRow,
} from './agent-mapper';

/**
 * Forge Agent conversation DB helpers (spec 54).
 *
 * Every helper is owner-scoped — the `userId` parameter is always part
 * of the WHERE clause so cross-user reads/writes are structurally
 * impossible. The CRUD routes layer on top of these and own the HTTP
 * semantics (400 / 403 / 404 / 409); these helpers stay focused on the
 * SQL surface.
 */

/**
 * Lists the user's most recent conversations ordered by `updated_at`
 * desc. Capped at {@link MAX_CONVERSATIONS_PER_USER} which matches the
 * storage cap enforced by {@link createConversation} (FIFO eviction).
 *
 * Deliberately omits the `messages` jsonb column from the select — the
 * list view doesn't render thread bodies and loading every thread in
 * full would blow up payload size on power users. Detail loads happen
 * via {@link getConversationForUser}.
 */
export async function listConversationsForUser(
  userId: number,
): Promise<SavedConversation[]> {
  const rows: AgentConversationSummaryRow[] = await db
    .select({
      id: agentConversations.id,
      title: agentConversations.title,
      scriptId: agentConversations.scriptId,
      createdAt: agentConversations.createdAt,
      updatedAt: agentConversations.updatedAt,
    })
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(desc(agentConversations.updatedAt))
    .limit(MAX_CONVERSATIONS_PER_USER);

  return rows.map(rowToAgentConversationSummary);
}

/**
 * Loads the user's N most-recently-updated conversations including the
 * full `messages` array. Used exclusively by spec 56's memory extractor
 * — the sidebar list path uses {@link listConversationsForUser} which
 * drops the heavy `messages` column.
 *
 * Bounded by the caller-supplied `limit` (spec 56 passes 3) so payload
 * size stays predictable even for power users with 50 conversations
 * full of long threads.
 */
export async function listRecentConversationsWithMessages(
  userId: number,
  limit: number,
): Promise<SavedConversation[]> {
  if (limit <= 0) return [];
  const rows = await db
    .select()
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(desc(agentConversations.updatedAt))
    .limit(limit);

  return rows.map(rowToAgentConversation);
}

/**
 * Loads a single conversation including the full `messages` array.
 * Owner-scoped via `eq(userId, userId)` so a non-owner caller receives
 * `null` and the route returns 404 (no existence leak).
 */
export async function getConversationForUser(
  userId: number,
  conversationId: number,
): Promise<SavedConversation | null> {
  const [row] = await db
    .select()
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .limit(1);

  return row ? rowToAgentConversation(row) : null;
}

/**
 * Verifies the script exists and belongs to the caller. Used by
 * {@link createConversation} when a `scriptId` is supplied as initial
 * context — returns `true` only when the script row is present *and*
 * the `user_id` matches, so cross-user attaches are impossible.
 */
async function scriptIsOwnedByUser(
  userId: number,
  scriptId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: scripts.id })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  return row != null;
}

/**
 * Outcome of a {@link createConversation} call. Owner-not-found and
 * foreign-script attempts are surfaced as discriminated values so the
 * HTTP layer can map them to 403 without leaking row existence.
 */
export type CreateConversationResult =
  | { ok: true; conversation: SavedConversation }
  | { ok: false; reason: 'script-not-owned' };

/**
 * Creates a new conversation with an empty `messages` array. When the
 * user already has {@link MAX_CONVERSATIONS_PER_USER} conversations,
 * the oldest one (by `updated_at` ascending) is deleted first to make
 * room — spec 54's "FIFO eviction, no pinned conversations in v1".
 *
 * `scriptId` is verified server-side before insert; an unowned or
 * missing script returns `{ ok: false, reason: 'script-not-owned' }`.
 */
export async function createConversation(
  userId: number,
  scriptId: number | null,
): Promise<CreateConversationResult> {
  if (scriptId != null) {
    const owned = await scriptIsOwnedByUser(userId, scriptId);
    if (!owned) {
      return { ok: false, reason: 'script-not-owned' };
    }
  }

  const existing = await db
    .select({
      id: agentConversations.id,
    })
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(asc(agentConversations.updatedAt))
    .limit(MAX_CONVERSATIONS_PER_USER + 1);

  if (existing.length >= MAX_CONVERSATIONS_PER_USER) {
    const evictCount = existing.length - MAX_CONVERSATIONS_PER_USER + 1;
    const toEvict = existing.slice(0, evictCount);
    for (const row of toEvict) {
      await db
        .delete(agentConversations)
        .where(
          and(
            eq(agentConversations.id, row.id),
            eq(agentConversations.userId, userId),
          ),
        );
    }
  }

  const [created] = await db
    .insert(agentConversations)
    .values({
      userId,
      scriptId: scriptId ?? null,
      messages: [],
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create conversation');
  }

  return { ok: true, conversation: rowToAgentConversation(created) };
}

/**
 * Renames a conversation. Owner-scoped — both `id` and `user_id` are in
 * the WHERE clause so a foreign caller gets a `null` back and the route
 * returns 404 (caller-distinguishable from 403 only via a pre-check,
 * which the resolver helper performs first).
 *
 * Bumps `updated_at` so the rename floats the conversation to the top
 * of the list view.
 */
export async function updateConversationTitle(
  userId: number,
  conversationId: number,
  title: string,
): Promise<SavedConversation | null> {
  const [updated] = await db
    .update(agentConversations)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .returning();

  return updated ? rowToAgentConversation(updated) : null;
}

/**
 * Deletes a conversation. Owner-scoped via both `id` and `user_id` in
 * the WHERE clause. No referencing rows exist in the schema
 * (`agent_conversations` is a leaf table from spec 52), so the delete
 * is a straight row removal.
 */
export async function deleteConversation(
  userId: number,
  conversationId: number,
): Promise<void> {
  await db
    .delete(agentConversations)
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    );
}

/**
 * Appends new messages to a conversation's `messages` jsonb array and
 * bumps `updated_at`. Used exclusively by spec 55's streaming endpoint
 * after each exchange — these CRUD routes never call it directly.
 *
 * Owner-scoped: both `id` and `user_id` participate in the WHERE clause
 * so a stale conversationId from a different user is a no-op.
 *
 * The per-conversation message cap (200) is enforced by spec 55 before
 * calling this helper — keeping it here would couple two concerns and
 * make the streaming endpoint's intent less obvious.
 */
export async function appendMessages(
  conversationId: number,
  userId: number,
  newMessages: AgentMessage[],
): Promise<SavedConversation | null> {
  if (newMessages.length === 0) {
    return getConversationForUser(userId, conversationId);
  }

  const [updated] = await db
    .update(agentConversations)
    .set({
      messages: sql`${agentConversations.messages} || ${JSON.stringify(newMessages)}::jsonb`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId),
      ),
    )
    .returning();

  return updated ? rowToAgentConversation(updated) : null;
}
