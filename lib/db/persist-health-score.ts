import { and, eq } from 'drizzle-orm';
import type { HealthScoreResult } from '@/lib/api/validation';
import { db, getDbUserIdByClerk } from '@/lib/db';
import { mergeScriptMetadata } from '@/lib/db/script-mapper';
import { scripts } from '@/drizzle/schema';

/**
 * Persists a Health Score result into `scripts.metadata.healthScore` when the
 * caller owns the script. No-op when the user or script row is missing.
 */
export async function persistHealthScoreIfOwned(
  clerkId: string,
  scriptId: number,
  result: HealthScoreResult,
): Promise<void> {
  const dbUserId = await getDbUserIdByClerk(clerkId);
  if (dbUserId == null) return;

  const [owned] = await db
    .select({ id: scripts.id, metadata: scripts.metadata })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, dbUserId)))
    .limit(1);

  if (!owned) return;

  const updated = mergeScriptMetadata(owned.metadata, {
    healthScore: result,
  });

  await db
    .update(scripts)
    .set({ metadata: updated, updatedAt: new Date() })
    .where(eq(scripts.id, owned.id));
}