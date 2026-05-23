# 53 — Forge Agent Tools

Defines every tool the Forge Agent can call. Each tool has a name,
description (for the LLM), Zod input schema, what it calls internally,
what it returns, and how errors are handled.

Tools live in `lib/agent/tools/` — one file per tool, re-exported from
`lib/agent/tools/index.ts` as a single `forgeTools` object for the
`streamText` call in spec `55`.

## Design Principles

1. **Tools wrap existing endpoints.** The agent calls the same backend
   the UI uses. No parallel "agent API" — the agent is a consumer.
2. **Zod on every input.** The agent's arguments are validated before
   the tool executes. Invalid args return a tool error, not a crash.
3. **Scoped to the authenticated user.** Every tool receives the
   `userId` (DB integer) from the streaming endpoint's auth context.
   Tools never accept a user ID as an argument from the LLM.
4. **Sanitized results.** Tool results are structured data, not raw
   API responses. Errors return a user-friendly string, never stack
   traces or internal details.

## Tool: `search_user_scripts`

Search the user's script history by text, tags, starred status, or
collection.

| Field | Value |
|-------|-------|
| **Internal call** | `searchScriptsForUser(userId, filters)` from `lib/db/search-user-scripts.ts` |
| **Returns** | `{ scripts: SavedScript[], count: number }` |
| **Error** | `"Could not search your scripts. Please try again."` |

```ts
const searchUserScriptsInput = z.object({
  query: z.string().max(200).optional()
    .describe('Free text search across script names and prompts'),
  tags: z.array(z.string().max(24)).max(5).optional()
    .describe('Filter by tags — all must match'),
  starred: z.boolean().optional()
    .describe('Filter to only starred or only unstarred scripts'),
  collectionId: z.number().int().positive().optional()
    .describe('Filter to a specific collection'),
});
```

**LLM description**: "Search the user's saved Pine Script strategies by
name, prompt text, tags, starred status, or collection. Use this to find
past strategies the user mentions or to reference their history."

## Tool: `get_script_details`

Load a specific script by ID with full content and metadata.

| Field | Value |
|-------|-------|
| **Internal call** | Direct Drizzle query on `scripts` with `eq(scripts.id, id)` AND `eq(scripts.userId, userId)` |
| **Returns** | `SavedScript` (full object including content, tags, collection, metadata) |
| **Error** | `"Script not found or you don't have access to it."` |

```ts
const getScriptDetailsInput = z.object({
  scriptId: z.number().int().positive()
    .describe('The ID of the script to load'),
});
```

**LLM description**: "Load the full details of a specific saved script
by its ID, including the Pine Script code, prompt, tags, and metadata.
Use when you need to read or analyze a specific script."

## Tool: `run_health_score`

Run a Health Score analysis on a Pine Script.

| Field | Value |
|-------|-------|
| **Internal call** | Internal function call to the same logic as `POST /api/health-score` (shared handler, not HTTP round-trip) |
| **Returns** | `{ score: number, verdict: string, summary: string, strengths: string[], risks: string[], nextSteps: string[] }` |
| **Error** | `"Health Score analysis failed. Please try again."` |

```ts
const runHealthScoreInput = z.object({
  script: z.string().min(1)
    .describe('The Pine Script code to analyze'),
  prompt: z.string().optional()
    .describe('The original strategy description, if available'),
});
```

**LLM description**: "Run a structural Health Score analysis (1–10) on
a Pine Script. Returns a score, verdict, strengths, risks, and
actionable next steps. Use when the user asks about script quality or
wants feedback on their strategy."

## Tool: `run_backtest_summary`

Generate a backtesting research checklist for a strategy.

| Field | Value |
|-------|-------|
| **Internal call** | Shared handler from `POST /api/backtesting-summary` logic |
| **Returns** | `BacktestSummaryResult` (title, sections, markdown) |
| **Error** | `"Backtesting summary generation failed. Please try again."` |

```ts
const runBacktestSummaryInput = z.object({
  script: z.string().min(1)
    .describe('The Pine Script code to analyze'),
  prompt: z.string().optional()
    .describe('The original strategy description'),
  market: z.string().optional()
    .describe('Target market, e.g. "BTC/USDT", "SPY"'),
  timeframe: z.string().optional()
    .describe('Target timeframe, e.g. "5m", "15m", "1h"'),
});
```

