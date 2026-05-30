/**
 * Spec 66 — Strategy Snapshot HTML assembler.
 * Pure (except QR which is deterministic) module producing a complete offline
 * HTML document. All CSS inlined via snapshot-styles. No external requests.
 *
 * Render helpers live in `snapshot-renderers.ts`. This module only orchestrates.
 */

import QRCode from 'qrcode';
import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import type { StrategyExportSource } from '@/lib/export/source';
import { SNAPSHOT_STYLES } from '@/lib/export/snapshot-styles';
import {
  escapeHtml,
  formatDate,
  highlightPine,
  renderAlertDetails,
  renderBacktest,
  renderBreakdown,
  renderComparison,
  renderHealth,
  renderLogoSvg,
} from '@/lib/export/snapshot-renderers';

export type StrategySnapshotOptions = {
  healthScore?: HealthScoreResult | null;
  alertTemplates?: AlertTemplatesResult | null;
  backtestSummary?: BacktestSummaryResult | null;
  /** Previous script body for side-by-side comparison (optional, lineage only). */
  comparisonBaseline?: string | null;
};

const PINEFORGE_URL = 'https://pineforge.app';

/** Metadata table rows derived from the structured inputs + model + dates. */
function buildMetaRows(source: StrategyExportSource): string[] {
  const s = source.structuredInputs;
  const rows: string[] = [];
  if (source.model) rows.push(`<tr><td>Model</td><td>${escapeHtml(source.model.label)}</td></tr>`);
  if (s.market) rows.push(`<tr><td>Market</td><td>${escapeHtml(s.market)}</td></tr>`);
  if (s.timeframe) rows.push(`<tr><td>Timeframe</td><td>${escapeHtml(s.timeframe)}</td></tr>`);
  if (s.direction) rows.push(`<tr><td>Direction</td><td>${escapeHtml(s.direction)}</td></tr>`);
  if (s.rr) rows.push(`<tr><td>Risk–reward</td><td>${escapeHtml(s.rr)}</td></tr>`);
  if (s.balance) rows.push(`<tr><td>Account balance</td><td>${escapeHtml(s.balance)}</td></tr>`);
  if (s.indicators?.length) rows.push(`<tr><td>Indicators</td><td>${s.indicators.map(escapeHtml).join(', ')}</td></tr>`);
  if (source.createdAt) rows.push(`<tr><td>Generated</td><td>${formatDate(source.createdAt)}</td></tr>`);
  return rows;
}

/** Amber-tinted assumptions block when the breakdown references assumptions. */
function buildAssumptionsHtml(breakdown: string | null | undefined): string {
  const bd = breakdown || '';
  const lc = bd.toLowerCase();
  if (!lc.includes('assumption') && !lc.includes('assumes')) return '';
  const excerpt = escapeHtml(bd.split('\n').slice(0, 6).join(' '));
  return `<div class="assumptions"><h3>Assumptions</h3><div>${excerpt}</div></div>`;
}

/** Generate the small QR pointing at the marketing URL (privacy — no script id). */
async function generatePineforgeQrSvg(): Promise<string> {
  return QRCode.toString(PINEFORGE_URL, {
    type: 'svg',
    margin: 0,
    width: 96,
    color: { dark: '#111113', light: '#ffffff' },
  });
}

/**
 * Assemble a complete, self-contained HTML snapshot.
 * Async only because of QR generation (deterministic given same inputs).
 *
 * NOTE: Intentional exception to the 50-line function guideline. The body is
 * dominated by a single HTML template literal that interpolates pre-built
 * section strings. Splitting the template further would harm readability
 * without improving cohesion. All non-template logic is factored into the
 * small helpers above and into `snapshot-renderers.ts`.
 */
export async function assembleStrategySnapshotHtml(
  source: StrategyExportSource,
  options: StrategySnapshotOptions = {},
): Promise<string> {
  const title = source.title || 'Untitled strategy';
  const date = formatDate(source.createdAt);

  const metaRows = buildMetaRows(source);
  const assumptionsHtml = buildAssumptionsHtml(source.breakdown);
  const breakdownHtml = renderBreakdown(source.breakdown);
  const scriptHtml = highlightPine(source.script);
  const healthHtml = options.healthScore ? renderHealth(options.healthScore) : '';
  const alertsHtml = options.alertTemplates && options.alertTemplates.templates.length
    ? `<div class="alerts">${options.alertTemplates.templates.map(renderAlertDetails).join('')}</div>`
    : '';
  const backtestHtml = options.backtestSummary ? renderBacktest(options.backtestSummary) : '';
  const diffHtml = renderComparison(options.comparisonBaseline, source.script);
  const qrSvg = await generatePineforgeQrSvg();
  const now = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — PineForge Snapshot</title>
<style>${SNAPSHOT_STYLES}</style>
</head>
<body>
<div class="container">
  <header>
    <div>
      ${renderLogoSvg()}
    </div>
    <div style="text-align:right">
      <h1 class="title">${escapeHtml(title)}</h1>
      <div class="meta-date">Generated ${date}</div>
    </div>
  </header>

  ${metaRows.length ? `<h2>Strategy Metadata</h2><table class="meta">${metaRows.join('')}</table>` : ''}

  ${assumptionsHtml}

  <h2>Original Prompt</h2>
  <blockquote class="prompt">${escapeHtml(source.prompt).replace(/\n/g, '<br>')}</blockquote>

  ${breakdownHtml ? `<h2>Breakdown</h2><div class="breakdown">${breakdownHtml}</div>` : ''}

  <h2>Pine Script v5</h2>
  <pre class="pine-code"><code>${scriptHtml}</code></pre>

  ${healthHtml}

  ${alertsHtml ? `<h2>Alert Templates</h2>${alertsHtml}` : ''}

  ${backtestHtml}

  ${diffHtml}

  <footer>
    <div>
      <div>PineForge Snapshot • ${now}</div>
      <div style="margin-top:4px;opacity:0.7;">Self-contained • No external dependencies • Print-ready</div>
    </div>
    <div style="text-align:right">
      <a href="${PINEFORGE_URL}" target="_blank" rel="noopener" style="text-decoration:none;color:#c8ff00;font-size:11px;">pineforge.app</a>
      <div class="qr" title="pineforge.app">${qrSvg}</div>
    </div>
  </footer>
</div>
</body>
</html>`;

  return html.trim();
}
