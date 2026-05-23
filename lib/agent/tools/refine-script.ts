/**
 * Tool: `refine_script` (spec 53).
 *
 * Reuses the same logic as `POST /api/refine-script` via a shared
 * handler (spec 55 owns the extraction). The underlying route streams;
 * the tool waits for completion and returns the **full** refined script
 * as a single string so the agent can present it inline without
 * coordinating a sub-stream.
 *
 * Per spec security notes: every `refine_script` invocation counts
 * against the same daily AI quota as a manual refine from `/generate`,
 * and the executor acquires the same per-user stream concurrency lock
 * (`acquireStreamLock`) so an agent invocation can't run in parallel
 * with a manual refine on another tab.
 */

import { z } from 'zod';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const REFINE_SCRIPT_TOOL_NAME = 'refine_script' as const;

export const refineScriptDescription =
  'Refine an existing Pine Script based on a specific instruction. Returns the complete updated script. Use when the user asks to modify, improve, or change their current strategy.';

/**
 * `script` ceiling mirrors `refineScriptSchema` (20k); `instruction`
 * ceiling mirrors the existing route (1k). `prompt` is optional
 * context the agent can pass through when it has the original
 * strategy intent from history or `get_script_details`.
 */
export const refineScriptInputSchema = z.object({
  script: z
    .string()
    .min(1)
    .max(20_000)
    .describe('The current Pine Script code to refine'),
  instruction: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      'What to change — e.g. "add a volume filter" or "change RSI period to 21"',
    ),
  prompt: z
    .string()
    .max(1500)
    .optional()
    .describe('The original strategy description for context'),
});

export type RefineScriptInput = z.infer<typeof refineScriptInputSchema>;

export type RefineScriptOutput = {
  script: string;
};

export type RefineScriptExecutor = AgentToolExecutor<
  RefineScriptInput,
  RefineScriptOutput
>;

export const REFINE_SCRIPT_ERROR =
  'Script refinement failed. Please try again.';

export const refineScriptContract: AgentToolContract<
  RefineScriptInput,
  RefineScriptOutput
> = {
  name: REFINE_SCRIPT_TOOL_NAME,
  description: refineScriptDescription,
  inputSchema: refineScriptInputSchema,
  errorMessage: REFINE_SCRIPT_ERROR,
};
