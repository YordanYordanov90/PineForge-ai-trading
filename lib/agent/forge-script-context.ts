import 'server-only';

import { db } from '@/lib/db/client';
import { rowToSavedScript } from '@/lib/db';
import { scripts } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

export type ForgeScriptContext = {
  title: string;
  prompt: string;
  script: string;
  tags?: string[];
};

/**
 * Loads the optional `scriptId` seeded by `/forge?scriptId=<id>`.
 * Owner-scoped — foreign or missing scripts return `undefined`.
 */
export async function loadForgeScriptContext(
  userId: number,
  scriptId: number | null,
): Promise<ForgeScriptContext | undefined> {
  if (scriptId == null) return undefined;

  const [row] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);
  if (!row) return undefined;

  const saved = rowToSavedScript(row);
  return {
    title: saved.name,
    prompt: saved.prompt,
    script: saved.script,
    tags: saved.tags,
  };
}