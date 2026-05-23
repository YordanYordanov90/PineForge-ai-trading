/**
 * Tool: `run_health_score` (spec 53).
 *
 * Reuses the same logic as `POST /api/health-score` via a shared
 * handler (spec 55 owns the extraction). The executor receives the
 * caller's plan + Grok model id from the agent's auth context and
 * forwards them so the agent inherits the same model entitlement
 * rules as the manual `/generate` flow — a free-tier agent invocation
 * still maps to the Fast model.
 *
 * Output shape mirrors `HealthScoreResult` exactly so spec 57's UI can
 * render tool results with the same `HealthScorePanel` it already uses.
 */

import { z } from 'zod';
import type { HealthScoreResult } from '@/lib/api/validation';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const RUN_HEALTH_SCORE_TOOL_NAME = 'run_health_score' as const;

export const runHealthScoreDescription =
  'Run a structural Health Score analysis (1–10) on a Pine Script. Returns a score, verdict, strengths, risks, and actionable next steps. Use when the user asks about script quality or wants feedback on their strategy.';

/**
 * `script` length is bounded at the same 20k ceiling as
 * `healthScoreRequestSchema` to keep the agent's input surface
 * aligned with the underlying endpoint. `prompt` stays optional —
 * the agent can fall back to "(prompt omitted)" when it loads a
 * script via `get_script_details` and the original prompt is empty.
 */
export const runHealthScoreInputSchema = z.object({
  script: z
    .string()
    .min(1)
    .max(20_000)
    .describe('The Pine Script code to analyze'),
  prompt: z
    .string()
    .max(1500)
    .optional()
    .describe('The original strategy description, if available'),
});

export type RunHealthScoreInput = z.infer<typeof runHealthScoreInputSchema>;

export type RunHealthScoreOutput = HealthScoreResult;

export type RunHealthScoreExecutor = AgentToolExecutor<
  RunHealthScoreInput,
  RunHealthScoreOutput
>;

export const RUN_HEALTH_SCORE_ERROR =
  'Health Score analysis failed. Please try again.';

export const runHealthScoreContract: AgentToolContract<
  RunHealthScoreInput,
  RunHealthScoreOutput
> = {
  name: RUN_HEALTH_SCORE_TOOL_NAME,
  description: runHealthScoreDescription,
  inputSchema: runHealthScoreInputSchema,
  errorMessage: RUN_HEALTH_SCORE_ERROR,
};