**LLM description**: "Generate a structured backtesting research
checklist for a strategy — recommended timeframes, markets, what to
check in the equity curve, common failure modes, and a test plan. Use
when the user wants to know how to test their strategy."

## Tool: `generate_alert_templates`

Generate webhook JSON templates for automation platforms.

| Field | Value |
|-------|-------|
| **Internal call** | Shared handler from `POST /api/alert-templates` logic |
| **Returns** | `AlertTemplateResult` (array of provider templates with messageJson) |
| **Error** | `"Alert template generation failed. Please try again."` |

```ts
const generateAlertTemplatesInput = z.object({
  script: z.string().min(1)
    .describe('The Pine Script code to generate alerts for'),
  prompt: z.string().optional()
    .describe('The original strategy description'),
});
```

**LLM description**: "Generate ready-to-use webhook JSON templates for
popular automation platforms (3Commas, Alertatron, WunderTrading, Custom).
Use when the user wants to set up automated alerts for their strategy."

## Tool: `refine_script`

Refine an existing Pine Script based on a natural language instruction.

| Field | Value |
|-------|-------|
| **Internal call** | Shared handler from `POST /api/refine-script` logic (streaming, but tool waits for completion and returns the final script) |
| **Returns** | `{ script: string }` (the refined Pine Script) |
| **Error** | `"Script refinement failed. Please try again."` |

```ts
const refineScriptInput = z.object({
  script: z.string().min(1)
    .describe('The current Pine Script code to refine'),
  instruction: z.string().min(1).max(1000)
    .describe('What to change — e.g. "add a volume filter" or "change RSI period to 21"'),
  prompt: z.string().optional()
    .describe('The original strategy description for context'),
});
```

**LLM description**: "Refine an existing Pine Script based on a
specific instruction. Returns the complete updated script. Use when
the user asks to modify, improve, or change their current strategy."

## Tool: `search_strategy_knowledge`

Web search scoped to trading strategy and indicator research.

| Field | Value |
|-------|-------|
| **Internal call** | Web search API (implementation TBD — could be Tavily, Serper, or similar; see Implementation Notes) |
| **Returns** | `{ results: Array<{ title: string, snippet: string, url: string }>, query: string }` |
| **Error** | `"Strategy research search failed. Please try again."` |

```ts
const searchStrategyKnowledgeInput = z.object({
  query: z.string().min(1).max(300)
    .describe('Search query about trading strategies, indicators, or Pine Script techniques'),
});
```

**LLM description**: "Search the web for information about trading
strategies, technical indicators, and Pine Script techniques. Use for
research questions like 'what is VWAP anchored to session open' or
'RSI divergence patterns for crypto'. Do NOT use for current prices,
market news, or buy/sell signals."

**Implementation note**: the search provider is a runtime dependency
chosen at implementation time. The tool definition is provider-agnostic —
only the `execute` function touches the provider SDK. If no search
provider is configured (missing env var), the tool returns a graceful
error: `"Strategy research is not available right now."`.

## Tool Registration

All tools are exported as a single object from `lib/agent/tools/index.ts`:

```ts
import { tool } from 'ai';

export const forgeTools = {
  search_user_scripts: tool({ description, parameters, execute }),
  get_script_details: tool({ description, parameters, execute }),
  run_health_score: tool({ description, parameters, execute }),
  run_backtest_summary: tool({ description, parameters, execute }),
  generate_alert_templates: tool({ description, parameters, execute }),
  refine_script: tool({ description, parameters, execute }),
  search_strategy_knowledge: tool({ description, parameters, execute }),
};
```

The streaming endpoint (spec `55`) passes `forgeTools` directly to
`streamText({ tools: forgeTools, ... })`.

## Security Notes

- Every tool that touches user data receives `userId` from the
  endpoint's auth context, never from the LLM's arguments.
- The `refine_script` tool counts against the user's daily AI quota
  (same as a manual refine from `/generate`). The streaming endpoint
  tracks tool-level quota consumption.
- `search_strategy_knowledge` does not pass user data to the search
  provider — only the search query string.
- Tool results are not cached — each invocation is a fresh call.
  Caching can be added later if needed.

## Scope Limits

- This spec defines tool contracts only (names, schemas, descriptions)
- Tool `execute` implementations are wired in spec `55` (streaming endpoint)
- No CRUD routes (spec `54`)
- No UI for tool result display (spec `57`)
- No guardrail logic (spec `58` — but tool descriptions include
  scope guidance for the LLM)
