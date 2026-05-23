import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db } from './client';
import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';

type ScriptRow = typeof scripts.$inferSelect;

export type SearchScriptsFilters = {
  /** Free-text query; matched against `title` and `metadata->>'prompt'`. */
  q?: string;
  /** Already-normalized tag list (lower-cased, deduped). Empty = no filter. */
  tags?: string[];
  /**
   * Star-state filter. `true` = only starred, `false` = only unstarred,
   * `undefined` = no filter.
   */
  starred?: boolean;
  /** When set, only rows in this collection are returned. */
  collectionId?: number;
};

/**
 * Escapes PostgreSQL `LIKE` / `ILIKE` wildcards so user-typed `%` and `_`
 * don't expand the match unexpectedly. The default escape character in
 * PostgreSQL is `\`, so `\%` becomes a literal percent sign.
 */
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Signed-in history search (spec 42).
 *
 * All conditions are ANDed with `eq(scripts.userId, userId)` so cross-user
 * leaks are structurally impossible. `q` is parameterized (no string
 * concatenation, no LIKE-wildcard injection); tag matching uses a jsonb
 * `@>` containment check; `starred` and `collectionId` are simple
 * equality filters. Results are ordered by recency and capped at
 * {@link MAX_HISTORY_ENTRIES} to bound payload size.
 */
export async function searchScriptsForUser(
  userId: number,
  filters: SearchScriptsFilters,
): Promise<ScriptRow[]> {
  const conditions: SQL[] = [eq(scripts.userId, userId)];

  if (filters.q && filters.q.length > 0) {
    const pattern = `%${escapeLikePattern(filters.q)}%`;
    const textMatch = or(
      ilike(scripts.title, pattern),
      sql`${scripts.metadata}->>'prompt' ILIKE ${pattern}`,
    );
    if (textMatch) conditions.push(textMatch);
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(
      sql`${scripts.tags} @> ${JSON.stringify(filters.tags)}::jsonb`,
    );
  }

  if (filters.starred === true) {
    conditions.push(eq(scripts.isStarred, true));
  } else if (filters.starred === false) {
    conditions.push(eq(scripts.isStarred, false));
  }

  if (filters.collectionId != null) {
    conditions.push(eq(scripts.collectionId, filters.collectionId));
  }

  return db
    .select()
    .from(scripts)
    .where(and(...conditions))
    .orderBy(desc(scripts.createdAt))
    .limit(MAX_HISTORY_ENTRIES);
}
