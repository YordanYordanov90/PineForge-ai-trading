import { and, desc, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db } from './client';
import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';

type ScriptRow = typeof scripts.$inferSelect;

/**
 * Lists scripts for a signed-in user: up to {@link MAX_HISTORY_ENTRIES} by
 * recency, plus any older starred rows so pinned scripts are not dropped from
 * the history payload (spec 38).
 */
export async function listScriptsForUser(userId: number): Promise<ScriptRow[]> {
  const [recent, starredRows] = await Promise.all([
    db
      .select()
      .from(scripts)
      .where(eq(scripts.userId, userId))
      .orderBy(desc(scripts.createdAt))
      .limit(MAX_HISTORY_ENTRIES),
    db
      .select()
      .from(scripts)
      .where(and(eq(scripts.userId, userId), eq(scripts.isStarred, true)))
      .orderBy(desc(scripts.createdAt)),
  ]);

  const byId = new Map<number, ScriptRow>();
  for (const row of recent) {
    byId.set(row.id, row);
  }
  for (const row of starredRows) {
    byId.set(row.id, row);
  }

  return [...byId.values()].sort(
    (a, b) =>
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );
}
