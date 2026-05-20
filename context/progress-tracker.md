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

## UI/UX Improvements (`context/UI/`)

Polish and discoverability work tracked separately from feature phases. Specs live
in [`context/UI/`](UI/). Update the **Status** column when a spec ships.

| Spec | Title | Status |
|------|-------|--------|
| [`01-shortcut-tooltips`](UI/01-shortcut-tooltips.md) | Shortcut tooltips | Done |
| [`02-output-action-bar`](UI/02-output-action-bar.md) | Output action bar | Done |
| [`03-script-output-empty-state`](UI/03-script-output-empty-state.md) | Script output empty state | Done |
| [`04-health-next-step-refine`](UI/04-health-next-step-refine.md) | Health next step refine | Done |
| [`05-motion-feedback`](UI/05-motion-feedback.md) | Motion feedback | Done |
| [`06-sticky-output-tabs`](UI/06-sticky-output-tabs.md) | Sticky output tabs | Done |
| [`07-history-sidebar-toggle`](UI/07-history-sidebar-toggle.md) | History sidebar toggle | Planned |
| [`08-terminal-polish`](UI/08-terminal-polish.md) | Terminal polish | Done |
| [`11-terminal-identity-phase-2`](UI/11-terminal-identity-phase-2.md) | Terminal identity phase 2 | Done |
| [`12-generate-desk-atmosphere`](UI/12-generate-desk-atmosphere.md) | Generate desk atmosphere | Done |
| [`09-prompt-health-badge`](UI/09-prompt-health-badge.md) | Prompt health badge | Done |
| [`10-deferred-fullscreen-theme-timeline`](UI/10-deferred-fullscreen-theme-timeline.md) | Deferred fullscreen / theme / timeline | Partial (theme done — see `15-theme-toggle`) |

---

## Current Phase

Phase 5 — High-Value Workflow Features (in progress), with Phase 4 auth +
database foundations in place.

## Current Goal

