# 32 — Backtesting Summary Prompt Utility

Create the prompt and any small utility helpers for the Strategy Backtesting
Summary Generator. This spec owns prompt structure and Markdown assembly only.
Do not create the route, schemas, hook, or UI in this step.

## Goal

Produce a concise, trader-useful backtesting checklist that focuses on:

- recommended timeframes
- recommended markets
- what to inspect in the equity curve
- common failure modes
- a short next-step test plan

## Suggested Files

- `lib/ai/prompts/backtesting-summary.ts`
- optional helper in `lib/scripts/` or `lib/ai/` only if formatting logic should
  stay out of the route

## Prompt Requirements

The prompt should instruct the model to:

- analyze strategy structure, not promise performance
- recommend where and how to test the strategy first
- produce concise checklist-style content
- keep advice specific to the strategy type when inferable
- avoid financial advice and certainty language
- return only the required structured output shape

The prompt should consider:

- strategy description
- generated Pine Script
- timeframe, market, direction, and indicators when provided

## Structured Sections

The prompt must return content for:

- `recommendedTimeframes`
- `recommendedMarkets`
- `equityCurveChecks`
- `failureModes`
- `testPlan`

Each item should be short, actionable, and easy to render as bullets.

## Markdown Utility

If the feature returns both structured sections and a `markdown` field, create a
small helper that assembles normalized Markdown from the structured sections.

Recommended behavior:

- stable heading order
- bullet list formatting under each heading
- no extra prose before or after the checklist

Suggested heading order:

1. `## Recommended Timeframes`
2. `## Recommended Markets`
3. `## What To Check In The Equity Curve`
4. `## Common Failure Modes`
5. `## Backtesting Plan`

## Security Requirements

- prompt must frame output as research guidance, not execution certainty
- do not ask the model to fabricate backtest metrics
- do not let user input bypass structured output requirements

⚠️ SECURITY ALERT
Do not let the model invent performance claims like expected win rate, CAGR, or
profitability estimates. The checklist must stay advisory and qualitative.

## Scope Limits

- no route logic
- no network requests
- no persistence
- no UI rendering

## Check When Done

- dedicated prompt module exists for backtesting summary generation
- output sections map cleanly to the response schema
- Markdown assembly is deterministic and reusable
- no performance-claim language is required by the prompt
