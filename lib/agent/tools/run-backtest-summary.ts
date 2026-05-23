/**
 * Tool: `run_backtest_summary` (spec 53).
 *
 * Reuses the same logic as `POST /api/backtesting-summary` via a
 * shared handler (spec 55 owns the extraction). Returns the
 * pre-assembled `markdown` field plus the structured sections so the
 * agent can choose to surface either format — spec 57's UI prefers
 * the structured sections, but the agent may also paste the markdown
 * into a follow-up tool call (e.g. an export tool, if one is added
 * later).
 *
 * Per spec 31/32 the underlying endpoint never emits Markdown from the
 * LLM — `markdown` is built deterministically server-side from
 * `sections` before strict validation, so the value here is always
 * safe to render verbatim.
 */

import { z } from 'zod';
import type { BacktestSummaryResult } from '@/lib/api/validation';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const RUN_BACKTEST_SUMMARY_TOOL_NAME = 'run_backtest_summary' as const;

export const runBacktestSummaryDescription =
  'Generate a structured backtesting research checklist for a strategy — recommended timeframes, markets, what to check in the equity curve, common failure modes, and a test plan. Use when the user wants to know how to test their strategy.';

/**
 * `market` and `timeframe` stay as free-text strings here even though
 * the underlying endpoint uses enums. Rationale: the agent often pulls
 * these from conversation context (e.g. "BTC/USDT" instead of the
 * enum "Crypto") and the executor (spec 55) is responsible for
 * mapping/dropping unsupported values before invoking the shared
 * handler — keeps the LLM-facing contract conversational.
 */
export const runBacktestSummaryInputSchema = z.object({
  script: z
    .string()
    .min(1)
    .max(20_000)
    .describe('The Pine Script code to analyze'),
  prompt: z
    .string()
    .max(1500)
    .optional()
    .describe('The original strategy description'),
  market: z
    .string()
    .max(64)
    .optional()
    .describe('Target market, e.g. "BTC/USDT", "SPY"'),
  timeframe: z
    .string()
    .max(8)
    .optional()
    .describe('Target timeframe, e.g. "5m", "15m", "1h"'),
});

export type RunBacktestSummaryInput = z.infer<typeof runBacktestSummaryInputSchema>;

export type RunBacktestSummaryOutput = BacktestSummaryResult;

export type RunBacktestSummaryExecutor = AgentToolExecutor<
  RunBacktestSummaryInput,
  RunBacktestSummaryOutput
>;

export const RUN_BACKTEST_SUMMARY_ERROR =
  'Backtesting summary generation failed. Please try again.';

export const runBacktestSummaryContract: AgentToolContract<
  RunBacktestSummaryInput,
  RunBacktestSummaryOutput
> = {
  name: RUN_BACKTEST_SUMMARY_TOOL_NAME,
  description: runBacktestSummaryDescription,
  inputSchema: runBacktestSummaryInputSchema,
  errorMessage: RUN_BACKTEST_SUMMARY_ERROR,
};
