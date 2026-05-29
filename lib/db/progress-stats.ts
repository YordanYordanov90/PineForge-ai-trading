import 'server-only';

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import type { HealthScoreResult } from '@/lib/api/validation';
import { db } from './client';
import { getAgentMemoryForUser } from './agent-memory';
import type { AgentUserProfile } from '@/lib/types/agent';

/**
 * Progress dashboard aggregation (spec 65).
 * All queries are strictly user-scoped. No cross-user data.
 */

export type WeeklyHealthPoint = {
  week: string; // e.g. "Oct 06" or "2025-W40"
  avg: number;
  count: number;
};

export type RiskThemeCount = {
  theme: string;
  count: number;
};

export type MostRefinedScript = {
  id: number;
  title: string;
  version: number;
};

export type ProgressStats = {
  weeklyHealthScores: WeeklyHealthPoint[];
  topRiskThemes: RiskThemeCount[];
  avgRefinementDepth: number;
  mostRefinedScripts: MostRefinedScript[];
  memoryInsights: string[];
  totalScripts: number;
  totalScoredScripts: number;
  scriptsThisMonth: number;
  scriptsLastMonth: number;
  highestScore: { score: number; scriptId: number; title: string } | null;
};

const WEEKS_BACK = 8;

/** Returns ISO week label for a date (Mon start) */
function weekLabel(d: Date): string {
  const year = d.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}`;
}

/** Compute Monday of the week for bucketing */
function weekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export async function getProgressStats(userId: number): Promise<ProgressStats> {
  // 1. Fetch all user scripts (no artificial cap for personal stats)
  const rows = await db
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

  const totalScripts = rows.length;

  // Health-bearing scripts
  type Scored = { id: number; title: string; createdAt: Date; health: HealthScoreResult };
  const scored: Scored[] = [];
  for (const r of rows) {
    const meta = (r.metadata ?? {}) as { healthScore?: HealthScoreResult | null };
    if (meta.healthScore && typeof meta.healthScore.score === 'number') {
      scored.push({
        id: r.id,
        title: r.title?.trim() || 'Untitled strategy',
        createdAt: r.createdAt ?? new Date(),
        health: meta.healthScore,
      });
    }
  }
  const totalScoredScripts = scored.length;

  // Weekly health (last 8 weeks)
  const now = new Date();
  const cutoff = new Date(now.getTime() - 8 * 7 * 86400000);
  const recentScored = scored.filter((s) => s.createdAt >= cutoff);

  const byWeek = new Map<string, { sum: number; count: number }>();
  for (const s of recentScored) {
    const ws = weekStart(new Date(s.createdAt));
    const entry = byWeek.get(ws) ?? { sum: 0, count: 0 };
    entry.sum += s.health.score;
    entry.count += 1;
    byWeek.set(ws, entry);
  }

  const weeklyHealthScores: WeeklyHealthPoint[] = Array.from(byWeek.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-WEEKS_BACK)
    .map(([ws, v]) => ({
      week: weekLabel(new Date(ws)),
      avg: Math.round((v.sum / v.count) * 10) / 10,
      count: v.count,
    }));

  // Risk themes (top 3) via pure static patterns
  const { aggregateTopRiskThemes } = await import('@/lib/progress/risk-theme-patterns');
  const riskAgg = aggregateTopRiskThemes(
    scored.map((s) => ({ healthScore: s.health })),
    3,
  );
  const topRiskThemes: RiskThemeCount[] = riskAgg.map((r) => ({
    theme: r.theme,
    count: r.count,
  }));

  // Refinement depth: per lineage root, max version in the chain; average across roots.
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const maxVersionByRoot = new Map<number, number>();

  const resolveRootId = (row: (typeof rows)[number]): number => {
    let current = row;
    const seen = new Set<number>();
    while (current.parentId != null) {
      if (seen.has(current.id)) break;
      seen.add(current.id);
      const parent = rowsById.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current.id;
  };

  for (const r of rows) {
    const rootId = resolveRootId(r);
    const v = r.version ?? 1;
    maxVersionByRoot.set(rootId, Math.max(maxVersionByRoot.get(rootId) ?? 0, v));
  }

  const lineageDepths = [...maxVersionByRoot.values()];
  const avgRefinementDepth =
    lineageDepths.length > 0
      ? Math.round((lineageDepths.reduce((a, b) => a + b, 0) / lineageDepths.length) * 10) / 10
      : 0;

  const mostRefinedScripts = rows
    .filter((r) => (r.version ?? 1) > 1)
    .map((r) => ({
      id: r.id,
      title: r.title?.trim() || 'Untitled strategy',
      version: r.version ?? 1,
    }))
    .sort((a, b) => b.version - a.version)
    .slice(0, 5);

  // Month over month counts (calendar month)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let scriptsThisMonth = 0;
  let scriptsLastMonth = 0;
  for (const r of rows) {
    const c = r.createdAt ?? new Date(0);
    if (c >= thisMonthStart) scriptsThisMonth++;
    else if (c >= lastMonthStart && c <= lastMonthEnd) scriptsLastMonth++;
  }

  // Highest ever
  let highestScore: ProgressStats['highestScore'] = null;
  for (const s of scored) {
    if (!highestScore || s.health.score > highestScore.score) {
      highestScore = { score: s.health.score, scriptId: s.id, title: s.title };
    }
  }

  // Forge memory insights (plain English, prefer pre-extracted, else cheap derivation)
  const profile: AgentUserProfile = await getAgentMemoryForUser(userId);
  const memoryInsights: string[] = [];
  if (profile.insights && profile.insights.length > 0) {
    memoryInsights.push(...profile.insights.slice(0, 3));
  } else {
    if (profile.preferredMarkets?.length) {
      memoryInsights.push(`You've been focusing on ${profile.preferredMarkets.slice(0, 2).join(' and ')} markets recently.`);
    }
    if (profile.preferredTimeframes?.length) {
      const tf = profile.preferredTimeframes[0];
      memoryInsights.push(`Your most-used timeframe is ${tf}.`);
    }
    if (profile.strategyPatterns?.length) {
      memoryInsights.push(`Common patterns: ${profile.strategyPatterns.slice(0, 2).join(', ')}.`);
    }
    if (memoryInsights.length === 0 && profile.totalStrategiesGenerated) {
      memoryInsights.push(`You've generated ${profile.totalStrategiesGenerated} strategies so far.`);
    }
  }

  return {
    weeklyHealthScores,
    topRiskThemes,
    avgRefinementDepth,
    mostRefinedScripts,
    memoryInsights: memoryInsights.slice(0, 3),
    totalScripts,
    totalScoredScripts,
    scriptsThisMonth,
    scriptsLastMonth,
    highestScore,
  };
}
