# 26 — Strategy Health Score Backend

Implement the backend contract for Strategy Health Score as a dedicated AI route.
This step owns validation, security boundaries, prompt structure, output parsing,
and sanitized responses only. Do not build UI in this step.

## Prerequisites

- `25-health-score-overview.md` is complete
- Existing AI route protection is available via `protectAiRoute()`
- Existing Zod validation patterns in `lib/api/validation.ts` are unchanged

## Goal

Create a secure endpoint that accepts the current strategy context, runs a short
AI review, and returns a strictly validated JSON result for UI rendering.

## Route

Create:

- `app/api/health-score/route.ts`

This route should be POST-only.

## Request Contract

Add a new Zod schema for the request body.

Recommended shape:

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
- `model` required, but resolve through the existing entitlement guard
- Optional fields must be nullable/optional exactly like existing generator inputs
- Validate all external input with Zod before any AI call

## Response Contract

Return JSON in the project-standard API shape:

```ts
{
  success: true,
  data: {
    score: number,
    verdict: string,
    summary: string,
    strengths: string[],
    risks: string[],
    nextSteps: string[],
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

## Output Validation

Create a dedicated Zod schema for the model output and validate the LLM result
before returning it to the client.

Constraints:

- `score` must be integer `1..10`
- `verdict` non-empty string, max reasonable label length
- `summary` non-empty string
- `strengths` array length `2..4`
- `risks` array length `2..4`
- `nextSteps` array length `2..4`

If output validation fails, return a sanitized 500/502-style JSON error and do
not forward the raw model response.

## Prompting Rules

Create a dedicated prompt module under:

- `lib/ai/prompts/health-score.ts`

The prompt should instruct the model to:

- analyze strategy structure, not profitability
- score trading logic robustness from 1 to 10
- avoid financial advice language
- keep feedback concise and concrete
- return only the required JSON shape

Prompt content should evaluate:

- signal clarity
- risk management completeness
- exit logic quality
- overfitting risk
- missing filters or confirmations
- whether the strategy is realistically backtest-ready

## AI SDK Pattern

Follow existing project patterns:

- protect route first
- validate request body
- resolve allowed model for the current plan
- call the AI model
- validate response payload
- return sanitized JSON

Prefer non-streaming generation for this feature since the payload is short and
structured.

## Security Requirements

- Reuse `protectAiRoute()` so auth, rate limit, and entitlement checks stay consistent
- Never pass raw request body to the model without Zod validation
- Never trust raw LLM JSON without Zod validation
- Never expose stack traces, provider errors, or prompt internals to the client
- Keep least-privilege: route only needs current request data, no DB writes

⚠️ SECURITY ALERT
Do not render or store unvalidated LLM output. Parse Health Score results through
a dedicated Zod schema before returning them to the client.

## Suggested Files

- `app/api/health-score/route.ts`
- `lib/ai/prompts/health-score.ts`
- `lib/api/validation.ts` or nearby validation module used by current routes
- `lib/types/` only if a shared result type is needed by both route and client

## Scope Limits

- No database writes or schema changes
- No saved history of scores
- No UI code
- No automatic invocation from generate/refine routes
- No multi-model comparison logic

## Check When Done

- POST `/api/health-score` exists and is protected
- Request body is Zod-validated before AI execution
- Model entitlement is enforced
- LLM output is Zod-validated before response
- Route returns `{ success, data, error }`
- Sanitized error handling matches project standards
- `npm run build` passes
