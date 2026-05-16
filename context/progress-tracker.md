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
[`app/layout.tsx`](app/layout.tsx), [`lib/clerk-appearance.ts`](lib/clerk-appearance.ts)
(glass card, emerald/rose styling, terminal scanline texture). Custom routes live under
[`app/(auth)/sign-in/[[...sign-in]]`](app/(auth)/sign-in/[[...sign-in]]/page.tsx) and
[`app/(auth)/sign-up/[[...sign-up]]`](app/(auth)/sign-up/[[...sign-up]]/page.tsx) with
[`AuthFormShell`](components/auth/AuthFormShell.tsx) (benefit headline + trust row: Secured by Clerk,
Used by 2,400+ traders). Request protection uses [`proxy.ts`](proxy.ts) (`clerkMiddleware` +
`createRouteMatcher`): public paths include `/`, `/sign-in`, `/sign-up`, and `/api(.*)`;
all other routes call `auth.protect()` (signed-out users are sent through Clerk). API routes
can enforce sessions in handlers via [`lib/require-clerk-session.ts`](lib/require-clerk-session.ts).
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
added in `next.config.ts`. SEC-001 (no IP rate limiting on AI routes) is the
only open HIGH issue — planned for Phase 3/4.

---

## Current Phase

Phase 3 — Polish & Trust (in progress), with **Phase 4 auth shell** started (Clerk + custom auth pages + route protection).

## Current Goal

Finish remaining Phase 3 polish (theme toggle, SEC-001 rate limiting). Continue Phase 4: plan/generation limits and Upstash rate limiting.

## Phase 4 — Auth & Database Foundation

**Done (auth shell):**
- Clerk app integration, custom sign-in/sign-up pages, and middleware-based route protection (`proxy.ts`).

**Done (data layer):**
- Neon Postgres + Drizzle ORM foundation: `drizzle/schema.ts` (`users`, `collections`, `scripts`),
  `lib/db.ts` (neon-http + pooled `DATABASE_URL`), `drizzle.config.ts` (`DATABASE_URL_UNPOOLED` for migrations),
  npm scripts `db:generate` / `db:migrate` / `db:studio`, initial migration
  `drizzle/migrations/0000_mute_rattler.sql` (committed). `.env.example` documents both connection strings.

**Done (per-user history):**
- `POST /api/users/sync` — upserts Clerk user into `users` on first sign-in (called from `GenerateExperience` via sessionStorage guard)
- `GET|POST /api/scripts`, `PATCH|DELETE /api/scripts/[scriptId]` — auth + ownership checks, Zod validation, metadata jsonb for full `SavedScript` round-trip
- `useScriptHistory` — API when signed in, localStorage when signed out; one-time import toast (`pineforge_migration_done`)
- `/generate` explicitly protected in `proxy.ts`; `UserButton` in generator header
- Migration `0001_unique_sentinels.sql` — `scripts.metadata` jsonb column

**Still planned:**
- Clerk-backed plan limits (e.g. free tier = 3 generations/day, Pro = unlimited) enforced in API + UI
- Basic user plan tracking + generations counter
- Upstash Redis rate limiting middleware
- This unlocks starred scripts, tags, collections, and future monetization

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
- `16-strategy-comparison.md` — Output Compare tab: side-by-side diff vs previous lineage version (`lib/script-lineage.ts`, `ScriptComparePanel`) ✅
- **Clerk auth (initial)** — `ClerkProvider`, custom `/sign-in` + `/sign-up` with `AuthFormShell`, `clerkAppearance` (glass + trust UX), `proxy.ts` route protection, optional `require-clerk-session` for APIs, CSP + keyless disabled for stable Clerk JS ✅
- `18-neon-posgress.md` — Drizzle schema, `lib/db.ts`, `drizzle.config.ts`, migration generated + applied to Neon (`db:migrate`), `npm run build` passes ✅
- `19-history-migration.md` — Per-user script history API, `useScriptHistory` DB/localStorage split, localStorage import on sign-in, `/generate` auth gate, user sync route ✅

## In Progress

- None.

## Next Up

- Finish Phase 3: `15-theme-toggle.md` + SEC-001 (IP rate limiting)
- Phase 4 (remaining): plan/generation limits, Upstash middleware
- Phase 5 high-value features (TradingView deep link first — lowest effort, highest impact)

## Open Questions

- SEC-001: Middleware-level IP throttle now, or wait and do it properly with Upstash in Phase 4?
- COPY-001: Align remaining landing copy with PineForge branding (done — hero/tagline/nav)

## Architecture Decisions

- **shiki post-stream only**: shiki is a static highlighter — never applied during streaming
  to avoid layout shift. Applied once when `isGenerating` transitions to false.
- **History storage**: Signed-in users persist scripts in Neon via `/api/scripts` (metadata
  jsonb preserves prompt, balance, structured inputs). Signed-out hook path still uses
  localStorage (try/catch). One-time import toast migrates local history on first sign-in.
- **Clerk + Next 16 proxy**: Auth gating lives in [`proxy.ts`](proxy.ts) (`clerkMiddleware` export pattern
  per Next 16); public routes explicitly listed so APIs return JSON 401 instead of HTML redirects where appropriate.
- **Drizzle ORM**: Schema in `drizzle/schema.ts`; app client in `lib/db.ts` (`neon-http`, pooled `DATABASE_URL`);
  migrations via `drizzle-kit` using `DATABASE_URL_UNPOOLED`. `drizzle/migrations/` is version-controlled.
- **Zod on every route**: All API inputs validated with Zod before any LLM call.
  generateSchema, refineScriptSchema, improvePromptSchema, explainScriptSchema all live
  in `lib/validation.ts`.
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
- Build passes after task 16 (Compare tab + `diff` side-by-side)
- Audit report (report.md) has 1 HIGH (SEC-001) and 4 MEDIUM open items
- A11Y-001: ModelSelector needs radiogroup semantics
- A11Y-002: LandingCodePreview decorative Copy div needs fix
- NEXT-001: Root `app/error.tsx` and `app/loading.tsx` present (tracker was stale)
- COPY-001: Align remaining landing copy with PineForge branding (done — hero/tagline/nav)