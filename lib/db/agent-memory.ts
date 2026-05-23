import 'server-only';

import { eq, sql } from 'drizzle-orm';
import { agentMemory, scripts } from '@/drizzle/schema';
import type { AgentUserProfile } from '@/lib/types/agent';
import { db } from './client';
import { rowToAgentMemory } from './agent-mapper';

/**
 * Forge Agent long-term memory helpers.
 *
 * Read path (`getAgentMemoryForUser`) is consumed by spec 55's streaming
 * endpoint to inject the structured profile into the system prompt on
 * every turn. Write path (`upsertAgentMemory`) + debounce read
 * (`getMemoryLastUpdated`) + denormalized script count
 * (`getScriptCountForUser`) are spec 56's surface — the post-exchange
 * memory extractor calls them in this exact order:
 *
 *   1. `getMemoryLastUpdated(userId)` — bail if extracted in the last hour
 *   2. `getAgentMemoryForUser(userId)` + `getScriptCountForUser(userId)`
 *      in parallel for the merge inputs
 *   3. `upsertAgentMemory(userId, mergedProfile)` — single-row write,
 *      conflict-target the unique-by-user index from spec 52
 *
 * Every helper is owner-scoped via `eq(userId, userId)` against the
 * `agent_memory` (or `scripts`) table so cross-user reads/writes are
 * structurally impossible.
 */

/**
 * Returns the structured user profile injected into the system prompt
 * (spec 55). Empty `{}` until spec 56 starts populating it via the
 * extractor — the system prompt simply omits the memory section in that
 * case so a brand-new user has no degraded experience.
 */
export async function getAgentMemoryForUser(
  userId: number,
): Promise<AgentUserProfile> {
  const [row] = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.userId, userId))
    .limit(1);

  return row ? rowToAgentMemory(row) : {};
}

/**
 * Returns the row's `updated_at` for the debounce check in spec 56's
 * extractor — `null` when no profile has been extracted yet (extractor
 * proceeds), a `Date` when a previous extraction is on file (extractor
 * compares against the 1-hour window).
 *
 * Selects only the timestamp column (not the full profile jsonb) so the
 * debounce check stays cheap on every Forge turn.
 */
export async function getMemoryLastUpdated(
  userId: number,
): Promise<Date | null> {
  const [row] = await db
    .select({ updatedAt: agentMemory.updatedAt })
    .from(agentMemory)
    .where(eq(agentMemory.userId, userId))
    .limit(1);

  return row?.updatedAt ?? null;
}

/**
 * Insert-or-update the user's profile row in a single statement. The
 * `agent_memory_user_id_unique_idx` from spec 52 is the conflict target
 * — exactly one row per user, so re-running the extractor never bloats
 * the table. `updated_at` is bumped on every write so the debounce
 * helper above sees the right wall-clock value on the next turn.
 *
 * Owner-scoped by construction: the `user_id` column is the unique
 * constraint, so a stale or foreign id can never write into another
 * user's row.
 */
export async function upsertAgentMemory(
  userId: number,
  profile: AgentUserProfile,
): Promise<void> {
  const now = new Date();
  await db
    .insert(agentMemory)
    .values({ userId, profile, updatedAt: now })
    .onConflictDoUpdate({
      target: agentMemory.userId,
      set: { profile, updatedAt: now },
    });
}

/**
 * Counts the user's script rows for the denormalized
 * `totalStrategiesGenerated` field on the profile (spec 56 § Output
 * Schema — "computed from a simple count(*) on the user's scripts
 * table, not extracted from conversations"). Single integer round-trip
 * via the existing `(user_id, created_at)` composite index.
 *
 * Lives next to the memory write path because the extractor is the
 * only consumer; keeping it here avoids inflating `list-user-scripts.ts`
 * with a helper unrelated to the history list path.
 */
export async function getScriptCountForUser(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scripts)
    .where(eq(scripts.userId, userId));

  return row?.count ?? 0;
}
