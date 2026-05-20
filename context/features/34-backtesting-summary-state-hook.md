# 34 — Backtesting Summary State Hook

Implement the frontend state and API call logic for the Strategy Backtesting
Summary Generator. This spec owns the client hook only. Do not render the UI in
this step.

## Prerequisites

- `31-backtesting-summary-schemas.md` is complete
- `33-backtesting-summary-backend-route.md` is complete

## Goal

Create a dedicated hook that requests the backtesting summary, tracks request
state, and resets stale results when the active script changes.

## Suggested File

- `hooks/useBacktestingSummary.ts`

## Hook Responsibilities

The hook should own:

- idle/loading/success/error state
- API request to `POST /api/backtesting-summary`
- parsed result storage
- retry behavior
- reset behavior when the current script context changes

The hook should not own:

- tab layout
- presentational markup
- code-block rendering

## Recommended API

Example shape:

```ts
{
  summary: BacktestingSummaryResult | null
  isLoading: boolean
  error: string | null
  generateSummary: () => Promise<void>
  resetSummary: () => void
}
```

Use a reset key pattern consistent with Health Score and Alert Templates if that
is the current app convention.

## Request Context

The hook should submit the current:

- prompt
- script
- model
- account balance
- timeframe
- market
- direction
- indicators

Only when a script exists.

## State Rules

Support these states:

- **idle**
- **loading**
- **success**
- **error**

When a new generate, refine, or history load changes the active script:

- clear previous backtesting summary state
- avoid showing stale checklist content for the wrong script

## Error Handling

- use the existing API error parsing helper patterns already in the repo
- keep error text sanitized and user-readable
- do not surface raw server/provider failures

## Scope Limits

- no UI markup
- no command palette wiring
- no persistence across reloads
- no DB writes

## Check When Done

- dedicated hook exists for backtesting summary requests
- hook exposes clean loading/error/success state
- stale results clear when the script context changes
- request logic follows existing client API patterns
