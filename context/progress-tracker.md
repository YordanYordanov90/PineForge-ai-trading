# Progress Tracker

Update this file after every meaningful implementation change.

---

## What Has Been Done So Far

PineForge is built as a Next.js 16 App Router application with Tailwind CSS v4,
shadcn/ui, and xAI Grok via the Vercel AI SDK. Work to date delivers the full
core generator experience: marketing landing page, live streaming Pine Script
generation, syntax highlighting, script validation, history, and refinement.

**Phase 1 — Core Polish (Complete)**
The landing page at `/` includes a sticky navbar with emerald scroll progress
bar, hero section with terminal mock, feature grid, how-it-works section, code
preview, and CTA. The generator at `/generate` has a two-column layout
(lg:grid-cols-[1fr_1.05fr]), 8 template pills, strategy textarea, model selector
(Reasoning / Fast / Grok-4), Advanced Options collapsible (timeframe, market,
direction, indicators, R:R slider), balance input, and Generate button. The
output card streams live with skeleton rows, a "Streaming" badge during
generation, validator badge post-stream (green / amber), generation stats
(time + token estimate), and Download `.pine` + Copy buttons. The
`/api/generate` route validates all input with Zod before any LLM call and
returns a sanitized error on failure. The `/api/improve-prompt` route rewrites
raw descriptions into structured prompts.

**Phase 2 — Daily Driver Features (Complete)**
Script History is implemented as a localStorage-backed shadcn Sheet drawer
(max 50 FIFO entries) with load, rename, and delete actions. Refine Chat sits
below the output card and POSTs to `/api/refine-script`, streaming a full
replacement script with versioning (version = lastVersion + 1, parentId = root).
Multi-tab output (Script / Breakdown / Checklist) is live. TradingView Webhook
JSON export is implemented.

**Clerk authentication & protected routes (initial — Phase 4 foundation)**
Clerk is wired for the App Router: `ClerkProvider` + shared `appearance` in
[`app/layout.tsx`](app/layout.tsx), [`lib/auth/clerk-appearance.ts`](lib/auth/clerk-appearance.ts)
(glass card, emerald/rose styling, terminal scanline texture). Custom routes live under
[`app/(auth)/sign-in/[[...sign-in]]`](app/(auth)/sign-in/[[...sign-in]]/page.tsx) and
[`app/(auth)/sign-up/[[...sign-up]]`](app/(auth)/sign-up/[[...sign-up]]/page.tsx) with
[`AuthFormShell`](components/auth/AuthFormShell.tsx) (benefit headline + trust row: Secured by Clerk,
Used by 2,400+ traders). Request protection uses [`proxy.ts`](proxy.ts) (`clerkMiddleware` +
`createRouteMatcher`): public paths include `/`, `/sign-in`, `/sign-up`, and `/api(.*)`;
all other routes call `auth.protect()` (signed-out users are sent through Clerk). API routes
enforce sessions in handlers via [`lib/auth/require-clerk-session.ts`](lib/auth/require-clerk-session.ts).
Auth shell UX: terminal grid + ambient glow in [`app/(auth)/layout.tsx`](app/(auth)/layout.tsx),
decorative bottom ticker + activity HUD (`TerminalPriceTicker`, `TerminalActivityHud`). CSP in
[`next.config.ts`](next.config.ts) allows the Clerk Frontend API host derived from the publishable key.
`NEXT_PUBLIC_CLERK_KEYLESS_DISABLED` prevents dev keyless mode from overriding real keys.

**Phase 3 — Polish & Trust (partial)**
Live character count with warning/danger thresholds on the strategy textarea
(`StrategyInputsCard`). **Keyboard shortcuts:** document-level **Ctrl/Cmd+Enter**
runs generate when the command palette is closed; **Ctrl/Cmd+K** toggles the
command palette (`GeneratorCommandMenu` + shadcn `CommandDialog`). Palette
actions: generate, improve prompt, open history, stop, copy, download, output
tabs (including Compare when refinements exist), focus strategy field, go to landing.
Script History Sheet `open` state is
controlled from `GenerateExperience` so the palette can open the drawer.
**Compare tab:** side-by-side line diff (`diff` + `ScriptComparePanel`) between
the previous version in lineage (from history) and the current script; enabled
after at least one refine when the prior version is still in localStorage history.

**Current Security State**
Zod validation and sanitized errors are in place on all API routes. CSP header
in `next.config.ts`. **SEC-001 resolved:** Upstash Redis rate limiting on all AI
routes (per-IP + per-user tier limits). Server model entitlement, stream concurrency,
and `protectAiRoute()` are live (`context/fixes.md` Fix 2, 4, 6). Remaining hardening:
weighted quotas and audit logs (Fix 3, 7 — deferred).

