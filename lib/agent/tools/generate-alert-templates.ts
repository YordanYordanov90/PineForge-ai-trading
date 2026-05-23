/**
 * Tool: `generate_alert_templates` (spec 53).
 *
 * Reuses the same logic as `POST /api/alert-templates` via a shared
 * handler (spec 55 owns the extraction). Returns the full
 * `AlertTemplatesResult` — four provider templates (`3commas`,
 * `alertatron`, `wundertrading`, `custom`) with verified-parsable
 * `messageJson` strings.
 *
 * Per spec 29, each template's `messageJson` is `JSON.parse`-verified
 * server-side before reaching this contract's output, so spec 57's UI
 * can render templates with the same `AlertTemplatesPanel` it already
 * uses without extra validation.
 */

import { z } from 'zod';
import type { AlertTemplatesResult } from '@/lib/api/validation';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const GENERATE_ALERT_TEMPLATES_TOOL_NAME =
  'generate_alert_templates' as const;

export const generateAlertTemplatesDescription =
  'Generate ready-to-use webhook JSON templates for popular automation platforms (3Commas, Alertatron, WunderTrading, Custom). Use when the user wants to set up automated alerts for their strategy.';

export const generateAlertTemplatesInputSchema = z.object({
  script: z
    .string()
    .min(1)
    .max(20_000)
    .describe('The Pine Script code to generate alerts for'),
  prompt: z
    .string()
    .max(1500)
    .optional()
    .describe('The original strategy description'),
});

export type GenerateAlertTemplatesInput = z.infer<
  typeof generateAlertTemplatesInputSchema
>;

export type GenerateAlertTemplatesOutput = AlertTemplatesResult;

export type GenerateAlertTemplatesExecutor = AgentToolExecutor<
  GenerateAlertTemplatesInput,
  GenerateAlertTemplatesOutput
>;

export const GENERATE_ALERT_TEMPLATES_ERROR =
  'Alert template generation failed. Please try again.';

export const generateAlertTemplatesContract: AgentToolContract<
  GenerateAlertTemplatesInput,
  GenerateAlertTemplatesOutput
> = {
  name: GENERATE_ALERT_TEMPLATES_TOOL_NAME,
  description: generateAlertTemplatesDescription,
  inputSchema: generateAlertTemplatesInputSchema,
  errorMessage: GENERATE_ALERT_TEMPLATES_ERROR,
};
