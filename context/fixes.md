# Post–Phase 5 Fix & Polish Backlog

Created: 2026-05-16  
Updated: 2026-05-17

## Purpose

Checklist of **remaining** work after Phase 5 features ship. Completed Phase 4 hardening (Clerk, Upstash quotas, `protectAiRoute`, model entitlement, stream locks on generate/refine/explain, Zod, abort signals) is **not** listed here — it is done.

Review this file before launch polish or billing work.

---

## AI routes & quotas

### Weighted usage budgets per route

Flat daily cap (free 3 / pro 200, shared across generate, refine, improve-prompt, explain) is live. Revisit if refine/explain should cost more than improve-prompt.

- [ ] Define per-route weights in product spec
- [ ] Implement in `lib/rate-limit/check.ts` (or separate limiters)
- [ ] Update client copy and 429 messages

### Structured AI audit logs

Upstash ratelimit analytics covers denials only.

- [ ] Add `logAiRequest` (userId, route, model, tokens estimate, outcome, latency)
- [ ] Store or ship to observability stack for abuse investigation

### Manual abort validation

`abortSignal: req.signal` is wired on all four AI routes.

- [ ] Cancel mid-stream in UI → confirm xAI dashboard shows usage stops

### `improve-prompt` concurrency

Generate, refine, and explain use `acquireStreamLock`; improve-prompt does not.

- [ ] Decide: share stream lock with other routes or allow parallel improve
- [ ] Implement if product wants one AI operation at a time

### Consistent 429 UX on all AI features

Generate shows inline error + upgrade CTA; refine / improve / explain use toast only.

- [ ] Add `/pricing` link (or shared CTA) on 429 toasts for refine, improve, explain
- [ ] Optional: daily quota hint in generator UI before limit is hit

---

## Billing & product

### `/pricing` page

`StrategyOutputCard` links to `/pricing` on free-tier limit; route does not exist (404).

- [ ] Add `app/pricing/page.tsx` (plans, limits, Stripe or waitlist)
- [ ] Or change CTA target until billing exists

### Stripe / plan enforcement

`users.plan` is manual in DB today.

- [ ] Stripe checkout + webhooks to set `free` / `pro`
- [ ] Remove manual Drizzle Studio plan edits in production

### Pro tier copy vs limits

429 message says “unlimited” for Pro; server cap is 200 requests / 24h.

- [ ] Align marketing and API error strings with real limits

---

## Script history & database

### Server-side 50-entry cap

Client trims to `MAX_HISTORY_ENTRIES`; `POST /api/scripts` does not FIFO-delete; DB can grow.

- [ ] On POST, delete oldest rows per user when count > 50 (or soft-archive)
- [ ] Cap migration import to 50 scripts

### Lineage / Compare with partial history

`GET /api/scripts` returns 50 newest rows globally; older root versions can drop off while refinements remain → Compare/lineage can break.

- [ ] Fetch by lineage root id, or return full lineage in one query
- [ ] Verify Compare tab after history is full

### Rate limit script write APIs

`/api/scripts` and `/api/users/sync` have no Upstash limits.

- [ ] Add light rate limits or request size caps on POST/PATCH if abuse appears

### `generationsUsed` column

Defined in `drizzle/schema.ts` but unused (quotas are Upstash-only).

- [ ] Remove column via migration, or wire to billing/analytics

---

## UX & Phase 3 polish

### Theme toggle (`15-theme-toggle.md`)

Dark-only today; `next-themes` mentioned in `context/ui-context.md`.

- [ ] Add theme provider + toggle on landing and `/generate`
- [ ] Verify Clerk appearance in light mode

---

## Code quality & ops

### ESLint (`react-hooks/set-state-in-effect`)

`npm run lint` fails (3 errors, 1 warning); `npm run build` passes.

- [ ] Fix `ExplainScriptPanel.tsx`, `RefineChat.tsx`, `StrategyForm.tsx` exhaustive-deps warning
- [ ] Add lint to CI if not already on Vercel

### `.env.example`

README lists env vars; no committed template.

- [ ] Add `.env.example` with keys only (no secrets)

### Deployment checklist

AI routes depend on Upstash env vars; missing vars cause runtime failures.

- [ ] Document: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `XAI_API_KEY`, Clerk, Neon
- [ ] Confirm `drizzle-kit migrate` runs before production traffic

### CSP hardening (optional)

`connect-src` allows all `https:`; `script-src` includes `'unsafe-eval'` for Clerk.

- [ ] Tighten allowlists once Clerk hosts are stable in prod

---

## Accessibility & cleanup

### ModelSelector keyboard (optional)

Locked Pro models use `aria-disabled`; focus/tab order could be clearer.

- [ ] Review keyboard nav when free user tabs through model options

### Dead signed-out history path

`/generate` requires auth; `useScriptHistory` localStorage path is legacy from pre-gate spec.

- [ ] Remove localStorage branch or document as intentional fallback
- [ ] Update `context/features/19-history-migration.md` if behavior is final

---

## Suggested order (after Phase 5)

1. `/pricing` + Stripe (unblocks upgrade CTAs and plan truth)
2. Server-side history cap + lineage fetch (data correctness)
3. Pro copy + consistent 429 UX
4. Weighted quotas + audit logs (if launch traffic warrants)
5. Theme toggle, ESLint, `.env.example`, optional CSP/a11y

---

## Note

None of the items above block Phase 5 feature work. They are launch polish, billing, observability, and consistency — not open security holes given current Clerk + Upstash + `protectAiRoute` setup.
