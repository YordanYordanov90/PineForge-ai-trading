/**
 * Spec 49 — Export Markdown Serializer.
 *
 * Turns a {@link StrategyExportSource} (spec 48) into one normalized Markdown
 * document for Notion / Obsidian. Pure, deterministic, stable heading order.
 */
import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import type {
  StrategyExportSource,
  StrategyExportStructuredInputs,
} from '@/lib/export/source';

/** Optional AI-generated summaries already in client state (no new AI calls). */
export type StrategyExportMarkdownOptions = {
  healthScore?: HealthScoreResult | null;
  alertTemplates?: AlertTemplatesResult | null;
  backtestSummary?: BacktestSummaryResult | null;
};

const HEADING_METADATA = 'Strategy Metadata';
const HEADING_PROMPT = 'Original Prompt';
const HEADING_BREAKDOWN = 'Breakdown';
const HEADING_SCRIPT = 'Pine Script';
const HEADING_HEALTH = 'Health Score';
const HEADING_ALERTS = 'Alert Templates';
const HEADING_BACKTEST = 'Backtesting Summary';

function collapseInlineWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Deterministic UTC date label for export metadata. */
function formatExportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function formatBulletList(items: readonly string[]): string {
  return items.map((item) => `- ${collapseInlineWhitespace(item)}`).join('\n');
}

function formatBlockquote(text: string): string {
  const lines = text.split('\n');
  return lines.map((line) => `> ${line}`).join('\n');
}

/**
 * Fence arbitrary code. Uses the minimum backtick count that cannot appear
 * unescaped inside the body (standard Markdown code-fence rule).
 */
function fenceCodeBlock(language: string, code: string): string {
  const body = code.replace(/\n$/, '');
  let tickCount = 3;
  const fenceChar = '`';
  while (body.includes(fenceChar.repeat(tickCount))) {
    tickCount += 1;
  }
  const fence = fenceChar.repeat(tickCount);
  return `${fence}${language}\n${body}\n${fence}`;
}

function hasStructuredInputs(inputs: StrategyExportStructuredInputs): boolean {
  return Boolean(
    inputs.market ||
      inputs.timeframe ||
      inputs.direction ||
      inputs.rr ||
      inputs.balance ||
      (inputs.indicators && inputs.indicators.length > 0),
  );
}

function renderMetadataSection(source: StrategyExportSource): string | null {
  const lines: string[] = [];
  const { structuredInputs: s } = source;

  if (source.model) {
    lines.push(`- **Model:** ${source.model.label}`);
  }
  if (s.market) lines.push(`- **Market:** ${s.market}`);
  if (s.timeframe) lines.push(`- **Timeframe:** ${s.timeframe}`);
  if (s.direction) lines.push(`- **Direction:** ${s.direction}`);
  if (s.rr) lines.push(`- **Risk–reward:** ${s.rr}`);
  if (s.balance) lines.push(`- **Account balance:** ${s.balance}`);
  if (s.indicators && s.indicators.length > 0) {
    lines.push(`- **Indicators:** ${s.indicators.join(', ')}`);
  }
  if (source.createdAt) {
    lines.push(`- **Created:** ${formatExportDate(source.createdAt)}`);
  }
  if (source.updatedAt) {
    lines.push(`- **Updated:** ${formatExportDate(source.updatedAt)}`);
  }

  if (lines.length === 0 && !source.model) return null;
  return `## ${HEADING_METADATA}\n\n${lines.join('\n')}`;
}

function renderPromptSection(prompt: string): string | null {
  if (!prompt) return null;
  return `## ${HEADING_PROMPT}\n\n${formatBlockquote(prompt)}`;
}

function renderBreakdownSection(breakdown: string | null): string | null {
  if (!breakdown) return null;
  return `## ${HEADING_BREAKDOWN}\n\n${breakdown.trim()}`;
}

function renderScriptSection(script: string): string | null {
  const trimmed = script.trim();
  if (!trimmed) return null;
  return `## ${HEADING_SCRIPT}\n\n${fenceCodeBlock('pine', trimmed)}`;
}

function renderHealthSection(result: HealthScoreResult): string {
  const blocks = [
    `**Score:** ${result.score}/10`,
    `**Verdict:** ${result.verdict}`,
    '',
    result.summary,
    '',
    '**Strengths**',
    formatBulletList(result.strengths),
    '',
    '**Risks**',
    formatBulletList(result.risks),
    '',
    '**Next steps**',
    formatBulletList(result.nextSteps),
  ];
  return `## ${HEADING_HEALTH}\n\n${blocks.join('\n')}`;
}

function renderAlertsSection(result: AlertTemplatesResult): string {
  const templateBlocks = result.templates.map((t) => {
    const notes =
      t.notes.length > 0
        ? `\n\n**Notes**\n${formatBulletList(t.notes)}`
        : '';
    const placeholders =
      t.placeholders.length > 0
        ? `\n\n**Placeholders:** ${t.placeholders.join(', ')}`
        : '';
    return [
      `### ${t.label}`,
      '',
      t.description,
      '',
      fenceCodeBlock('json', t.messageJson),
      notes,
      placeholders,
    ]
      .filter((part) => part !== '')
      .join('\n');
  });
  return `## ${HEADING_ALERTS}\n\n${templateBlocks.join('\n\n')}`;
}

function renderBacktestSection(result: BacktestSummaryResult): string {
  const titleLine = result.title ? `### ${result.title}\n\n` : '';
  return `## ${HEADING_BACKTEST}\n\n${titleLine}${result.markdown.trim()}`;
}

/**
 * Assemble a single Markdown export from spec-48 source data.
 *
 * Stable section order:
 * 1. title (`#`)
 * 2. strategy metadata (when any metadata field is present)
 * 3. original prompt
 * 4. breakdown (only when loaded)
 * 5. Pine Script (fenced `pine` block)
 * 6. health score (optional)
 * 7. alert templates (optional)
 * 8. backtesting summary (optional)
 *
 * Same input always produces the same output. No provider-specific variants.
 */
export function assembleStrategyExportMarkdown(
  source: StrategyExportSource,
  options: StrategyExportMarkdownOptions = {},
): string {
  const blocks: string[] = [`# ${source.title.trim() || 'Untitled strategy'}`];

  const metadata = renderMetadataSection(source);
  if (metadata) blocks.push(metadata);

  const prompt = renderPromptSection(source.prompt);
  if (prompt) blocks.push(prompt);

  const breakdown = renderBreakdownSection(source.breakdown);
  if (breakdown) blocks.push(breakdown);

  const script = renderScriptSection(source.script);
  if (script) blocks.push(script);

  if (options.healthScore) {
    blocks.push(renderHealthSection(options.healthScore));
  }
  if (options.alertTemplates) {
    blocks.push(renderAlertsSection(options.alertTemplates));
  }
  if (options.backtestSummary) {
    blocks.push(renderBacktestSection(options.backtestSummary));
  }

  return blocks.join('\n\n').trim();
}

/**
 * Whether the metadata section would render anything beyond an empty object.
 * Exported for spec 50 UX hints (e.g. "export includes metadata").
 */
export function exportHasMetadata(source: StrategyExportSource): boolean {
  return Boolean(
    source.model ||
      source.createdAt ||
      source.updatedAt ||
      hasStructuredInputs(source.structuredInputs),
  );
}
