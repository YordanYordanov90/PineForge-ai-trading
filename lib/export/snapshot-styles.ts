/**
 * Spec 66 — Inlined CSS for the self-contained Strategy Snapshot HTML export.
 * All styles live here so the generated document has zero external dependencies.
 * Terminal aesthetic, exact neon accent, print overrides.
 */

export const SNAPSHOT_STYLES = `
:root {
  --neon: #c8ff00;
  --bg: #09090b;
  --surface: #111113;
  --text: #fafafa;
  --muted: #a1a1aa;
  --border: #27272a;
  --amber: #f59e0b;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 40px 24px;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.container {
  max-width: 860px;
  margin: 0 auto;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.logo-pine { color: var(--neon); }
.logo-forge { color: var(--text); }

.title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.meta-date {
  font-size: 12px;
  color: var(--muted);
  font-family: ui-monospace, monospace;
  text-align: right;
}

h2 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--neon);
  margin: 28px 0 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

h3 {
  font-size: 14px;
  margin: 16px 0 6px;
  color: var(--text);
}

table.meta {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 20px;
  font-size: 14px;
}

table.meta td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

table.meta td:first-child {
  width: 160px;
  color: var(--muted);
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.assumptions {
  background: #1c1408;
  border: 1px solid #3f2a0f;
  border-left: 3px solid var(--amber);
  padding: 12px 16px;
  margin: 16px 0 20px;
  border-radius: 6px;
}

.assumptions h3 {
  color: #fbbf24;
  margin-top: 0;
}

blockquote.prompt {
  border-left: 3px solid var(--neon);
  margin: 16px 0;
  padding: 12px 16px;
  background: #0f0f11;
  color: var(--text);
  font-style: normal;
}

.breakdown {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0 24px;
  font-size: 14px;
  line-height: 1.65;
}

.breakdown h3 { color: var(--neon); }
.breakdown ul { padding-left: 20px; margin: 8px 0; }
.breakdown li { margin: 4px 0; }

.pine-code {
  background: #0a0a0c;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.5;
  white-space: pre;
  color: #e4e4e7;
}

.pine-code .token.comment { color: #71717a; font-style: italic; }
.pine-code .token.string { color: #f4a261; }
.pine-code .token.number { color: #e0af68; }
.pine-code .token.keyword { color: var(--neon); font-weight: 500; }
.pine-code .token.function { color: #7dd3fc; }
.pine-code .token.operator { color: #94a3b8; }
.pine-code .token.punctuation { color: #64748b; }

.health-card {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #0f1505;
  border: 1px solid var(--neon);
  color: var(--neon);
  font-family: ui-monospace, monospace;
  font-size: 13px;
  font-weight: 600;
}

.verdict { font-weight: 600; margin: 8px 0 4px; }

.alerts details {
  border: 1px solid var(--border);
  border-radius: 6px;
  margin: 8px 0;
  background: var(--surface);
}

.alerts summary {
  cursor: pointer;
  padding: 8px 12px;
  font-weight: 500;
  color: var(--neon);
  list-style: none;
}

.alerts summary::-webkit-details-marker { display: none; }

.alerts pre {
  margin: 0;
  padding: 12px;
  background: #0a0a0c;
  border-top: 1px solid var(--border);
  font-size: 12px;
  overflow-x: auto;
}

.backtest ul { margin: 4px 0 12px; padding-left: 18px; }
.backtest li { margin: 3px 0; }

.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
}

.diff-panel {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.diff-panel h4 {
  margin: 0;
  padding: 6px 10px;
  background: #0f0f11;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
}

.diff-panel pre {
  margin: 0;
  padding: 10px;
  font-size: 11px;
  background: #0a0a0c;
  overflow: auto;
  max-height: 320px;
}

footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 11px;
  color: var(--muted);
}

.qr {
  width: 92px;
  height: 92px;
  padding: 6px;
  background: #fff;
  border-radius: 4px;
}

.qr svg { display: block; width: 100%; height: 100%; }

.section { margin-bottom: 20px; }

@media print {
  body {
    background: #fff !important;
    color: #111 !important;
    padding: 20px;
  }
  .container { max-width: 100%; }
  h2, .logo-pine { color: #111 !important; }
  .pine-code, .breakdown, .health-card, .alerts details, .diff-panel {
    background: #fafafa !important;
    border-color: #ddd !important;
    color: #111 !important;
  }
  .pine-code .token.keyword { color: #111 !important; }
  .score-badge { background: #f1f1f1 !important; border-color: #111 !important; color: #111 !important; }
  .qr { background: #fff; border: 1px solid #ccc; }
  .neon-accent { color: #111 !important; border-color: #999 !important; }
  footer { border-color: #ddd; }
}
`;

