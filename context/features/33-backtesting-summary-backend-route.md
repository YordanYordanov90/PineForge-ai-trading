# 33 — Backtesting Summary Backend Route

Implement the backend route for the Strategy Backtesting Summary Generator. This
spec owns the API handler only. Do not define schemas, prompts, hook state, or
UI in this step beyond importing the finished pieces.

## Prerequisites

- `31-backtesting-summary-schemas.md` is complete
- `32-backtesting-summary-prompt-utility.md` is complete
- existing `protectAiRoute()` pattern is available

## Goal

Create a protected endpoint that returns a validated backtesting checklist for
the current strategy in structured JSON.

## Route

Create:

- `app/api/backtesting-summary/route.ts`

This route should be POST-only.

## Handler Flow

Follow the existing protected AI route pattern:

1. protect route first
2. parse and validate request body with Zod
3. resolve allowed model for the current plan
4. call the AI model with the dedicated prompt
5. validate structured output
6. build or confirm normalized Markdown
7. return sanitized `{ success, data, error }` JSON

Prefer non-streaming generation for this feature.

## Response Behavior

Success response:

```ts
{
  success: true,
  data: {
    title: string,
    markdown: string,
    sections: {
      recommendedTimeframes: string[],
      recommendedMarkets: string[],
      equityCurveChecks: string[],
      failureModes: string[],
      testPlan: string[],
    },
  },
  error: null,
}
```

Error response:

```ts
{
  success: false,
  data: null,
  error: string,
}
```

## Security Requirements

- reuse `protectAiRoute()` so auth, rate limit, and entitlement checks stay consistent
- never trust raw LLM output without schema validation
- never expose provider/model stack traces or raw failures
- no DB writes in this first version

⚠️ SECURITY ALERT
Do not return unvalidated Markdown generated directly by the model. Validate the
structured sections first, then derive or normalize the final Markdown output.

## File Targets

- `app/api/backtesting-summary/route.ts`

Imports expected from:

- request/response schemas from the finished schema spec
- prompt utility from the finished prompt spec

## Scope Limits

- no schema definitions in this step
- no prompt authoring in this step
- no frontend code
- no DB persistence

## Check When Done

- POST `/api/backtesting-summary` exists and is protected
- request parsing uses the dedicated schema
- model entitlement is enforced
- response uses the validated structure
- sanitized error handling matches project standards
- `npm run build` passes
