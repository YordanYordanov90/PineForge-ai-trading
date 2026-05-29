import 'server-only';

import { desc, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db } from './client';
import { getAgentMemoryForUser } from './agent-memory';
import {
  computeHighestScore,
  computeMonthlyCounts,
  computeRefinementDepth,
  computeRiskThemes,
  computeWeeklyHealthScores,
  deriveMemoryInsights,
  extractScoredScripts,
  type ProgressStats,
  type ScriptRow,
} from './progress-stats-compute';

/**
 * Progress dashboard data loader (spec 65).
 *
 * Strictly user-scoped read of `scripts` + Forge memory. All shape
 * computation lives in `./progress-stats-compute` so this module stays
 * focused on the data-loading boundary.
 */

export type {
  MostRefinedScript,
  ProgressStats,
  RiskThemeCount,
  WeeklyHealthPoint,
} from './progress-stats-compute';

async function loadUserScriptRows(userId: number): Promise<ScriptRow[]> {
  return db
    .select({
      id: scripts.id,
      title: scripts.title,
      version: scripts.version,
      parentId: scripts.parentId,
      createdAt: scripts.createdAt,
      metadata: scripts.metadata,
    })
    .from(scripts)
    .where(eq(scripts.userId, userId))
    .orderBy(desc(scripts.createdAt));
}

export async function getProgressStats(
  userId: number,
): Promise<ProgressStats> {
  const now = new Date();
  const [rows, profile] = await Promise.all([
    loadUserScriptRows(userId),
    getAgentMemoryForUser(userId),
  ]);

  const scored = extractScoredScripts(rows);
  const { avgRefinementDepth, mostRefinedScripts } = computeRefinementDepth(rows);
  const { scriptsThisMonth, scriptsLastMonth } = computeMonthlyCounts(rows, now);

  return {
    weeklyHealthScores: computeWeeklyHealthScores(scored, now),
    topRiskThemes: computeRiskThemes(scored),
    avgRefinementDepth,
    mostRefinedScripts,
    memoryInsights: deriveMemoryInsights(profile),
    totalScripts: rows.length,
    totalScoredScripts: scored.length,
    scriptsThisMonth,
    scriptsLastMonth,
    highestScore: computeHighestScore(scored),
  };
}
