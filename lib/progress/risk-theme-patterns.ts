import type { HealthScoreResult } from '@/lib/api/validation';

/**
 * Static keyword pattern set for risk theme aggregation (spec 65).
 * Pure, deterministic, no LLM. Derived from HEALTH_SCORE_SYSTEM vocabulary
 * + the concrete examples in the 65 spec. ~20 curated patterns keep the
 * grouping simple and explainable to users.
 */

export type RiskThemePattern = {
  /** Case-insensitive substring or regex test against a single risk bullet */
  test: (risk: string) => boolean;
  /** Human label shown in the dashboard (e.g. "Missing volume filter") */
  label: string;
};

const PATTERNS: RiskThemePattern[] = [
  {
    test: (r) => /volume|vol\s*filter|volume\s*confirm/i.test(r),
    label: 'Missing volume filter',
  },
  {
    test: (r) => /confirm(ation)?|secondary\s*signal|additional\s*filter/i.test(r),
    label: 'No secondary confirmation signal',
  },
  {
    test: (r) => /ATR|volatil|average\s*true\s*range/i.test(r) && /stop|SL|stop.loss/i.test(r),
    label: 'Fixed stop-loss without ATR adjustment',
  },
  {
    test: (r) => /stop.?loss|hard.?stop|fixed.?stop/i.test(r) && !/ATR|volatil/i.test(r),
    label: 'Fixed / non-adaptive stop-loss',
  },
  {
    test: (r) => /overfit|too many|stacked|excessive.*condition|curve.?fit/i.test(r),
    label: 'Overfitting risk (too many stacked conditions)',
  },
  {
    test: (r) => /no (explicit )?exit|exit logic|only entry|missing.*(TP|target|profit)/i.test(r),
    label: 'Weak or missing exit logic',
  },
  {
    test: (r) => /no (stop|SL|risk management)|missing stop/i.test(r),
    label: 'Missing stop-loss / risk control',
  },
  {
    test: (r) => /position.?size|risk.?size|sizing|account.*percent/i.test(r) === false && /risk|money management/i.test(r),
    label: 'No explicit position sizing / risk rules',
  },
  {
    test: (r) => /ambiguous|unclear entry|signal clarity|entry.*(vague|not testable)/i.test(r),
    label: 'Ambiguous / hard-to-test entry signals',
  },
  {
    test: (r) => /trend|regime|market state|bull|bear|sideways/i.test(r) === false,
    label: 'No trend / regime filter',
  },
  {
    test: (r) => /session|time of day|kill.*zone|overlap/i.test(r) === false && /intraday|scalping/i.test(r),
    label: 'Missing session / time filter',
  },
  {
    test: (r) => /liquidity|spread|slippage|low.*volume|thin market/i.test(r),
    label: 'Low-liquidity / high-slippage exposure',
  },
  {
    test: (r) => /take.?profit|TP|target.*(level|multiple)/i.test(r) === false,
    label: 'No or weak take-profit targets',
  },
  {
    test: (r) => /max draw|daily loss|circuit breaker|kill switch/i.test(r) === false,
    label: 'No max-drawdown / daily loss circuit breaker',
  },
];

export const RISK_THEME_PATTERNS = PATTERNS;

/**
 * Classify a single risk bullet into the best matching theme label (or null).
 */
export function classifyRisk(risk: string): string | null {
  const trimmed = risk.trim();
  if (!trimmed) return null;
  for (const p of PATTERNS) {
    if (p.test(trimmed)) return p.label;
  }
  return null;
}

/**
 * Aggregate top recurring risk themes across many HealthScoreResults.
 * Returns up to `limit` themes sorted by count desc, with "found in X of Y" phrasing ready for UI.
 */
export function aggregateTopRiskThemes(
  scoredScripts: { healthScore: HealthScoreResult | null | undefined }[],
  limit = 3,
): { theme: string; count: number; totalScored: number }[] {
  let totalScored = 0;

  // Count each theme at most once per scored script (spec: "found in X of Y strategies").
  const counts = new Map<string, number>();
  for (const s of scoredScripts) {
    if (!s.healthScore?.risks?.length) continue;
    totalScored += 1;
    const themesInScript = new Set<string>();
    for (const risk of s.healthScore.risks) {
      const label = classifyRisk(risk);
      if (label) themesInScript.add(label);
    }
    for (const label of themesInScript) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  if (totalScored === 0) return [];

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([theme, count]) => ({ theme, count, totalScored }));
}