**Client model entitlement UX (Fix 2 UI):**
Free users see all models in `ModelSelector`; Balanced and Maximum Quality show a lock,
are dimmed, and show a Sonner toast on click (no selection change). Plan is fetched
server-side on `/generate` and provided via [`context/UserPlanContext.tsx`](context/UserPlanContext.tsx)
(no prop drilling). History load clamps premium models to Fast for free users.
Daily quota (3 shared AI actions/24h) remains enforced by Upstash; generate shows
inline limit message + `/pricing` CTA; other routes use toast with API text.

---

## Current Phase

Phase 3 — Polish & Trust (in progress), with **Phase 4 auth + limits** largely in place.

## Current Goal

Finish Phase 3 theme toggle. Optional Phase 4 follow-ups from `context/fixes.md`
(weighted quotas, audit logs). Phase 5 high-value features.

## Phase 4 — Auth & Database Foundation

**Done (auth shell):**
- Clerk app integration, custom sign-in/sign-up pages, and middleware-based route protection (`proxy.ts`).

**Done (data layer):**
- Neon Postgres + Drizzle ORM foundation: `drizzle/schema.ts` (`users`, `collections`, `scripts`),
  `lib/db/` (neon-http + pooled `DATABASE_URL`), `drizzle.config.ts` (`DATABASE_URL_UNPOOLED` for migrations),
  npm scripts `db:generate` / `db:migrate` / `db:studio`, migrations `0000` + `0001` (committed).

**Done (per-user history):**
- `POST /api/users/sync` — upserts Clerk user into `users` on first sign-in (called from `GenerateExperience` via sessionStorage guard)
- `GET|POST /api/scripts`, `PATCH|DELETE /api/scripts/[scriptId]` — auth + ownership checks, Zod validation, metadata jsonb for full `SavedScript` round-trip
- `useScriptHistory` — API when signed in, localStorage when signed out; one-time import toast (`pineforge_migration_done`)
- `/generate` explicitly protected in `proxy.ts`; `UserButton` in generator header

**Done (rate limiting — `20-rate-limiting.md`):**
- `@upstash/ratelimit` + `@upstash/redis`; `lib/rate-limit/upstash.ts` (IP, free, pro limiters)
- `lib/rate-limit/check.ts` — `checkRateLimit(userId)` after `requireClerkSession`, before Zod/LLM
- All four AI routes: auth → rate limit → validate → Grok (`abortSignal: req.signal`)
- Limits: IP 10/min; free 3 AI requests/24h (shared bucket); pro 200/24h; `users.plan` from DB
- 429 + `Retry-After`; generate shows inline error + `/pricing` CTA on free-tier limit; refine/improve/explain use API error text in toast

**Done (AI hardening — `context/fixes.md`):**
- `lib/api/protected-ai-route.ts` — `protectAiRoute()` (auth + rate limit + plan)
- `lib/auth/model-entitlement.ts` — free tier → Fast model only; 403 on premium models
- `lib/rate-limit/concurrency.ts` — one active stream per user (409); generate/refine/explain
- Client: 403/409 toasts on refine; 403/409 on generate; explain 409/429

**Done (client model entitlement UI):**
- `context/UserPlanContext.tsx` — `UserPlanProvider` + `useUserPlan()` for `/generate` subtree
- `app/generate/page.tsx` — async RSC loads `users.plan` from Neon; passes `initialPlan`
- `ModelSelector` — lock icon, dimmed Pro-only models, toast on click; tooltips note Pro-only
- `StrategyForm.loadSavedScript` — clamps saved premium model to `DEFAULT_MODEL` for free users

**Still planned (Phase 4 / fixes backlog):**
- Weighted per-route quotas — Fix 3 (deferred)
- Usage audit logs — Fix 7 (deferred)
- Stripe / billing (Phase 5+)

## Phase 5 — High & Medium Value Features (Planned After Phase 4)

**High Value (can start even before full auth is complete):**
- TradingView Auto-Import / Deep Link
- Strategy Health Score (1–10 + actionable notes)
- Alert Message Templates for popular brokers (3Commas, Alertatron, WunderTrading)
- Strategy Backtesting Summary Generator (structured Markdown checklist)

**Medium Value (better with user accounts + DB):**
- Pinned / Starred Scripts (survives 50-entry limit, per-user)
- Strategy Tags + Search (filterable history)
- Strategy Collections / Folders ("BTC Strategies", "Testing", "Live Trading")
- Export to Notion / Obsidian (Breakdown tab as clean Markdown)

## Completed

