/**
 * Tool: `search_strategy_knowledge` (spec 53).
 *
 * Scoped web search for trading-strategy + indicator + Pine Script
 * research. The provider is intentionally NOT chosen at this layer —
 * the spec marks it as a runtime dependency (Tavily, Serper, Brave,
 * etc.). Spec 55's executor owns provider selection via env vars and
 * is responsible for the missing-provider fallback:
 *
 *   "Strategy research is not available right now."
 *
 * **Important guardrail**: the description explicitly tells the LLM
 * what this tool is NOT for — current prices, market news, sentiment,
 * or buy/sell signals — so the agent declines those requests up front
 * instead of issuing a useless web search and synthesizing the result
 * into trading advice. Spec 58 owns the broader guardrail wiring; this
 * tool's description is the first layer.
 *
 * Privacy note: the executor must only pass the `query` string to the
 * search provider — never `userId`, conversation history, or anything
 * else from the auth context.
 */

import { z } from 'zod';
import type { AgentToolContract, AgentToolExecutor } from './types';

export const SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME =
  'search_strategy_knowledge' as const;

export const searchStrategyKnowledgeDescription =
  "Search the web for information about trading strategies, technical indicators, and Pine Script techniques. Use for research questions like 'what is VWAP anchored to session open' or 'RSI divergence patterns for crypto'. Do NOT use for current prices, market news, or buy/sell signals.";

export const searchStrategyKnowledgeInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(300)
    .describe(
      'Search query about trading strategies, indicators, or Pine Script techniques',
    ),
});

export type SearchStrategyKnowledgeInput = z.infer<
  typeof searchStrategyKnowledgeInputSchema
>;

export type SearchStrategyKnowledgeHit = {
  title: string;
  snippet: string;
  url: string;
};

export type SearchStrategyKnowledgeOutput = {
  results: SearchStrategyKnowledgeHit[];
  query: string;
};

export type SearchStrategyKnowledgeExecutor = AgentToolExecutor<
  SearchStrategyKnowledgeInput,
  SearchStrategyKnowledgeOutput
>;

export const SEARCH_STRATEGY_KNOWLEDGE_ERROR =
  'Strategy research search failed. Please try again.';

/**
 * Sanitized fallback the executor (spec 55) returns when no search
 * provider is configured (missing env var). Re-exported so spec 55
 * doesn't drift from the spec-defined copy.
 */
export const SEARCH_STRATEGY_KNOWLEDGE_UNAVAILABLE_MESSAGE =
  'Strategy research is not available right now.';

export const searchStrategyKnowledgeContract: AgentToolContract<
  SearchStrategyKnowledgeInput,
  SearchStrategyKnowledgeOutput
> = {
  name: SEARCH_STRATEGY_KNOWLEDGE_TOOL_NAME,
  description: searchStrategyKnowledgeDescription,
  inputSchema: searchStrategyKnowledgeInputSchema,
  errorMessage: SEARCH_STRATEGY_KNOWLEDGE_ERROR,
};
