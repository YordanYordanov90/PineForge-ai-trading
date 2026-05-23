import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import {
  buildStrategyExportSource,
  type BuildStrategyExportSourceInput,
} from '@/lib/export/source';
import {
  assembleStrategyExportMarkdown,
  type StrategyExportMarkdownOptions,
} from '@/lib/export/strategy-markdown';
import type { GrokModelId } from '@/lib/types';

export type BuildExportMarkdownInput = BuildStrategyExportSourceInput & {
  healthScore?: HealthScoreResult | null;
  alertTemplates?: AlertTemplatesResult | null;
  backtestSummary?: BacktestSummaryResult | null;
};

/**
 * Build the full Notion / Obsidian-ready Markdown string from generator
 * state. Pure — safe on client or server.
 */
export function buildExportMarkdown(input: BuildExportMarkdownInput): string {
  const { healthScore, alertTemplates, backtestSummary, ...sourceInput } =
    input;
  const source = buildStrategyExportSource(sourceInput);
  const options: StrategyExportMarkdownOptions = {};
  if (healthScore) options.healthScore = healthScore;
  if (alertTemplates) options.alertTemplates = alertTemplates;
  if (backtestSummary) options.backtestSummary = backtestSummary;
  return assembleStrategyExportMarkdown(source, options);
}

export type StrategyMarkdownExportContext = {
  title?: string | null;
  prompt: string;
  script: string;
  model?: GrokModelId | null;
  structuredInputs?: BuildStrategyExportSourceInput['structuredInputs'];
  breakdown?: string | null;
  createdAt?: string | null;
  healthScore?: HealthScoreResult | null;
  alertTemplates?: AlertTemplatesResult | null;
  backtestSummary?: BacktestSummaryResult | null;
};

export function buildExportMarkdownFromContext(
  ctx: StrategyMarkdownExportContext,
): string {
  return buildExportMarkdown({
    title: ctx.title,
    prompt: ctx.prompt,
    script: ctx.script,
    model: ctx.model,
    structuredInputs: ctx.structuredInputs,
    breakdown: ctx.breakdown,
    createdAt: ctx.createdAt,
    healthScore: ctx.healthScore,
    alertTemplates: ctx.alertTemplates,
    backtestSummary: ctx.backtestSummary,
  });
}
