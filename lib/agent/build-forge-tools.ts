import 'server-only';

import { tool } from 'ai';
import {
  GENERATE_ALERT_TEMPLATES_ERROR,
  GENERATE_ALERT_TEMPLATES_TOOL_NAME,
  GET_SCRIPT_DETAILS_ERROR,
  GET_SCRIPT_DETAILS_TOOL_NAME,
  REFINE_SCRIPT_ERROR,
  REFINE_SCRIPT_TOOL_NAME,
  RUN_BACKTEST_SUMMARY_ERROR,
  RUN_BACKTEST_SUMMARY_TOOL_NAME,
  RUN_HEALTH_SCORE_ERROR,
  RUN_HEALTH_SCORE_TOOL_NAME,
  SEARCH_STRATEGY_KNOWLEDGE_ERROR,
  SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME,
  SEARCH_STRATEGY_KNOWLEDGE_UNAVAILABLE_MESSAGE,
  SEARCH_USER_SCRIPTS_ERROR,
  SEARCH_USER_SCRIPTS_TOOL_NAME,
  generateAlertTemplatesContract,
  getScriptDetailsContract,
  refineScriptContract,
  runBacktestSummaryContract,
  runHealthScoreContract,
  searchStrategyKnowledgeContract,
  searchUserScriptsContract,
  type AgentToolContext,
} from './tools';
import {
  runBacktestSummaryInline,
  runGenerateAlertTemplatesInline,
  runGetScriptDetails,
  runHealthScoreInline,
  runRefineScriptInline,
  runSearchUserScripts,
} from './tool-runners';

/**
 * Forge Agent tool composition (spec 55).
 *
 * Takes the spec-53 contracts (description + Zod input schema +
 * sanitized error string) and pairs each one with the matching runner
 * from {@link `./tool-runners.ts`} into an AI SDK `ToolSet` ready to
 * pass straight to `streamText({ tools: ... })`.
 *
 * Each `execute` wraps its runner in a try/catch so the agent never
 * sees raw exceptions — the LLM gets the contract's sanitized error
 * string and decides how to relay it. This is the single place spec
 * 53's `errorMessage` constants land in real execution.
 *
 * `experimental_context` is intentionally not used. Every tool closure
 * captures the {@link AgentToolContext} via JS scope, which is simpler
 * to type strictly than the AI SDK's untyped context bag and keeps the
 * security-critical `userId` out of any AI-SDK-managed plumbing where
 * it might (theoretically) leak into a tool's input payload.
 */

/**
 * Note on the `agent_*_failed` log prefix: dev-only `console.warn` for
 * tool failures. Mirrors how `/api/health-score` and friends already
 * log non-fatal validation issues. Production stays silent.
 */
function logToolError(scope: string, error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[forge-agent] ${scope} tool failed`, error);
  }
}

export function buildForgeTools(ctx: AgentToolContext) {
  const runnerCtx = {
    userId: ctx.userId,
    model: ctx.model,
    signal: ctx.signal,
  };

  return {
    [SEARCH_USER_SCRIPTS_TOOL_NAME]: tool({
      description: searchUserScriptsContract.description,
      inputSchema: searchUserScriptsContract.inputSchema,
      execute: async (input) => {
        try {
          return await runSearchUserScripts(input, { userId: ctx.userId });
        } catch (error) {
          logToolError(SEARCH_USER_SCRIPTS_TOOL_NAME, error);
          return { error: SEARCH_USER_SCRIPTS_ERROR };
        }
      },
    }),

    [GET_SCRIPT_DETAILS_TOOL_NAME]: tool({
      description: getScriptDetailsContract.description,
      inputSchema: getScriptDetailsContract.inputSchema,
      execute: async (input) => {
        try {
          const result = await runGetScriptDetails(input, {
            userId: ctx.userId,
          });
          if (!result) {
            return { error: GET_SCRIPT_DETAILS_ERROR };
          }
          return result;
        } catch (error) {
          logToolError(GET_SCRIPT_DETAILS_TOOL_NAME, error);
          return { error: GET_SCRIPT_DETAILS_ERROR };
        }
      },
    }),

    [RUN_HEALTH_SCORE_TOOL_NAME]: tool({
      description: runHealthScoreContract.description,
      inputSchema: runHealthScoreContract.inputSchema,
      execute: async (input) => {
        try {
          return await runHealthScoreInline(input, runnerCtx);
        } catch (error) {
          logToolError(RUN_HEALTH_SCORE_TOOL_NAME, error);
          return { error: RUN_HEALTH_SCORE_ERROR };
        }
      },
    }),

    [RUN_BACKTEST_SUMMARY_TOOL_NAME]: tool({
      description: runBacktestSummaryContract.description,
      inputSchema: runBacktestSummaryContract.inputSchema,
      execute: async (input) => {
        try {
          return await runBacktestSummaryInline(input, runnerCtx);
        } catch (error) {
          logToolError(RUN_BACKTEST_SUMMARY_TOOL_NAME, error);
          return { error: RUN_BACKTEST_SUMMARY_ERROR };
        }
      },
    }),

    [GENERATE_ALERT_TEMPLATES_TOOL_NAME]: tool({
      description: generateAlertTemplatesContract.description,
      inputSchema: generateAlertTemplatesContract.inputSchema,
      execute: async (input) => {
        try {
          return await runGenerateAlertTemplatesInline(input, runnerCtx);
        } catch (error) {
          logToolError(GENERATE_ALERT_TEMPLATES_TOOL_NAME, error);
          return { error: GENERATE_ALERT_TEMPLATES_ERROR };
        }
      },
    }),

    [REFINE_SCRIPT_TOOL_NAME]: tool({
      description: refineScriptContract.description,
      inputSchema: refineScriptContract.inputSchema,
      execute: async (input) => {
        try {
          return await runRefineScriptInline(input, runnerCtx);
        } catch (error) {
          logToolError(REFINE_SCRIPT_TOOL_NAME, error);
          return { error: REFINE_SCRIPT_ERROR };
        }
      },
    }),

    /**
     * `search_strategy_knowledge` is provider-agnostic in spec 53. v1
     * ships without a configured provider — the executor returns the
     * spec-defined "unavailable" copy so the LLM declines gracefully.
     * When a provider env (Tavily / Serper / Brave) is wired in a
     * later spec, this branch flips to call the provider directly.
     */
    [SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME]: tool({
      description: searchStrategyKnowledgeContract.description,
      inputSchema: searchStrategyKnowledgeContract.inputSchema,
      execute: async (input) => {
        try {
          // No provider configured in v1 — fall through to graceful
          // fallback. Keeps the tool callable so the LLM gets a
          // structured response instead of a tool-not-found error.
          return {
            results: [],
            query: input.query,
            unavailable: SEARCH_STRATEGY_KNOWLEDGE_UNAVAILABLE_MESSAGE,
          };
        } catch (error) {
          logToolError(SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME, error);
          return { error: SEARCH_STRATEGY_KNOWLEDGE_ERROR };
        }
      },
    }),
  };
}

export type ForgeToolSet = ReturnType<typeof buildForgeTools>;
