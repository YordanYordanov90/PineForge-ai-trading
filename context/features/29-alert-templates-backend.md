# 29 — Alert Message Templates Backend

Implement the backend contract for Alert Message Templates as a dedicated AI
route. This step owns validation, provider constraints, output parsing, and
sanitized JSON responses only. Do not build UI in this step.

## Prerequisites

- `28-alert-templates-overview.md` is complete
- Existing AI route protection is available via `protectAiRoute()`
- Existing Zod validation patterns are in place

## Goal

Create a secure endpoint that accepts the current strategy context and returns a
validated set of provider-specific webhook JSON templates.

## Route

Create:

- `app/api/alert-templates/route.ts`

This route should be POST-only.

## Request Contract

Add a Zod schema for the request body.

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
- `model` required and resolved through existing entitlement rules
- optional fields should match existing generator input shapes
- validate all request input with Zod before any AI call

## Response Contract

Return JSON in the project-standard shape:

```ts
{
  success: true,
  data: {
    templates: Array<{
      provider: '3commas' | 'alertatron' | 'wundertrading' | 'custom'
      label: string
      description: string
      messageJson: string
      notes: string[]
      placeholders: string[]
    }>
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

Create a dedicated Zod schema for the model output.

Constraints:

- exactly one template per supported provider in v1
- `provider` limited to the approved enum
- `label` and `description` must be non-empty strings
- `messageJson` must be a non-empty string
- `notes` length `1..3`
- `placeholders` length `1..8`

After Zod validation, also parse each `messageJson` string with `JSON.parse()` on
the server to verify that the output is valid JSON before returning it.

If any template fails validation, return a sanitized error and do not return
partial raw model output.

## Prompting Rules

Create a dedicated prompt module under:

- `lib/ai/prompts/alert-templates.ts`

The prompt should instruct the model to:

- generate provider-ready JSON templates, not prose
- use placeholders like `YOUR_WEBHOOK_SECRET`, `YOUR_BOT_ID`, `YOUR_SYMBOL`
- keep JSON syntactically valid
- tailor fields to the provider format at a high level
- avoid inventing claims about live execution guarantees
- return only the required JSON structure

Prompt context should consider:

- strategy direction
- signal intent (entry/exit/reversal if inferable from script/prompt)
- market/timeframe context when useful
- TradingView alert-message use case

## AI SDK Pattern

Follow existing protected AI route patterns:

- protect route first
- validate request body
- resolve allowed model for the current plan
- call the AI model
- validate structured output
- verify each JSON string parses
- return sanitized JSON

Prefer non-streaming generation because the response is short and structured.

## Security Requirements

- Reuse `protectAiRoute()` so auth, rate limits, and model entitlement stay consistent
- Never execute, forward, or test generated webhook payloads server-side
- Never store provider credentials or user webhook secrets
- Never trust raw LLM output without Zod validation and JSON parse verification
- Keep least privilege: no DB writes are needed in this first version

⚠️ SECURITY ALERT
Do not send, replay, or "test" generated webhook payloads from the app. This
feature must stop at validated template generation only.

## Suggested Files

- `app/api/alert-templates/route.ts`
- `lib/ai/prompts/alert-templates.ts`
- request/response Zod schema in the current API validation area
- shared type in `lib/types/` only if both route and client need it

## Scope Limits

- No provider SDK integrations
- No network calls to 3Commas, Alertatron, or WunderTrading
- No database persistence
- No credential management
- No auto-generation as part of `/api/generate`

## Check When Done

- POST `/api/alert-templates` exists and is protected
- Request body is Zod-validated before AI execution
- Model entitlement is enforced
- LLM output is Zod-validated
- Every `messageJson` parses as valid JSON before response
- Route returns `{ success, data, error }`
- Sanitized error handling matches project standards
- `npm run build` passes
