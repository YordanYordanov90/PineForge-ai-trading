import { FORGE_GUARDRAILS } from '@/lib/agent/guardrails';
import { COMPARISON_REPORT_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import type { SavedScript } from '@/lib/types';

export { COMPARISON_REPORT_MAX_OUTPUT_TOKENS };

/**
 * Truncates a Pine Script to the budget, appending a clear marker.
 * Keeps the head (imports + first logic) + tail (last functions) when needed,
 * but for v1 we simply slice with headroom for context.
 */
function truncateScriptForComparison(script: string, max = 2000): string {
  const trimmed = script.trim();
  if (trimmed.length <= max) return trimmed;
  const head = trimmed.slice(0, max - 60);
  return `${head}\n\n// [truncated — ${trimmed.length - head.length} chars omitted for comparison context]`;
}

function formatScriptForPrompt(entry: SavedScript, index: number): string {
  const meta: string[] = [];
  if (entry.market) meta.push(`Market: ${entry.market}`);
  if (entry.timeframe) meta.push(`Timeframe: ${entry.timeframe}`);
  if (entry.direction) meta.push(`Direction: ${entry.direction}`);
  if (entry.indicators?.length) meta.push(`Indicators: ${entry.indicators.join(', ')}`);
  const metaLine = meta.length ? `\n// Metadata: ${meta.join(' | ')}` : '';

  return `### Strategy ${index + 1} (ID: ${entry.id})
Title: ${entry.name}
${metaLine}

\`\`\`pine
${truncateScriptForComparison(entry.script)}
\`\`\``;
}

/**
 * Builds the user prompt for a 2- or 3-way strategy comparison.
 * Includes verbatim (truncated) scripts + explicit instruction for the
 * ComparisonReport shape. Always appends the canonical FORGE_GUARDRAILS.
 */
export function buildComparisonReportUserPrompt(scripts: SavedScript[]): string {
  const scriptBlocks = scripts
    .map((s, i) => formatScriptForPrompt(s, i))
    .join('\n\n');

  const count = scripts.length;

  return `You are comparing ${count} Pine Script v5 trading strategies side-by-side for a PineForge user.

Focus exclusively on **structural and logical differences**:
- Entry condition logic and filters
- Stop-loss / take-profit / risk sizing approaches
- Suitability for different market regimes (trending vs ranging vs breakout)
- Degree of overlap or complementarity

Do NOT reference live prices, backtest performance numbers, or predict profitability.
Use only the provided script text and metadata.

${scriptBlocks}

Produce a structured comparison report with these exact fields (all required):
- title: short descriptive name (e.g. "EMA Cross vs RSI Divergence — Trend vs Reversion")
- summary: 2–3 sentence plain-English verdict on how the strategies relate
- entryLogicComparison: concise prose on how their entry rules differ
- riskProfileComparison: differences in stops, targets, position sizing
- marketConditionFit: array (one per script) with scriptId, scriptTitle, bestFor, avoidIn
- coverageMap: object with keys "trendy" | "ranging" | "breakout" whose values are the winning scriptId (or null if none clearly wins that regime)
- overlapAssessment: "high" | "medium" | "low" — how much the strategies duplicate each other
- overlapNotes: 1–2 sentences explaining the overlap rating
- recommendation: actionable guidance — when to use which, or how they could be combined / alternated

Return ONLY the JSON object. No markdown fences, no extra text.

${FORGE_GUARDRAILS}`;
}
