/**
 * Tool: `get_script_details` (spec 53).
 *
 * Loads a single saved script by id, scoped to the caller via the auth
 * context's `userId`. The executor (spec 55) runs a Drizzle query with
 * `eq(scripts.id, id) AND eq(scripts.userId, userId)` so a missing row
 * and a foreign-user row look identical — no existence leak across
 * users.
 *
 * Result shape matches `SavedScript` (the same client model used by
 * `/api/scripts` and history) so spec 57's UI can render tool output
 * with no shape translation.
 */

import { z } from 'zod';
import type { SavedScript } from '@/lib/types';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const GET_SCRIPT_DETAILS_TOOL_NAME = 'get_script_details' as const;

export const getScriptDetailsDescription =
  'Load the full details of a specific saved script by its ID, including the Pine Script code, prompt, tags, and metadata. Use when you need to read or analyze a specific script.';

export const getScriptDetailsInputSchema = z.object({
  scriptId: z
    .number()
    .int()
    .positive()
    .describe('The ID of the script to load'),
});

export type GetScriptDetailsInput = z.infer<typeof getScriptDetailsInputSchema>;

export type GetScriptDetailsOutput = {
  script: SavedScript;
};

export type GetScriptDetailsExecutor = AgentToolExecutor<
  GetScriptDetailsInput,
  GetScriptDetailsOutput
>;

export const GET_SCRIPT_DETAILS_ERROR =
  "Script not found or you don't have access to it.";

export const getScriptDetailsContract: AgentToolContract<
  GetScriptDetailsInput,
  GetScriptDetailsOutput
> = {
  name: GET_SCRIPT_DETAILS_TOOL_NAME,
  description: getScriptDetailsDescription,
  inputSchema: getScriptDetailsInputSchema,
  errorMessage: GET_SCRIPT_DETAILS_ERROR,
};
