/**
 * Spec 66 — Pure render helpers for the Strategy Snapshot HTML export.
 *
 * Extracted from `strategy-snapshot-html.ts` so the assembler stays an
 * orchestrator. Each helper is deterministic, side-effect free, and emits
 * escaped HTML strings safe for inlining into the snapshot document.
 */

import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

/** Minimal inline SVG wordmark matching terminal brand (no external assets). */
export function renderLogoSvg(): string {
  return `
    <svg width="118" height="26" viewBox="0 0 118 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="2" y="19" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#c8ff00">Pine</text>
      <text x="58" y="19" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#fafafa">Forge</text>
      <rect x="2" y="22" width="114" height="1.5" rx="1" fill="#c8ff00" opacity="0.9"/>
    </svg>
  `.trim();
}

/** Very small pure Pine Script v5 tokenizer → Prism-style spans (no deps). */
export function highlightPine(code: string): string {
  let html = escapeHtml(code);

  // Order matters: comments first, then strings, keywords, etc.
  const rules: Array<[RegExp, string]> = [
    [/\/\/.*$/gm, '<span class="token comment">$&</span>'],
    [/\/\*[\s\S]*?\*\//g, '<span class="token comment">$&</span>'],
    [/"(?:[^"\\]|\\.)*"/g, '<span class="token string">$&</span>'],
    [/'(?:[^'\\]|\\.)*'/g, '<span class="token string">$&</span>'],
    [/\b\d+(?:\.\d+)?\b/g, '<span class="token number">$&</span>'],
    [/\b(?:strategy|indicator|library|plot|plotshape|plotchar|plotarrow|plotbar|plotcandle|fill|hline|line|box|table|var|varip|const|if|else|for|while|switch|break|continue|return|export|import|as|using)\b/g, '<span class="token keyword">$&</span>'],
    [/\b(?:ta\.|math\.|str\.|array\.|matrix\.|map\.|color\.|input\.|request\.)\w+/g, '<span class="token function">$&</span>'],
    [/\b(?:open|high|low|close|hl2|hlc3|ohlc4|volume|time|bar_index|barstate)\b/g, '<span class="token function">$&</span>'],
    [/[+\-*/=<>!&|%:?]+/g, '<span class="token operator">$&</span>'],
    [/[{}()[\],.;]/g, '<span class="token punctuation">$&</span>'],
  ];

  for (const [re, replacement] of rules) {
    html = html.replace(re, replacement);
  }
  return html;
}

/** Tiny markdown-ish → safe HTML for breakdown (headings, lists, paragraphs). */
export function renderBreakdown(md: string | null): string {
  if (!md || !md.trim()) return '';
  const lines = md.trim().split('\n');
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<p></p>');
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(3))}</h3>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(2))}</h3>`);
      continue;
    }
    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    out.push(`<p>${escapeHtml(line)}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

/** Render a single alert template as details (native collapsible, no JS). */
export function renderAlertDetails(t: AlertTemplatesResult['templates'][number]): string {
  const notes = t.notes.length
    ? `<div style="margin-top:8px;color:#a1a1aa;font-size:12px;">Notes: ${t.notes.map(escapeHtml).join(' • ')}</div>`
    : '';
  const ph = t.placeholders.length
    ? `<div style="margin-top:4px;color:#a1a1aa;font-size:12px;">Placeholders: ${t.placeholders.map(escapeHtml).join(', ')}</div>`
    : '';
  return `
    <details>
      <summary>${escapeHtml(t.label)} — ${escapeHtml(t.description)}</summary>
      <pre>${escapeHtml(t.messageJson)}</pre>
      ${notes}
      ${ph}
    </details>
  `;
}

/** Side-by-side diff panels when baseline provided (no diff algorithm). */
export function renderComparison(baseline: string | null | undefined, current: string): string {
  if (!baseline || baseline.trim() === current.trim()) return '';
  const b = escapeHtml(baseline.trim());
  const c = escapeHtml(current.trim());
  return `
    <h2>Comparison (vs baseline)</h2>
    <div class="diff-grid">
      <div class="diff-panel">
        <h4>Baseline (previous)</h4>
        <pre>${b}</pre>
      </div>
      <div class="diff-panel">
        <h4>Current</h4>
        <pre>${c}</pre>
      </div>
    </div>
  `;
}

export function renderHealth(h: HealthScoreResult): string {
  const strengths = h.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const risks = h.risks.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const next = h.nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  return `
    <div class="health-card">
      <div class="score-badge">Health Score: ${h.score}/10</div>
      <div class="verdict">${escapeHtml(h.verdict)}</div>
      <p style="color:#a1a1aa;margin:8px 0 12px;">${escapeHtml(h.summary)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;">
        <div><strong style="color:#c8ff00;">Strengths</strong><ul style="margin:4px 0;padding-left:16px;">${strengths}</ul></div>
        <div><strong style="color:#f59e0b;">Risks</strong><ul style="margin:4px 0;padding-left:16px;">${risks}</ul></div>
        <div><strong style="color:#7dd3fc;">Next steps</strong><ul style="margin:4px 0;padding-left:16px;">${next}</ul></div>
      </div>
    </div>
  `;
}

export function renderBacktest(b: BacktestSummaryResult): string {
  // The markdown field is already assembled nicely; render as simple pre for fidelity.
  return `
    <h2>Backtesting Summary</h2>
    ${b.title ? `<h3>${escapeHtml(b.title)}</h3>` : ''}
    <div class="backtest">${b.markdown.replace(/\n/g, '<br>')}</div>
  `;
}
