# 55 — Forge Agent Streaming Endpoint

The core agent endpoint: `POST /api/forge`. Accepts a user message,
streams an assistant response with tool calling via `streamText`, and
persists the exchange to the conversation.

## Route

```
app/api/forge/route.ts → POST only
```

## Request

```ts
const forgeMessageSchema = z.object({
  conversationId: z.number().int().positive()
    .describe('The conversation thread to continue'),
  message: z.string().min(1).max(4000).trim()
    .describe('The user message'),
});
```

**Auth**: `requireClerkSession` → `getDbUserIdByClerk`. The user must
own the conversation (verified before any LLM call).

**Rate limiting**: `protectAiRoute()` — same wrapper as all AI routes.
The conversation-level `streamText` call counts as 1 AI action against
the user's daily quota. Tool calls that trigger sub-AI-calls (health
score, backtest summary, alert templates, refine) each count as an
additional AI action. The endpoint tracks tool-call quota consumption
so users are not surprised by multiple deductions from a single turn.

## Flow

1. **Auth + rate limit** — `protectAiRoute()` (session + quota + plan)
2. **Validate body** — `forgeMessageSchema.safeParse`
3. **Load conversation** — `getConversationForUser(userId, conversationId)`;
   404 if missing, 403 if not owned
4. **Check message cap** — if `messages.length >= 200`, return 400 with
   `"This conversation has reached the message limit. Please start a new one."`
5. **Load long-term memory** — `getAgentMemory(userId)` from
   `agent_memory` table; returns `AgentUserProfile` or `{}`
6. **Build system prompt** — `buildForgeSystemPrompt(profile, scriptContext?)`
   from `lib/agent/system-prompt.ts` (see System Prompt section below)
7. **Build message history** — convert stored `AgentMessage[]` to the
   Vercel AI SDK message format, append the new user message
8. **Stream** — `streamText({ model, system, messages, tools, maxSteps, abortSignal })`
   - `model`: resolved via `resolveModelForPlan(plan)` — same entitlement
     as other AI routes
   - `tools`: `forgeTools` from spec `53`
   - `maxSteps`: `5` — allows the agent to call up to 5 tools in a single
     turn before it must respond with text. Prevents infinite tool loops.
   - `abortSignal`: `req.signal` for client disconnect cleanup
   - `onFinish`: callback that persists the exchange (see Persistence below)
9. **Return** — stream the response to the client using the AI SDK's
   streaming response format

## System Prompt

`lib/agent/system-prompt.ts` exports `buildForgeSystemPrompt(profile, context?)`.

The system prompt has three sections:

### 1. Identity & Scope

```
You are Forge, PineForge's strategy workflow assistant. You help traders
build, analyze, and organize Pine Script v5 strategies.

You have access to tools that can search the user's script history, run
Health Score analysis, generate backtesting plans, create alert templates,
refine scripts, and research trading strategies.

You are NOT a trading advisor. You do not give buy/sell recommendations,
predict prices, or provide financial advice.
```

### 2. Long-Term Memory (injected dynamically)

When `profile` is non-empty:

```
## What You Know About This User

- Preferred markets: BTC, ETH
- Preferred timeframes: 5m, 15m
- Preferred indicators: RSI, MACD, EMA
- Risk tolerance: moderate
- Strategy patterns: momentum, scalping
- Average Health Score: 6.4 (across 23 strategies)
- Notes: User consistently forgets volume filters. Prefers 3Commas.
```

When `profile` is empty: section is omitted entirely.

### 3. Guardrails (injected from spec `58`)

The guardrails section is a static block defined in spec `58` and
appended to every system prompt. It defines refusal patterns, prohibited
topics, and output constraints.

### 4. Script Context (optional)

When the conversation was started from `/forge?scriptId=<id>`, the
linked script's content and metadata are injected:

```
## Active Script Context

Title: MACD Volume Breakout
Script: [Pine Script content truncated to first 2000 chars]
Prompt: "Build a MACD crossover with volume confirmation for BTC 15m"
Tags: btc, scalping, macd
Health Score: 7/10 (if previously run)
```

## Tool Execution Context

Each tool's `execute` function receives an internal context object (not
from the LLM) containing:

```ts
interface ForgeToolContext {
  userId: number;      // DB user ID from auth
  plan: string;        // 'free' | 'pro'
  abortSignal: AbortSignal;
}
```

Tools that call AI sub-routes (health score, backtest, alerts, refine)
check the user's remaining quota before executing. If the quota is
exhausted, the tool returns an error message:
`"You've reached your daily AI limit. This analysis requires an AI call."`

The agent sees this error and can tell the user without crashing.

## Persistence (onFinish)

After the stream completes (including all tool calls), the `onFinish`
callback:

1. Constructs the new `AgentMessage` objects (user message + assistant
   response including any tool calls/results)
2. Calls `appendMessages(conversationId, userId, newMessages)` to
   persist to the jsonb array
3. If `title` is `null` (first exchange), generates a short title
   (≤60 chars) from the user's first message and calls
   `updateConversationTitle`. Title generation uses a single
   `generateText` call with a short prompt — not a full agent turn.

## Error Handling

| Condition | Status | Response |
|-----------|--------|----------|
| Not authenticated | 401 | JSON `{ error: "..." }` |
| Rate limited | 429 | JSON `{ error: "..." }` + `Retry-After` |
| Invalid body | 400 | JSON `{ error: "...", issues: [...] }` |
| Conversation not found | 404 | JSON `{ error: "Conversation not found." }` |
| Not owner | 403 | JSON `{ error: "Access denied." }` |
| Message cap reached | 400 | JSON `{ error: "This conversation has reached..." }` |
| Model entitlement | 403 | JSON `{ error: "Premium model requires Pro plan." }` |
| LLM failure | 502 | JSON `{ error: "Forge encountered an error. Please try again." }` |
| Missing API key | 503 | JSON `{ error: "AI service is not configured." }` |

All errors are sanitized — no raw LLM errors, stack traces, or internal
details reach the client.

## Concurrency

Same pattern as other streaming routes: Redis concurrency lock per user
via `lib/rate-limit/concurrency.ts`. Only one active Forge stream per
user at a time. Second concurrent request → 409.

## File Structure

```
app/api/forge/route.ts                    → POST handler
lib/agent/system-prompt.ts                → buildForgeSystemPrompt()
lib/agent/tools/index.ts                  → forgeTools object
lib/agent/tools/search-user-scripts.ts    → tool implementation
lib/agent/tools/get-script-details.ts     → tool implementation
lib/agent/tools/run-health-score.ts       → tool implementation
lib/agent/tools/run-backtest-summary.ts   → tool implementation
lib/agent/tools/generate-alert-templates.ts → tool implementation
lib/agent/tools/refine-script.ts          → tool implementation
lib/agent/tools/search-strategy-knowledge.ts → tool implementation
```

## Scope Limits

- No conversation CRUD (spec `54` — must be implemented first)
- No memory extraction (spec `56` — runs after conversations, not during)
- No UI (spec `57`)
- No guardrails definition (spec `58` — but the system prompt references
  the guardrails block)
- No streaming of individual tool results to the client in real-time
  (v1 — the full response streams, but tool call progress is shown
  after the tool completes, not during). Real-time tool progress is a
  future enhancement.
