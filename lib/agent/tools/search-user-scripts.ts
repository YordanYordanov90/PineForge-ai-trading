/**
 * Tool: `search_user_scripts` (spec 53).
 *
 * LLM-callable wrapper around `searchScriptsForUser()` from
 * `lib/db/search-user-scripts.ts` — same query layer the
 * `/api/scripts/search` route uses (spec 42). The agent never reaches
 * raw SQL; it goes through the same helper the UI does so behavior
 * stays consistent and ownership scoping is centralized.
 *
 * Scope of this file: contract only (name, description, input schema,
 * sanitized error string, type aliases). Spec 55's streaming endpoint
 * wires `execute` against this contract.
 */

import { z } from 'zod';
import type { SavedScript } from '@/lib/types';
import { MAX_TAGS_PER_SCRIPT, MAX_TAG_LENGTH } from '@/lib/scripts/tags';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const SEARCH_USER_SCRIPTS_TOOL_NAME = 'search_user_scripts' as const;

export const searchUserScriptsDescription =
  "Search the user's saved Pine Script strategies by name, prompt text, tags, starred status, or collection. Use this to find past strategies the user mentions or to reference their history.";

/**
 * Tag filter is capped at half of `MAX_TAGS_PER_SCRIPT` so the agent
 * can't blow URL-length budgets by stuffing every known tag into one
 * call; per-tag length matches `MAX_TAG_LENGTH` so the LLM can't
 * smuggle long strings past the storage contract.
 */
export const searchUserScriptsInputSchema = z.object({
  query: z
    .string()
    .max(200)
    .optional()
    .describe('Free text search across script names and prompts'),
  tags: z
    .array(z.string().max(MAX_TAG_LENGTH))
    .max(Math.max(1, Math.floor(MAX_TAGS_PER_SCRIPT / 2)))
    .optional()
    .describe('Filter by tags — all must match'),
  starred: z
    .boolean()
    .optional()
    .describe('Filter to only starred or only unstarred scripts'),
  collectionId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Filter to a specific collection'),
});

export type SearchUserScriptsInput = z.infer<typeof searchUserScriptsInputSchema>;

export type SearchUserScriptsOutput = {
  scripts: SavedScript[];
  count: number;
};

export type SearchUserScriptsExecutor = AgentToolExecutor<
  SearchUserScriptsInput,
  SearchUserScriptsOutput
>;

export const SEARCH_USER_SCRIPTS_ERROR =
  'Could not search your scripts. Please try again.';

export const searchUserScriptsContract: AgentToolContract<
  SearchUserScriptsInput,
  SearchUserScriptsOutput
> = {
  name: SEARCH_USER_SCRIPTS_TOOL_NAME,
  description: searchUserScriptsDescription,
  inputSchema: searchUserScriptsInputSchema,
  errorMessage: SEARCH_USER_SCRIPTS_ERROR,
};
