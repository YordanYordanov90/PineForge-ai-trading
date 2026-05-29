import type { HealthScoreResult } from '@/lib/api/validation';
import type { scripts } from '@/drizzle/schema';
import type { AgentUserProfile } from '@/lib/types/agent';
import { aggregateTopRiskThemes } from '@/lib/progress/risk-theme-patterns';

/**
 * Pure compute helpers for the Quality Progression dashboard (spec 65).
 *
 * No DB access, no `server-only` boundary — these functions take
 * already-loaded rows / profile data and produce dashboard slices.
 * Keep this file deterministic and side-effect free so it stays
 * trivially unit-testable.
 */

export type WeeklyHealthPoint = {
  week: string;
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

export type ScriptRow = {
  id: number;
  title: string | null;
  version: number | null;
  parentId: number | null;
  createdAt: Date | null;
  metadata: typeof scripts.$inferSelect.metadata;
};

export type ScoredScript = {
  id: number;
  title: string;
  createdAt: Date;
  health: HealthScoreResult;
};

export const WEEKS_BACK = 8;
const MS_PER_DAY = 86_400_000;
const TITLE_FALLBACK = 'Untitled strategy';

function weekLabel(d: Date): string {
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}`;
}

/** Monday of the week containing `d`, ISO-date keyed (YYYY-MM-DD). */
function weekStartKey(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export function extractScoredScripts(rows: ScriptRow[]): ScoredScript[] {
  const scored: ScoredScript[] = [];
  for (const r of rows) {
    const health = r.metadata?.healthScore;
    if (health && typeof health.score === 'number') {
      scored.push({
        id: r.id,
        title: r.title?.trim() || TITLE_FALLBACK,
        createdAt: r.createdAt ?? new Date(),
        health,
      });
    }
  }
  return scored;
}

export function computeWeeklyHealthScores(
  scored: ScoredScript[],
  now: Date,
): WeeklyHealthPoint[] {
  const cutoff = new Date(now.getTime() - WEEKS_BACK * 7 * MS_PER_DAY);
  const recent = scored.filter((s) => s.createdAt >= cutoff);

  const byWeek = new Map<string, { sum: number; count: number }>();
  for (const s of recent) {
    const key = weekStartKey(new Date(s.createdAt));
    const entry = byWeek.get(key) ?? { sum: 0, count: 0 };
    entry.sum += s.health.score;
    entry.count += 1;
    byWeek.set(key, entry);
  }

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-WEEKS_BACK)
    .map(([key, v]) => ({
      week: weekLabel(new Date(key)),
      avg: Math.round((v.sum / v.count) * 10) / 10,
      count: v.count,
    }));
}

/** Walk up `parentId` chain (with cycle guard) to the lineage root id. */
function resolveRootId(
  row: ScriptRow,
  rowsById: Map<number, ScriptRow>,
): number {
  let current = row;
  const seen = new Set<number>();
  while (current.parentId != null && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = rowsById.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

type RefinementDepthResult = {
  avgRefinementDepth: number;
  mostRefinedScripts: MostRefinedScript[];
};

export function computeRefinementDepth(
  rows: ScriptRow[],
): RefinementDepthResult {
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const maxVersionByRoot = new Map<number, number>();

  for (const r of rows) {
    const rootId = resolveRootId(r, rowsById);
    const v = r.version ?? 1;
    maxVersionByRoot.set(rootId, Math.max(maxVersionByRoot.get(rootId) ?? 0, v));
  }

  const lineageDepths = [...maxVersionByRoot.values()];
  const avgRefinementDepth =
    lineageDepths.length > 0
      ? Math.round(
          (lineageDepths.reduce((a, b) => a + b, 0) / lineageDepths.length) *
            10,
        ) / 10
      : 0;

  const mostRefinedScripts = rows
    .filter((r) => (r.version ?? 1) > 1)
    .map((r) => ({
      id: r.id,
      title: r.title?.trim() || TITLE_FALLBACK,
      version: r.version ?? 1,
    }))
    .sort((a, b) => b.version - a.version)
    .slice(0, 5);

  return { avgRefinementDepth, mostRefinedScripts };
}

export function computeMonthlyCounts(
  rows: ScriptRow[],
  now: Date,
): { scriptsThisMonth: number; scriptsLastMonth: number } {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let scriptsThisMonth = 0;
  let scriptsLastMonth = 0;
  for (const r of rows) {
    const c = r.createdAt ?? new Date(0);
    if (c >= thisMonthStart) scriptsThisMonth += 1;
    else if (c >= lastMonthStart && c <= lastMonthEnd) scriptsLastMonth += 1;
  }
  return { scriptsThisMonth, scriptsLastMonth };
}

export function computeHighestScore(
  scored: ScoredScript[],
): ProgressStats['highestScore'] {
  let best: ProgressStats['highestScore'] = null;
  for (const s of scored) {
    if (!best || s.health.score > best.score) {
      best = { score: s.health.score, scriptId: s.id, title: s.title };
    }
  }
  return best;
}

export function computeRiskThemes(scored: ScoredScript[]): RiskThemeCount[] {
  const agg = aggregateTopRiskThemes(
    scored.map((s) => ({ healthScore: s.health })),
    3,
  );
  return agg.map((r) => ({ theme: r.theme, count: r.count }));
}

export function deriveMemoryInsights(profile: AgentUserProfile): string[] {
  if (profile.insights && profile.insights.length > 0) {
    return profile.insights.slice(0, 3);
  }

  const insights: string[] = [];
  if (profile.preferredMarkets?.length) {
    insights.push(
      `You've been focusing on ${profile.preferredMarkets
        .slice(0, 2)
        .join(' and ')} markets recently.`,
    );
  }
  if (profile.preferredTimeframes?.length) {
    insights.push(
      `Your most-used timeframe is ${profile.preferredTimeframes[0]}.`,
    );
  }
  if (profile.strategyPatterns?.length) {
    insights.push(
      `Common patterns: ${profile.strategyPatterns.slice(0, 2).join(', ')}.`,
    );
  }
  if (insights.length === 0 && profile.totalStrategiesGenerated) {
    insights.push(
      `You've generated ${profile.totalStrategiesGenerated} strategies so far.`,
    );
  }
  return insights.slice(0, 3);
}