- Phase 1 — Core Polish ✅
- Phase 2 — Daily Driver Features ✅
- `13-char-count.md` — Live character count with color thresholds (inputs card) ✅
- `14-keyboard-shortcuts.md` — Ctrl/Cmd+Enter generate, Ctrl/Cmd+K command palette ✅
- `16-strategy-comparison.md` — Output Compare tab: side-by-side diff vs previous lineage version (`lib/scripts/lineage.ts`, `ScriptComparePanel`) ✅
- **Clerk auth (initial)** — `ClerkProvider`, custom `/sign-in` + `/sign-up` with `AuthFormShell`, `clerkAppearance` (glass + trust UX), `proxy.ts` route protection, `require-clerk-session` for APIs, CSP + keyless disabled for stable Clerk JS ✅
- `18-neon-posgress.md` — Drizzle schema, `lib/db/`, `drizzle.config.ts`, migrations applied to Neon, `npm run build` passes ✅
- `19-history-migration.md` — Per-user script history API, `useScriptHistory` DB/localStorage split, localStorage import on sign-in, `/generate` auth gate, user sync route ✅
- `20-rate-limiting.md` — Upstash rate limits on AI routes, 429 UI, SEC-001 closed ✅
- **Fix 5 (abort propagation)** — `abortSignal: req.signal` on all AI SDK calls ✅
- **Fixes 2, 4, 6** — model entitlement, stream concurrency lock, `protectAiRoute` wrapper ✅
- **Fix 2 client UI** — `UserPlanContext`, locked model selector, history load clamp ✅

## In Progress

- None.

## Next Up

- Finish Phase 3: `15-theme-toggle.md`
- Optional: weighted quotas + audit logs (`context/fixes.md` Fix 3, 7)
- Phase 5 high-value features (TradingView deep link first — lowest effort, highest impact)

## Open Questions

- COPY-001: Align remaining landing copy with PineForge branding (done — hero/tagline/nav)

## Architecture Decisions

- **shiki post-stream only**: shiki is a static highlighter — never applied during streaming
  to avoid layout shift. Applied once when `isGenerating` transitions to false.
- **History storage**: Signed-in users persist scripts in Neon via `/api/scripts` (metadata
  jsonb preserves prompt, balance, structured inputs). Signed-out hook path still uses
  localStorage (try/catch). One-time import toast migrates local history on first sign-in.
- **Clerk + Next 16 proxy**: Auth gating lives in [`proxy.ts`](proxy.ts) (`clerkMiddleware` export pattern
  per Next 16); public routes explicitly listed so APIs return JSON 401 instead of HTML redirects where appropriate.
- **Drizzle ORM**: Schema in `drizzle/schema.ts`; app client in `lib/db/client.ts` (`neon-http`, pooled `DATABASE_URL`);
  migrations via `drizzle-kit` using `DATABASE_URL_UNPOOLED`. `drizzle/migrations/` is version-controlled.
- **Zod on every route**: All API inputs validated with Zod before any LLM call.
  Schemas live in `lib/api/validation.ts`.
- **Rate limiting**: `protectAiRoute()` → `checkRateLimit()` before body parse/LLM.
  Shared daily bucket across generate, refine, improve-prompt, explain-script.
- **Model entitlement**: Server — `resolveModelForPlan()` on generate/refine; free = Fast only (403).
  Client — `UserPlanContext` from `/generate` page; `ModelSelector` blocks Pro models for free users
  before submit; history load resets premium model to Fast when plan is not `pro`.
- **Free tier limits (two layers)**: Model tier (Pro models) vs daily quota (3 shared AI calls/24h via Upstash).
- **Stream concurrency**: Redis lock per user on streaming routes; 409 if busy.
- **Sanitized errors only**: Raw LLM errors and stack traces never reach the client.
  All routes return user-friendly messages.
- **CSP header**: Added in `next.config.ts` as first security layer.
- **Command palette**: `/generate` only; global `keydown` on `window` in
  `StrategyForm` for Ctrl/Cmd+K (toggle) and Ctrl/Cmd+Enter (generate when
  palette closed). Uses `cmdk` via shadcn `CommandDialog`.
- **Compare / lineage**: `lineageRef` + React `lineageState` stay in sync on generate,
  refine, and history load; cleared when a new generate starts so Compare does not
  use stale roots mid-stream.

## Session Notes

- Clerk: custom auth pages, protected non-public routes, CSP tuned for Clerk Frontend API host
- Neon/Drizzle: per-user script history wired; migrations `0000` + `0001` applied
- Upstash: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `.env.local` / Vercel
- Audit report (report.md): SEC-001 closed; remaining items in `context/fixes.md`
- Fix 2 UI: client model locks + `UserPlanContext`; deferred polish: quota hint, `/pricing` on all 429 toasts
- A11Y-001: ModelSelector radiogroup semantics done; optional follow-up: `aria-disabled` + focus when locked
- A11Y-002: LandingCodePreview decorative Copy div needs fix
- NEXT-001: Root `app/error.tsx` and `app/loading.tsx` present (tracker was stale)
