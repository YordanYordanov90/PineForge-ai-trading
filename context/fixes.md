# AI API Hardening Fixes

Created: 2026-05-16
Updated: 2026-05-16

## Purpose

Security audit backlog for AI API routes. Tracks what is implemented vs deferred.

## Routes Reviewed

- `app/api/generate/route.ts`
- `app/api/refine-script/route.ts`
- `app/api/improve-prompt/route.ts`
- `app/api/explain-script/route.ts`
- `lib/api/validation.ts`
- `lib/config/constants.ts`
- `lib/auth/require-clerk-session.ts`
- `lib/api/protected-ai-route.ts`
- `proxy.ts`
- `hooks/useScriptGeneration.ts`
- `hooks/usePromptImprover.ts`

## Current State Summary

- API routes use `protectAiRoute()` (Clerk session + Upstash rate limit + plan from DB)
- Zod validation before model calls
- Free tier limited to `DEFAULT_MODEL` on generate/refine (403 if premium model requested)
- Per-user stream lock on generate, refine, explain (409 if parallel stream)
- Sanitized errors; `abortSignal` propagated to AI SDK
- **Deferred:** weighted per-route quotas (Fix 3), structured audit logs (Fix 7)

## Required Fixes

### 1. Add server-side quota enforcement before every AI call ✅

Done via `lib/rate-limit/check.ts` + feature 20: IP 10/min, free 3/24h, pro 200/24h, shared bucket, 429 + `Retry-After`.

### 2. Add plan-based model entitlement checks ✅

Done via `lib/auth/model-entitlement.ts` — `resolveModelForPlan()` on generate/refine; free → `grok-4-1-fast-non-reasoning` only; pro → all enum models; 403 on violation.

### 3. Add weighted usage budgets per route — DEFERRED

Flat daily cap is live. Revisit before launch if refine/explain should cost more than improve-prompt.

### 4. Add per-user concurrency limits for streaming AI routes ✅

Done via `lib/rate-limit/concurrency.ts` — Redis `SET NX EX 300` on generate, refine, explain; 409 if lock held; released in `onFinish` / error path.

### 5. Propagate abort/cancel signals to the provider call ✅

All four AI routes pass `abortSignal: req.signal` into `streamText` / `generateText`.

Manual validation still useful: cancel mid-stream → confirm xAI usage stops.

### 6. Reduce the chance of future public AI endpoints ✅

Done via `lib/api/protected-ai-route.ts` — `protectAiRoute()` centralizes auth + rate limit + plan; all four AI routes use it.

### 7. Add auditing and usage logs for abuse visibility — DEFERRED

Upstash ratelimit analytics covers denials for now. Add structured `logAiRequest` when investigating production abuse.

## Non-Issues / Things Already Good

- Clerk session checks (via `protectAiRoute`)
- Zod validation before model calls
- Allowed model values restricted by enum
- Error responses sanitized
- Explain requests not eagerly fired until tab is active

## Priority Order (remaining)

1. Fix 3 — weighted quotas (when product/billing needs it)
2. Fix 7 — audit logs (when ops needs visibility)
3. Fix 5 — manual abort validation in xAI dashboard

## Important Note

Authenticated abuse surface is substantially reduced. Remaining gaps are economic fairness (weights) and observability (logs), not open-ended spend.
