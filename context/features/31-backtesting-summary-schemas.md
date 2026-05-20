# 31 — Backtesting Summary Schemas

Define the shared request/response contracts for the Strategy Backtesting
Summary Generator. This spec owns schemas and shared types only. Do not create
the prompt, route, hook, or UI in this step.

## Goal

Add strict contracts for a feature that returns a structured Markdown-oriented
backtesting checklist for the current strategy.

## Scope

This step owns:

- request Zod schema
- response Zod schema
- shared TypeScript types if needed by both route and client

This step does **not** own:

- AI prompt composition
- route handler logic
- client fetching
- rendering
- database persistence

## Suggested Files

- `lib/api/validation.ts` or the current validation area used by AI routes
- `lib/types/` only if shared route/client types are needed

## Request Contract

Recommended request shape:

```ts
{
  prompt: string
  script: string
  model: string
  accountBalance?: number | null
  timeframe?: string | null
  market?: string | null
  direction?: 'long' | 'short' | 'both' | null
  indicators?: string[]
}
```

Rules:

- `prompt` required, trimmed, bounded
- `script` required, trimmed, bounded
- `model` required
- optional fields should match existing generator input shapes exactly
- no raw unknown fields should be trusted without schema parsing

## Response Contract

Return project-standard JSON:

```ts
{
  success: true,
  data: {
    title: string
    markdown: string
    sections: {
      recommendedTimeframes: string[]
      recommendedMarkets: string[]
      equityCurveChecks: string[]
      failureModes: string[]
      testPlan: string[]
    }
  },
  error: null,
}
```

Error shape:

```ts
{
  success: false,
  data: null,
  error: string,
}
```

## Output Constraints

The structured result should enforce:

- `title` non-empty string
- `markdown` non-empty string
- `recommendedTimeframes` length `2..6`
- `recommendedMarkets` length `2..6`
- `equityCurveChecks` length `3..8`
- `failureModes` length `3..8`
- `testPlan` length `3..8`

The `markdown` field should be derived from or aligned with the structured
sections, not treated as an unvalidated blob from the client.

## Validation Rules

- validate all external request input with Zod before AI execution
- validate all model output with Zod before sending to the client
- keep types narrow and explicit; no `any`

## DB Boundary

No Drizzle schema changes are needed for this feature unit. Do not add database
tables or columns in this step.

## Check When Done

- request schema exists for backtesting summary generation
- response schema exists for the structured checklist payload
- shared types are available where needed without duplication
- no DB schema changes were introduced