**Strategy Backtesting Summary Generator** shipped end-to-end (`31`–`35`).
Phase 5 high-value features (TradingView Copy & Open, Health Score, Alert
Templates, Backtest Summary) are all complete. Next: pick from Phase 5
medium-value features or address deferred Phase 4 hardening from
`context/fixes.md` (weighted quotas, audit logs).

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
- TradingView Copy & Open — complete (`21`–`24`: clipboard + Pine Editor tab, button, Ctrl/Cmd+T + palette)
- Strategy Health Score — complete (`25` overview, `26` backend, `27` UI)
- Alert Message Templates — complete (`28`–`30`: 3Commas, Alertatron, WunderTrading, Custom)
- Strategy Backtesting Summary Generator — complete (`31` schemas, `32` prompt + Markdown helper, `33` backend route, `34` hook, `35` UI)

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
- `21-23 TradingView` — Copy & Open pattern: `copyAndOpenTradingView()` copies script to clipboard + opens Pine Editor tab; Sonner toast confirmation; Ctrl/Cmd+T shortcut with typing guard; command palette entry. (Deep link URL format was undocumented and 404'd — replaced in spec 24.) ✅
- `24-replace-deep-link.md` — Replaced `getTradingViewDeepLink` / `openInTradingView` with reliable clipboard + `pine-editor/` tab flow ✅
- `25-health-score-overview.md` — Strategy Health Score product spec (scoring intent, output shape, trigger rules) ✅
- `26-health-score-backend.md` — POST `/api/health-score` (Zod request/response, `protectAiRoute`, model entitlement, `generateObject` + output re-validation, `lib/ai/prompts/health-score.ts`, sanitized `{ success, data, error }` JSON) ✅
- `27-health-score-ui.md` — `Health` output tab, `HealthScorePanel`, `useHealthScore`, manual **Run Health Score**; state clears on generate/refine/history load (`healthScoreResetKey`); command palette **Health tab** entry ✅
- `28-alert-templates-overview.md` — Alert Message Templates product spec (v1 providers, template-only rules) ✅
- `29-alert-templates-backend.md` — POST `/api/alert-templates` (Zod request/response, `protectAiRoute`, `generateObject`, per-`messageJson` `JSON.parse` verification, `lib/ai/prompts/alert-templates.ts`) ✅
- `30-alert-templates-ui.md` — `Alerts` output tab, `AlertTemplatesPanel`, `AlertTemplateCard`, `useAlertTemplates`, manual **Generate Alert Templates**; state clears on generate/refine/history load (`alertTemplatesResetKey`); command palette **Alerts tab** entry ✅
- **UI/UX `01-shortcut-tooltips`** — `ActionTooltip` + `lib/ui/shortcut-label.ts`; tooltips on Generate (`⌘/Ctrl+↵`), Open in TradingView (`⌘/Ctrl+T`), Copy/Download (label-only); platform-aware shortcut hints in inputs tip line ✅
- **UI/UX `02-output-action-bar`** — `OutputActionBar` icon-first export strip (tooltips + `aria-label`); handlers from `StrategyForm` including shared `handleOpenInTradingView` ✅
- **UI/UX `03-script-output-empty-state`** — Terminal-themed Script tab idle state with 4 static starter chips (`lib/config/prompt-suggestions.ts`); `onSuggestionClick` fills `#strategy` and focuses the textarea from `StrategyForm` ✅
- **UI/UX `04-health-next-step-refine`** — Per next-step **Refine** in `HealthScorePanel`; `refinePrefillInstruction` + `refinePrefillNonce` prefill `RefineChat` (editable, no auto-submit); scroll/focus `#refine-chat` ✅
- **UI/UX `05-motion-feedback`** — CSS-only `motion-btn-press`, `motion-ready-generate`, `animate-success-pulse` in `globals.css`; Generate ready glow + output card one-shot pulse on successful generation; `prefers-reduced-motion` respected ✅
- **UI/UX `06-sticky-output-tabs`** — Sticky `TabsList` with backdrop blur inside scrollable output panel (`max-h-[min(72vh,720px)]`); Lucide icons on Script/Breakdown/Checklist/Health/Alerts/Compare; horizontal scroll on narrow viewports ✅
- **UI/UX `08-terminal-polish`** — Shared terminal texture utilities in `globals.css` + `lib/ui/terminal-texture.ts` (noise, scanlines, phosphor glow, code surface); auth shell + `/generate` reuse `terminal-noise`; output panel `terminal-code-surface`; active tabs/model/pills/webhook get subtle emerald phosphor glow ✅
- **UI/UX `11-terminal-identity-phase-2`** — `TerminalAmbientBackground` (emerald-only shared shell); single scanline owner on `terminal-code-surface`; semantic `terminal-active-*` tokens; streaming scanline pulse + cursor glow + status line; `TerminalOutputChrome` frame; mono uppercase tab labels + blinking `$` prompt ✅
- **UI/UX `12-generate-desk-atmosphere`** — `TerminalPriceTicker` `variant="generate"` (68s scroll, dimmer `text-zinc-600` symbols + muted emerald/rose deltas, `bg-zinc-950/60` strip, 3.8s jitter); fixed bottom strip on `/generate` only (no activity HUD); `terminal-glow-breathe` 10s on generate ambient top glow; content `pb-28`/`pb-32` clears ticker; `prefers-reduced-motion` disables scroll + breathe; auth lobby unchanged ✅
- **UI/UX `09-prompt-health-badge`** — Client-only `evaluatePromptHealth()` in `lib/prompt/prompt-health.ts`; live red/amber/emerald badge beside char count in `StrategyInputsCard` (length + strategy-detail heuristics); `title`/`aria-label` hints; does not block generate ✅
- **`15-theme-toggle.md`** — `next-themes` + `ModeToggle`; diagonal TL→BR wipe (`lib/theme/theme-transition.ts`); phased `.pf-*` shell utilities; `clerkAppearanceDark`/`Light` + `useClerkAppearance`; toggle on landing, generate, auth ✅
- `31-backtesting-summary-schemas.md` — `backtestSummaryRequestSchema`, `backtestSummarySectionsSchema`, `backtestSummaryResultSchema`, and shared types (`BacktestSummaryRequest`, `BacktestSummarySections`, `BacktestSummaryResult`) in `lib/api/validation.ts`; optional request fields match existing generator shapes (`balance` string regex, capitalized `direction`, market/timeframe/indicator enums); strict section length constraints (`recommendedTimeframes` 2–6, `recommendedMarkets` 2–6, `equityCurveChecks`/`failureModes`/`testPlan` 3–8); no DB changes ✅
- `32-backtesting-summary-prompt-utility.md` — `BACKTEST_SUMMARY_SYSTEM` + `buildBacktestSummaryUserPrompt()` in `lib/ai/prompts/backtest-summary.ts` (structure-only research checklist, no performance metrics, no markdown emitted by LLM); deterministic `assembleBacktestSummaryMarkdown(sections)` in `lib/ai/backtest-summary-markdown.ts` (stable heading order, bullet list per section, whitespace collapsed); `backtestSummaryLlmResultSchema` (loose intake: `title` + `sections` only) added to `lib/api/validation.ts` so route can build `markdown` server-side then re-validate with strict schema ✅
- **Landing page redesign (visual + conversion)** — Slice 1: `LANDING_CTA_SUBTEXT` + tier constants in `lib/config/constants.ts`; `LandingProofBar`; footer 3-column nav; CTA copy fix; navbar scroll `progressbar` a11y; hero `#examples` anchor. Slice 2: `LandingFeatureStat`, `LandingExamples` (tabbed), `LandingPricingTeaser`, `LandingFAQ` (`details`); replaced `LandingCodePreview` on page. Slice 3: `LandingTicker` (`TerminalPriceTicker` `variant="landing"`); `LandingHeroTerminal` typewriter demo; staggered `LandingHero`; terminal-session `LandingHowItWorks`; `terminal-grid-bg` on `LandingBackground`; light-mode `.pf-terminal-window` emerald rim; hero CSS in `globals.css` ✅
- `33-backtesting-summary-backend-route.md` — `POST /api/backtesting-summary` at `app/api/backtesting-summary/route.ts`: `protectAiRoute` → `backtestSummaryRequestSchema.safeParse` → `resolveModelForPlan` → `responseIfMissingXaiApiKey` → `generateObject` against loose `backtestSummaryLlmResultSchema` (system: `BACKTEST_SUMMARY_SYSTEM`, prompt: `buildBacktestSummaryUserPrompt`, `temperature: 0.2`, `maxOutputTokens: BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS`, `abortSignal: guard.ctx.req.signal`) → `assembleBacktestSummaryMarkdown(object.sections)` → strict `backtestSummaryResultSchema.safeParse` → sanitized `{ success, data, error }`; `BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS = 1200` added to `lib/config/constants.ts`; dev-only `console.warn` on strict-validate / generate failures; `npm run build` passes (route registered as `ƒ /api/backtesting-summary`) ✅
- `34-backtesting-summary-state-hook.md` — `hooks/useBacktestSummary.ts`: `useBacktestSummary(resetKey)` returns `{ phase, result, errorMessage, run, isLoading }` matching `useHealthScore` / `useAlertTemplates` exactly; `phase: 'empty' | 'loading' | 'success' | 'error'`; `BacktestSummaryRunInput` accepts `{ prompt, script, model, balance, structuredInputs }`; `run()` POSTs to `/api/backtesting-summary` with trimmed prompt/script, balance fallback to `null`, and structured-input fields; sanitized error fallbacks for 403 (Pro plan) / 429 (rate limit) / generic via `messageFromApiErrorJson`; `inFlightRef` blocks concurrent runs; resetKey effect clears phase/result/error on generate, refine, history load ✅
- `35-backtesting-summary-ui.md` — `Backtest` output tab on `/generate` between Health and Alerts (only when a script exists). `BacktestSummaryPanel` renders structured sections (not the raw `markdown` blob): title heading + 5 bulleted sections with semantic icons — `Clock` Recommended Timeframes, `TrendingUp` Recommended Markets, `LineChart` What To Check In The Equity Curve, `AlertTriangle` Common Failure Modes (amber tint), `ListChecks` Backtesting Plan. Empty state shows a `FlaskConical` glyph + concise copy + `Generate Backtesting Summary` primary action; loading state shows spinner + status copy with `role="status" aria-live="polite" aria-busy="true"`; error state shows sanitized message + Retry, `role="alert"`; success ends with a Run-again button. `backtestSummaryResetKey` added in `StrategyForm` and bumped alongside `healthScoreResetKey` / `alertTemplatesResetKey` on generate / refine / history-load so stale summaries clear when the active script changes. `OutputTab` union, `onValueChange` discriminator, and `TerminalOutputChrome` `TAB_PATH` updated (`output://backtest.md`); off-tab bounce effect mirrors Health/Alerts. No command-palette additions (spec § Scope Limits). `npm run build` passes ✅

## In Progress

- _(none — Strategy Backtesting Summary feature complete)_

## Next Up

- Optional: `15-theme-toggle.md` follow-ups (generator cards light polish)
- Optional: weighted quotas + audit logs (`context/fixes.md` Fix 3, 7)
- Remaining Phase 5 medium-value features (Pinned Scripts, Tags + Search,
  Collections, Notion/Obsidian export)

## Open Questions

- Landing footer links `/pricing`, `/privacy`, `/terms` — routes not implemented yet (stubs)

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
  `StrategyForm` for Ctrl/Cmd+K (toggle), Ctrl/Cmd+Enter (generate when palette
  closed), and Ctrl/Cmd+T (open in TradingView when not typing and output idle).
  Uses `cmdk` via shadcn `CommandDialog`.
- **Compare / lineage**: `lineageRef` + React `lineageState` stay in sync on generate,
  refine, and history load; cleared when a new generate starts so Compare does not
  use stale roots mid-stream.
- **TradingView Copy & Open**: `copyAndOpenTradingView(script)` in
  `lib/scripts/tradingview.ts` copies the script to clipboard and opens
  `https://www.tradingview.com/pine-editor/` in a new tab simultaneously.
  User arrives at Pine Editor with script ready to paste (Ctrl+V).
  Sonner toast confirms "Script copied — paste it in Pine Editor".
  TradingView's deep link URL format (`pine-editor/?script=`) is undocumented
  and returned 404 — this approach is reliable and requires no URL encoding.
  Client-only utility. Button in `StrategyOutputCard`, Ctrl/Cmd+T shortcut
  in `StrategyForm`, and palette action in `GeneratorCommandMenu`.
- **Strategy Health Score**: Manual analysis only (no auto-run, no DB).
  `POST /api/health-score` returns `{ success, data, error }` with Zod-validated
  `score` (1–10), `verdict`, `summary`, `strengths`, `risks`, `nextSteps`.
  Prompt in `lib/ai/prompts/health-score.ts` frames structural quality, not
  profitability. UI: `Health` tab when a script exists (`HealthScorePanel` +
  `useHealthScore`); `healthScoreResetKey` bumps with `explainCancelKey` on
  generate, refine, and history load.
- **Alert Message Templates**: Template generation only (no webhooks sent, no
  credentials stored, no DB). `POST /api/alert-templates` returns four provider
  templates (`3commas`, `alertatron`, `wundertrading`, `custom`) with Zod +
  `JSON.parse` on each `messageJson`. UI: `Alerts` tab (`AlertTemplatesPanel` +
  `useAlertTemplates`); `alertTemplatesResetKey` clears on generate, refine, and
  history load.
- **Backtesting Summary**: Research-checklist generation only (no live backtests,
  no performance numbers, no DB). `POST /api/backtesting-summary` runs
  `generateObject` against a **loose** intake schema (`title` + `sections` only),
  then `assembleBacktestSummaryMarkdown(sections)` builds the `markdown` field
  deterministically server-side, then the full payload is re-validated with the
  **strict** `backtestSummaryResultSchema` before responding. The LLM never emits
  Markdown — heading order, bullet formatting, and whitespace normalization are
  all controlled by the helper, so the `markdown` field can be trusted by the
  client. Prompt (`BACKTEST_SUMMARY_SYSTEM`) explicitly forbids fabricated
  performance metrics (win rate, CAGR, Sharpe, drawdown, profit factor) and
  certainty language; tone stays advisory and qualitative. UI: `Backtest` tab
  (`BacktestSummaryPanel` + `useBacktestSummary`) renders sections structurally
  (not the raw `markdown` blob) so the `markdown` field stays available for
  future copy/download without dictating the default reading experience;
  `backtestSummaryResetKey` clears state on generate, refine, history load.

## Session Notes

- UI/UX `01-shortcut-tooltips`: tooltips on generator actions; `formatShortcut` /
  `getModKeyLabel` shared with command palette footer shortcuts
- UI/UX `02-output-action-bar`: icon-first `OutputActionBar`; shared `handleOpenInTradingView`
  from `StrategyForm` (palette, shortcut, action bar)
- UI/UX `03-script-output-empty-state`: terminal idle copy + starter chips in `ScriptOutput`;
  `handleSuggestionClick` in `StrategyForm` fills strategy field and focuses textarea
- UI/UX `04-health-next-step-refine`: Health next-step **Refine** → `handlePrefillRefine` +
  `prefillNonce` on `RefineChat`; smooth scroll to refine section, user submits manually
- UI/UX `05-motion-feedback`: `motion-btn-press` / `motion-ready-generate` on inputs; output
  `animate-success-pulse` when generation completes (not refine); reduced-motion overrides
- UI/UX `06-sticky-output-tabs`: sticky tab bar + icons in `StrategyOutputCard`; panel scroll
  keeps tabs pinned; mobile horizontal tab scroll
- UI/UX `08-terminal-polish`: `terminal-noise` / `terminal-scanlines` / `terminal-phosphor-*`
  / `terminal-code-surface` in `globals.css`; auth + generate backgrounds; output code surface +
  active tab/model/pill/webhook phosphor glow
- UI/UX `09-prompt-health-badge`: `lib/prompt/prompt-health.ts` heuristics (length + detail categories);
  live badge next to char count in `StrategyInputsCard`; hover/title + `aria-label` hints; no API or generate blocking
- `15-theme-toggle`: `ThemeProvider`, `ModeToggle`, diagonal wipe overlay, `.pf-page`/`.pf-nav` shells, Clerk light appearance; generator cards deferred for light polish
- UI/UX `11-terminal-identity-phase-2`: `TerminalAmbientBackground`, `TerminalOutputChrome`,
  `terminal-active-*` tokens, streaming surface pulse, mono tab labels, blinking `$` prompt;
  emerald-only generate ambient; `npm run build` passes
- UI/UX `12-generate-desk-atmosphere`: generate desk ticker (`variant="generate"`), slower scroll
  + dimmer per-quote text (`text-zinc-600` symbols, muted deltas), `terminal-glow-breathe` on
  generate ambient top glow; auth keeps HUD + default ticker
- Alert Message Templates (`28`–`30`): backend `POST /api/alert-templates`, UI `Alerts` tab +
  `AlertTemplatesPanel` / `useAlertTemplates`, palette entry; `alertTemplatesResetKey` clears on
  generate, refine, and history load; `npm run build` passes
- Backtesting Summary schemas (`31`): contracts only — `lib/api/validation.ts` gets request +
  strict response (`title`, `markdown`, 5 section arrays with explicit length bounds) + shared
  types (`BacktestSummaryRequest`, `BacktestSummarySections`, `BacktestSummaryResult`); request
  shape mirrors existing AI routes (`balance` regex, capitalized `direction`, `market`/
  `timeframe`/`indicators` enums) so the upcoming route, prompt utility, and hook can import
  one source of truth; `npx tsc --noEmit` clean
- Backtesting Summary prompt utility (`32`): `lib/ai/prompts/backtest-summary.ts` exports
  `BACKTEST_SUMMARY_SYSTEM` (structure-only research checklist; explicit ban on win rate,
  CAGR, Sharpe, drawdown, profit factor — any numeric performance metric) and
  `buildBacktestSummaryUserPrompt()` (intent + Pine + strategy-context block, same shape as
  health-score / alert-templates user prompt builders). LLM emits only `title` + `sections`;
  Markdown is assembled server-side by `assembleBacktestSummaryMarkdown(sections)` in
  `lib/ai/backtest-summary-markdown.ts` (stable heading order: Recommended Timeframes →
  Recommended Markets → What To Check In The Equity Curve → Common Failure Modes →
  Backtesting Plan; one bullet per item; deterministic and pure). Loose intake schema
  `backtestSummaryLlmResultSchema` added to `lib/api/validation.ts` so step 33 can run
  `generateObject` against the loose schema, assemble `markdown`, then re-validate against
  the strict `backtestSummaryResultSchema` before returning to the client
- Backtesting Summary route (`33`): `app/api/backtesting-summary/route.ts` POST-only handler
  mirrors `health-score` / `alert-templates` flow exactly — `protectAiRoute` (auth + rate
  limit + plan), Zod-validate body with `backtestSummaryRequestSchema`, `resolveModelForPlan`
  for entitlement (403 on premium model for free plan), `responseIfMissingXaiApiKey` for the
  503 env-config error path, then `generateObject` against the loose
  `backtestSummaryLlmResultSchema` with `BACKTEST_SUMMARY_SYSTEM` + builder output,
  `temperature 0.2`, `maxOutputTokens` from new `BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS = 1200`
  constant, and `abortSignal: guard.ctx.req.signal`. Result is passed through
  `assembleBacktestSummaryMarkdown(object.sections)` and re-validated with the strict
  `backtestSummaryResultSchema` before responding — fulfils the ⚠️ "do not return
  unvalidated Markdown" requirement from the spec. Errors return sanitized `{ success: false,
  data: null, error }` envelopes (400 invalid request, 403 entitlement, 429 rate limit, 502
  strict-validate failure, 500 generic). Dev-only `console.warn` for strict-validate /
  generate failures (production silent). No DB writes. `npm run build` shows route as
  `ƒ /api/backtesting-summary`; `/api(.*)` is public in `proxy.ts` so the route returns its
  own JSON 401 instead of being redirected to sign-in
- Backtesting Summary hook (`34`): `hooks/useBacktestSummary.ts` exposes
  `useBacktestSummary(resetKey)` with the same return shape as `useHealthScore` /
  `useAlertTemplates` (`{ phase, result, errorMessage, run, isLoading }`) so step 35 can
  plug it into the output panel with no API drift. `run({ prompt, script, model, balance,
  structuredInputs })` trims prompt + script, no-ops on missing inputs or in-flight
  request (`inFlightRef`), POSTs to `/api/backtesting-summary` with `balance` falling back
  to `null` and structured-input fields mapped 1:1 to the route schema. Error fallbacks via
  `messageFromApiErrorJson`: 403 → "Premium models require a Pro plan.", 429 → "Too many
  requests. Please try again in a moment.", anything else → "Backtesting summary request
  failed. Please try again." Network failure path returns "Something went wrong. Please try
  again." Stale results clear via `resetKey` effect — step 35 will bump
  `backtestSummaryResetKey` alongside `healthScoreResetKey` / `alertTemplatesResetKey` on
  generate, refine, and history load. File name uses `useBacktestSummary` (no "ing") to
  match the schema type `BacktestSummaryResult` and the prompt/markdown utilities; the
  spec's "suggested" `useBacktestingSummary` was a sketch, not a contract. Route URL stays
  `/api/backtesting-summary` per step 33's public contract
- Backtesting Summary UI (`35`): new `Backtest` output tab between Health and Alerts on
  `/generate`. `components/strategy/BacktestSummaryPanel.tsx` renders the validated
  structured sections (per spec: structured rendering first, raw `markdown` reserved for
  future copy/download) — title heading, then 5 `BulletSection` blocks with semantic
  icons (`Clock`, `TrendingUp`, `LineChart`, `AlertTriangle` with amber bullet tint,
  `ListChecks`). Empty state uses `FlaskConical` glyph + `terminalRunButton`; loading uses
  `Loader2` spinner with `role="status" aria-live="polite" aria-busy="true"`; error state
  uses `role="alert"` with sanitized message + Retry; success ends with Run-again button.
  `StrategyOutputCard`: `OutputTab` union extended with `'backtest'`, `onValueChange`
  discriminator updated, tab trigger only renders when `generatedScript.trim()` (same gate
  as Health/Alerts). `StrategyForm`: `backtestSummaryResetKey` state added, bumped in
  `handleGenerate` / `handleRefine` / `loadSavedScript` alongside the other reset keys;
  off-tab bounce effect mirrors Health/Alerts (sends user back to Script if Backtest is
  active when script disappears). `TerminalOutputChrome` `TAB_PATH` extended with
  `output://backtest.md`. Tab placement (between Health and Alerts) groups review/eval
  tabs (Health = score, Backtest = test plan) before automation (Alerts) and the
  diff (Compare). Per spec § Scope Limits: no command-palette additions,
  no inline editing, no export feature in this step. `npm run build` passes
- Strategy Health Score (`25`–`27`): backend `POST /api/health-score`, UI `Health` tab +
  `HealthScorePanel` / `useHealthScore`, palette entry; `healthScoreResetKey` clears results on
  generate, refine, and history load; `npm run build` passes
- Clerk: custom auth pages, protected non-public routes, CSP tuned for Clerk Frontend API host
- Neon/Drizzle: per-user script history wired; migrations `0000` + `0001` applied
- Upstash: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `.env.local` / Vercel
- Audit report (report.md): SEC-001 closed; remaining items in `context/fixes.md`
- Fix 2 UI: client model locks + `UserPlanContext`; deferred polish: quota hint, `/pricing` on all 429 toasts
- A11Y-001: ModelSelector radiogroup semantics done; optional follow-up: `aria-disabled` + focus when locked
- A11Y-002: resolved — `LandingExamples` Copy control is a `<button>` with `aria-label`
- NEXT-001: Root `app/error.tsx` and `app/loading.tsx` present (tracker was stale)
