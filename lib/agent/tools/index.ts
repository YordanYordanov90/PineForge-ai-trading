/**
 * Forge Agent tool contracts (spec 53) — single import surface.
 *
 * Each tool's contract (name, LLM-facing description, Zod input schema,
 * sanitized error string, and TS input/output types) lives in its own
 * file. This index re-exports every contract individually **and** as a
 * single read-only `forgeToolContracts` map keyed by tool name.
 *
 * **Scope of spec 53**: contracts only. `execute` functions are wired
 * in spec 55 (`POST /api/forge`), which:
 *   1. resolves the agent's `AgentToolContext` (userId, plan, model,
 *      signal) from the request,
 *   2. composes each contract with its executor via the AI SDK helper
 *      `tool({ description, inputSchema, execute })`, and
 *   3. assembles the result into a `forgeTools` map passed straight to
 *      `streamText({ tools: forgeTools, ... })`.
 *
 * Keeping execute out of this file means every consumer of the
 * contracts (spec 55, plus future spec 58 guardrails / spec 56
 * extraction prompts) shares one source of truth for tool names,
 * descriptions, and shapes — no schema drift.
 */

import type { AgentToolContract } from './types';
import {
  SEARCH_USER_SCRIPTS_TOOL_NAME,
  searchUserScriptsContract,
} from './search-user-scripts';
import {
  GET_SCRIPT_DETAILS_TOOL_NAME,
  getScriptDetailsContract,
} from './get-script-details';
import {
  RUN_HEALTH_SCORE_TOOL_NAME,
  runHealthScoreContract,
} from './run-health-score';
import {
  RUN_BACKTEST_SUMMARY_TOOL_NAME,
  runBacktestSummaryContract,
} from './run-backtest-summary';
import {
  GENERATE_ALERT_TEMPLATES_TOOL_NAME,
  generateAlertTemplatesContract,
} from './generate-alert-templates';
import {
  REFINE_SCRIPT_TOOL_NAME,
  refineScriptContract,
} from './refine-script';
import {
  SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME,
  searchStrategyKnowledgeContract,
} from './search-strategy-knowledge';

export type {
  AgentToolContext,
  AgentToolContract,
  AgentToolExecutor,
} from './types';

export * from './search-user-scripts';
export * from './get-script-details';
export * from './run-health-score';
export * from './run-backtest-summary';
export * from './generate-alert-templates';
export * from './refine-script';
export * from './search-strategy-knowledge';

/**
 * Canonical list of every tool the Forge Agent can call. Single source
 * of truth — spec 55 iterates this for `tool()` composition, spec 58
 * iterates it for guardrail checks (e.g. "did the LLM call an unknown
 * tool name?"), and spec 56's memory extraction reads it to log which
 * tools the user invoked.
 *
 * Order is informational only; the agent picks tools by description.
 */
export const FORGE_TOOL_NAMES = [
  SEARCH_USER_SCRIPTS_TOOL_NAME,
  GET_SCRIPT_DETAILS_TOOL_NAME,
  RUN_HEALTH_SCORE_TOOL_NAME,
  RUN_BACKTEST_SUMMARY_TOOL_NAME,
  GENERATE_ALERT_TEMPLATES_TOOL_NAME,
  REFINE_SCRIPT_TOOL_NAME,
  SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME,
] as const;

export type ForgeToolName = (typeof FORGE_TOOL_NAMES)[number];

/**
 * Read-only registry of every tool contract, keyed by tool name. Spec 55
 * composes one of these into a `tool({ description, inputSchema,
 * execute })` per entry; spec 58 walks it to validate that the LLM's
 * `tool-call` part references a known name before any execute runs.
 *
 * The signature uses `AgentToolContract<unknown, unknown>` so consumers
 * who only need `description` / `inputSchema` don't have to thread the
 * full per-tool generic. When spec 55 wires execute it imports the
 * specific per-tool contract (e.g. `searchUserScriptsContract`) so the
 * input/output types stay strict at the call site.
 */
export const forgeToolContracts = {
  [SEARCH_USER_SCRIPTS_TOOL_NAME]: searchUserScriptsContract,
  [GET_SCRIPT_DETAILS_TOOL_NAME]: getScriptDetailsContract,
  [RUN_HEALTH_SCORE_TOOL_NAME]: runHealthScoreContract,
  [RUN_BACKTEST_SUMMARY_TOOL_NAME]: runBacktestSummaryContract,
  [GENERATE_ALERT_TEMPLATES_TOOL_NAME]: generateAlertTemplatesContract,
  [REFINE_SCRIPT_TOOL_NAME]: refineScriptContract,
  [SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME]: searchStrategyKnowledgeContract,
} as const satisfies Record<
  ForgeToolName,
  AgentToolContract<unknown, unknown>
>;

/**
 * Runtime guard the spec-58 guardrails (and any other code that
 * inspects raw tool-call parts) can use to narrow a free-form string to
 * a known tool name without depending on the Zod schemas.
 */
export function isForgeToolName(name: string): name is ForgeToolName {
  return (FORGE_TOOL_NAMES as readonly string[]).includes(name);
}
