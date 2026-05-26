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
**Terminal error & 404 surfaces:** [`app/not-found.tsx`](../app/not-found.tsx) (`SIGNAL LOST` / 404),
[`app/error.tsx`](../app/error.tsx) (`SYSTEM HALT`, rose accent, `FAULT_ID` digest),
[`app/global-error.tsx`](../app/global-error.tsx) (self-contained `<html>`/`<body>` for root-layout faults),
[`app/generate/not-found.tsx`](../app/generate/not-found.tsx) and [`app/generate/error.tsx`](../app/generate/error.tsx)
(in-context `GeneratorFaultPanel`). Shared chrome in [`components/error/TerminalErrorScreen.tsx`](../components/error/TerminalErrorScreen.tsx)
(terminal grid, nav, candle/glitch motifs). Removed orphan [`components/landing/error.tsx`](../components/landing/error.tsx).

**Current Security State**
Zod validation and sanitized errors are in place on all API routes. CSP header
in `next.config.ts`. **SEC-001 resolved:** Upstash Redis rate limiting on all AI
routes (per-IP + per-user tier limits). Server model entitlement, stream concurrency,
and `protectAiRoute()` are live (`context/fixes.md` Fix 2, 4, 6). Remaining hardening:
weighted quotas and audit logs (Fix 3, 7 — deferred).

**Client model entitlement UX (Fix 2 UI):**
Free users see all models in `ModelSelector`; Balanced and Maximum Quality show a lock,
are dimmed, and show a Sonner toast on click (no selection change). Plan is fetched
server-side on `/generate` and provided via [`lib/providers/UserPlanContext.tsx`](../lib/providers/UserPlanContext.tsx)
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

Phase 5 complete (Export 48–50 shipped). Phase 6 — Forge Agent —
**complete**; all eight specs (`51`–`58`) shipped: Memory Schema,
Tool Contracts, Conversation CRUD routes, Streaming Endpoint, Memory
Extraction, `/forge` UI, and Guardrails.

**Phase 7 — Depth & Polish — planned** (`59`–`68`): Strategy Templates
Library, Strategy Assumptions Block, Research→Generate Pipeline, Strategy
DNA Fingerprint, Strategy Comparison Reports, Strategy Variants, Quality
Progression Tracker, Strategy Snapshot Export, Contextual Tips in Forge,
Keyboard Power User Mode.

## Current Goal

Phase 6 Forge Agent (`51`–`58`) is complete. Done: `52` (memory
schema + Drizzle migration `0003` applied to Neon), `53` (tool contract
scaffolding in `lib/agent/tools/`), `54` (conversation CRUD routes +
DB helpers + ownership resolver), `55` (`POST /api/forge` streaming
endpoint + system prompt + tool runners + persistence), `56` (memory
extraction — `lib/agent/memory-extraction.ts` + the agent-memory
upsert / debounce / script-count helpers + the `onFinish` hook in
`/api/forge`), `57` (`/forge` page UI — `ForgeExperience` orchestrator,
sidebar + chat + message list + tool-call cards + input + empty state;
`useForgeConversations` hook; `agentMessagesToUIMessages` adapter for
`useChat`; navbar Forge link + "Discuss with Forge" entry point on
`/generate`), `58` (canonical `lib/agent/guardrails.ts` module —
`FORGE_GUARDRAILS` block with refusal patterns, language constraints,
tool-usage rules, and prompt-transparency rules; replaces the inline
MVP block in `system-prompt.ts`; refine-script runner hardened with
empty-output check to complete spec § Tool Result Validation).

Next slice: Phase 7 starting with spec `59` (Strategy Templates Library)
— the highest-priority item. Optional Phase 4 hardening
(`context/fixes.md` Fix 3 / Fix 7 — weighted quotas, audit logs)
can run in parallel as a background track.

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
- `lib/providers/UserPlanContext.tsx` — `UserPlanProvider` + `useUserPlan()` for `/generate` subtree
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
- Pinned / Starred Scripts — complete (`36`–`39`)
- Strategy Tags + Search — complete (`40`–`43`)
- Strategy Collections / Folders — complete (`44`–`47`)
- Export to Notion / Obsidian — in progress (`48`–`50`)

## Phase 6 — Forge Agent (In Progress)

AI strategy workflow agent on `/forge` with tool calling, persistent memory,
and orchestration over existing PineForge features. Specs:

- `51` — Forge Agent overview (product spec, identity, scope, examples)
- `52` — Memory schema (Drizzle tables + migration: `agent_conversations`, `agent_memory`) ✅
- `53` — Tool definitions (Zod schemas, descriptions, endpoint mappings) ✅
- `54` — Conversation CRUD routes (save/load/list/delete REST) ✅
- `55` — Agent streaming endpoint (`POST /api/forge` — system prompt, `streamText`, tool calling) ✅
- `56` — Memory extraction (background preference extraction from conversations) ✅
- `57` — `/forge` page UI (chat interface, tool call display, conversation sidebar) ✅
- `58` — Guardrails (refusal patterns, prompt injection defense, output validation) ✅

## Phase 7 — Depth & Polish (Planned)

Feature specs live in `context/features/59`–`68`. Prioritised order:

| Spec | Title | Status |
|------|-------|--------|
| `59` | Strategy Templates Library | **Complete** (shipped 21 curated Pine v5 templates with pre-computed Health/Backtest/Alerts; full `/templates` + detail pages; generator `?templateId` preload + server entitlement enforcement on generate) |
| `60` | Strategy Assumptions Block | Planned |
| `61` | Research → Generate Pipeline | Planned |
| `62` | Strategy DNA Fingerprint | Planned |
| `63` | Strategy Comparison Reports | Planned |
| `64` | Strategy Variants Quick-Generate | Planned |
| `65` | Quality Progression Tracker | Planned |
| `66` | Strategy Snapshot Export | Planned |
| `67` | Contextual Tips in Forge | Planned |
| `68` | Keyboard Power User Mode | Planned |

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
- `36-starred-scripts-data-contract.md` — confirmed `scripts.is_starred` (Drizzle column shipped in `0000_mute_rattler.sql`) is the canonical persisted field; no migration required. Added required `isStarred: boolean` to `SavedScript` (`lib/types/index.ts`); `rowToSavedScript()` now maps `row.isStarred ?? false`; `savedScriptSchema` in `hooks/useScriptHistory.ts` adds `isStarred: z.boolean().default(false)` so legacy localStorage entries parse cleanly; `buildSavedScriptFromGeneration` / `buildSavedScriptFromRefinement` set `isStarred: false`. Contract is read-only at this step — mutation route lives in spec `37` (`PATCH /api/scripts/[scriptId]/star`), history query behaviour lives in spec `38`, UI lives in spec `39`. Documented in `context/architecture.md` § Data Contracts. `npm run build` passes ✅
- `37-starred-scripts-mutation-route.md` — `PATCH /api/scripts/[scriptId]/star` at `app/api/scripts/[scriptId]/star/route.ts`: `requireClerkSession` → `starScriptSchema` (`{ isStarred: boolean }`) → ownership check on `scripts.user_id` → update `is_starred` + `updated_at` → `{ script: rowToSavedScript(updated) }` with persisted `isStarred`. Invalid id → 400; missing user → 404; non-owner → 403; sanitized JSON errors only. No UI, search, or collections/tags in this route. `npm run build` passes ✅
- `38-starred-scripts-history-query.md` — `GET /api/scripts` now uses `listScriptsForUser()` (`lib/db/list-user-scripts.ts`): recent 50 by `created_at` desc merged with any older starred rows, deduped and re-sorted by recency (no forced starred-first sort). `rowToSavedScript()` continues to expose `isStarred` on every item; `useScriptHistory` validates via `savedScriptSchema` and signed-in `addEntry` uses `capScriptHistory()` so starred entries are never trimmed from the in-memory API cache. `partitionScriptsByStarred()` added in `lib/scripts/history-list.ts` for spec `39` UI. No UI changes in this step. `npm run build` passes ✅
- `39-starred-scripts-ui.md` — `ScriptHistory`: icon star toggle per entry (`Star` with `fill-current` + `aria-pressed` when pinned); amber border/background on pinned rows; compact **Pinned** section via `partitionScriptsByStarred()` when any starred exist; sheet copy reflects account vs device storage. `useScriptHistory.toggleStarEntry()` — signed-in `PATCH /api/scripts/[id]/star` with optimistic cache update via `capScriptHistory()`; signed-out toggles `isStarred` in localStorage. Rename/delete/load unchanged; no full-page reload. `npm run build` passes ✅
- `40-tags-data-contract.md` — confirmed `scripts.tags` (jsonb `string[]`, default `[]`, shipped in `0000_mute_rattler.sql`) is the canonical persisted field; no migration required. Added required `tags: string[]` to `SavedScript` (`lib/types/index.ts`); `rowToSavedScript()` now maps `row.tags ?? []`; `savedScriptSchema` in `hooks/useScriptHistory.ts` adds `tags: z.array(z.string()).default([])` so legacy localStorage entries parse cleanly; `buildSavedScriptFromGeneration` / `buildSavedScriptFromRefinement` set `tags: []`. New `lib/scripts/tags.ts` is the single source of truth for the contract — exports `MAX_TAGS_PER_SCRIPT = 10`, `MAX_TAG_LENGTH = 24`, `normalizeTag()`, pure `normalizeTags()` (trim → lower-case → drop empty → drop > 24-char → de-dupe → clamp to 10), and `tagsInputSchema` (Zod array-boundary check). Contract is read-only at this step — mutation route lives in spec `41` (`PATCH /api/scripts/[scriptId]/tags`), search route in `42`, chip-editor UI in `43`. Documented in `context/architecture.md` § Data Contracts. `npm run build` passes ✅
- `41-tags-mutation-route.md` — `PATCH /api/scripts/[scriptId]/tags` at `app/api/scripts/[scriptId]/tags/route.ts`: `requireClerkSession` → `parseScriptId` → `getDbUserIdByClerk` → Zod-validate body with `setScriptTagsSchema` (`{ tags: tagsInputSchema }`) → ownership check on `scripts.user_id` → `normalizeTags(parsed.data.tags)` (server-side; never trust raw input) → update `scripts.tags` + bump `updated_at` → `{ script: rowToSavedScript(updated) }` with the final normalized list. Invalid id → 400; invalid body → 400 with Zod issues; missing user → 404; non-owner → 403; sanitized JSON errors only. Empty arrays are valid and clear all tags. `setScriptTagsSchema` added to `lib/api/validation.ts` alongside `starScriptSchema` for symmetry. No UI, no search, no collection changes in this route. `npm run build` passes (route registered as `ƒ /api/scripts/[scriptId]/tags`) ✅
- `42-history-search-route.md` — `GET /api/scripts/search` at `app/api/scripts/search/route.ts`: dedicated read endpoint (`GET /api/scripts` keeps its plain recency+starred-union behavior). Query params validated by `searchScriptsQuerySchema` in `lib/api/validation.ts` — `q` (≤ 200 chars, trimmed), `tag` (repeated **or** comma-separated; route splits on `,` then runs the combined list through `normalizeTags()`), `starred` (`'true' \| 'false'`), `collectionId` (positive int). DB helper `searchScriptsForUser()` in `lib/db/search-user-scripts.ts` always ANDs `eq(scripts.userId, userId)` first; text match uses Drizzle's `ilike()` on `scripts.title` `OR` parameterized `metadata->>'prompt' ILIKE`; tag match uses jsonb `@>` containment (all requested tags must be present); `starred` and `collectionId` use `eq()`; `q` is escaped against LIKE wildcards (`%`, `_`, `\\`) before binding so user-typed wildcards don't expand the match. Results sort by `created_at` desc, capped at `MAX_HISTORY_ENTRIES`. Response `{ scripts: SavedScript[] }` matches `GET /api/scripts`. Signed-out → 401; invalid query → 400 with Zod issues; missing user → `{ scripts: [] }`. No UI, no mutation, no ranking engine. `npm run build` passes (route registered as `ƒ /api/scripts/search`) ✅
- `43-tags-search-ui.md` — `ScriptHistory` gains a search input + active-tag filter chips + per-entry tag chips + inline tag editor + no-results state. Client-side filtering via new pure helper `filterHistoryEntries()` / `isHistoryFilterActive()` in `lib/scripts/history-filter.ts` mirrors the server semantics from spec 42 (case-insensitive substring on `name`+`prompt`, AND-containment on tags) so the in-memory cache filters predictably; the dedicated server route (`GET /api/scripts/search`) stays available for future cross-session lookups beyond the cached window. `useScriptHistory.setTagsEntry(id, tags)` — signed-in `PATCH /api/scripts/[id]/tags` with `normalizeTags()` applied client-side before the request (server re-normalizes); optimistic cache update via `capScriptHistory()` after success; signed-out path writes normalized tags to localStorage. Per-entry tag chips are buttons that toggle membership in `activeTagFilters`; active filters render as removable chips above the list with a Clear control. Inline tag editor opens via a new `Tag` action button — comma-separated input, Enter/Save commits, Escape/Cancel reverts. `aria-pressed` / `aria-expanded` / `aria-label` set on every interactive control; chip color uses emerald accent for active filters, amber kept for the existing Pinned section. Rename/delete/star/load flows unchanged; sheet copy + Pinned/unpinned partition reuse the existing `partitionScriptsByStarred()` helper, now applied to the **filtered** list so filters narrow both groups. `npm run build` passes ✅
- `44-collections-data-contract.md` — confirmed the existing `collections` table (`id`, `user_id → users.id`, `name varchar(100)`, `created_at`) and the `scripts.collection_id` foreign key (`integer references collections(id)`, nullable) are the canonical persisted shape; both ship in `0000_mute_rattler.sql`, so no migration is required. Added required `collectionId: number | null` to `SavedScript` (`lib/types/index.ts`); `rowToSavedScript()` now maps `row.collectionId ?? null`; `savedScriptSchema` in `hooks/useScriptHistory.ts` adds `collectionId: z.number().int().nullable().default(null)` so legacy localStorage entries parse cleanly; `buildSavedScriptFromGeneration` / `buildSavedScriptFromRefinement` set `collectionId: null`. New `SavedCollection` type (`{ id, name, createdAt }`) added in `lib/types/index.ts` as the shared shape for spec `45`'s CRUD response and spec `47`'s picker. New `rowToSavedCollection()` mapper in `lib/db/collection-mapper.ts` (re-exported from `lib/db/index.ts`) keeps collection responses shape-consistent across upcoming routes. New `lib/collections/collections.ts` is the single source of truth for the contract — exports `MAX_COLLECTION_NAME_LENGTH = 100` (matches the `varchar(100)` column), `MIN_COLLECTION_NAME_LENGTH = 1`, pure `normalizeCollectionName()` (trim → length-check; returns `null` on empty / oversize), case-insensitive `isSameCollectionName()` for app-layer duplicate prevention (no DB unique index yet), and `collectionNameInputSchema` (Zod boundary). Contract is read-only at this step — CRUD route lives in spec `45`, assignment route in spec `46`, UI in spec `47`. Documented in `context/architecture.md` § Data Contracts. `npm run build` passes ✅
- `45-collections-crud-route.md` — `GET / POST /api/collections` at `app/api/collections/route.ts` and `PATCH / DELETE /api/collections/[collectionId]` at `app/api/collections/[collectionId]/route.ts`. Pattern mirrors the spec 37 / spec 41 narrow-route style: `requireClerkSession` → parse id (PATCH/DELETE) → `getDbUserIdByClerk` (or `ensureDbUserForClerkId` on POST so first-call after sign-in auto-provisions the user row) → Zod-validate body with `createCollectionSchema` / `renameCollectionSchema` (both `{ name: collectionNameInputSchema }` from spec 44) → `normalizeCollectionName(parsed.data.name)` → app-layer duplicate guard via new `findUserCollectionByNameInsensitive(userId, name, excludeId?)` in `lib/db/list-user-collections.ts` (runs `lower(${collections.name}) = lower(${name})` scoped to `userId`; `excludeId` lets PATCH rename to its own casing variant without conflicting with itself) → ownership pre-check (PATCH/DELETE) → write → `{ collection }` or `{ ok: true }`. GET returns `{ collections: SavedCollection[] }` ordered by `createdAt` desc via new `listCollectionsForUser()`; signed-in but no DB user → `{ collections: [] }` matching the `/api/scripts` soft-empty pattern. Status codes are predictable per the spec: 401 unauth, 400 invalid id / Zod issues, 403 non-owner, 404 missing DB user (PATCH/DELETE only), 409 duplicate name with sanitized copy `"A collection with this name already exists."`, 500 write returned nothing. DELETE handles the existing `ON DELETE no action` FK on `scripts.collection_id` by **unassigning referencing scripts first** (`UPDATE scripts SET collection_id = NULL, updated_at = NOW() WHERE user_id = ? AND collection_id = ? AND collection_id IS NOT NULL`), then deleting the collection — both writes scoped to the caller's `userId` so cross-user side effects are structurally impossible. neon-http does not expose transactions, so partial-failure recovery is idempotent retry. New helpers re-exported from `lib/db/index.ts`. No script-assignment mutation, no UI, no picker in this step (specs 46 / 47). Documented in `context/architecture.md` § Data Contracts → "Collections CRUD route". `npm run build` passes (routes register as `ƒ /api/collections` + `ƒ /api/collections/[collectionId]`) ✅
- `46-script-collection-assignment-route.md` — `PATCH /api/scripts/[scriptId]/collection` at `app/api/scripts/[scriptId]/collection/route.ts`: mirrors the spec 37 star / spec 41 tags narrow-route pattern — `requireClerkSession` → `parseScriptId` → `getDbUserIdByClerk` → Zod-validate body with new `setScriptCollectionSchema` (`{ collectionId: z.number().int().positive().nullable() }` in `lib/api/validation.ts`) → ownership pre-check on `scripts.user_id` → when `collectionId` is non-null, a second pre-check on `collections.user_id` (same `userId`) so cross-user assignment is structurally impossible (missing or foreign collection → 403, no existence leak) → `update().set({ collectionId, updatedAt })` with both `scripts.id` and `scripts.user_id` in the WHERE clause → `{ script: rowToSavedScript(updated) }` with the persisted `collectionId`. `null` clears the assignment. Status codes: 401 unauth, 400 invalid script id / Zod issues, 404 missing DB user, 403 non-owner script or non-owned target collection, 500 update returned nothing. No tag, star, or collection CRUD side effects. Documented in `context/architecture.md` § Data Contracts → "Script collection assignment route". `npm run build` passes (route registers as `ƒ /api/scripts/[scriptId]/collection`) ✅

- `47-collections-ui.md` — `ScriptHistory` gains collection filter chips (All / per-collection / None), compact `CollectionControls` for create/rename/delete via `useCollections()` (`GET|POST /api/collections`, `PATCH|DELETE /api/collections/[id]`), and per-entry `<select>` picker calling `useScriptHistory.setCollectionEntry()` → `PATCH /api/scripts/[id]/collection` with optimistic cache update via `capScriptHistory()`. Client filter extended in `lib/scripts/history-filter.ts` (`collectionId: number | 'uncategorized'`). After collection delete, `refreshEntries()` syncs unassigned scripts in cache. Signed-out users see sheet copy pointing to sign-in; collection UI hidden (`collectionsApi` gate). Sky accent for collection chips/badges; mobile-friendly native select. `npm run build` passes ✅
- `48-export-breakdown-source-contract.md` — single source of truth for what feeds the Notion / Obsidian export lives in `lib/export/source.ts`. Exports `StrategyExportSource` type (title, prompt, script, model `{ id, label }`, `structuredInputs` with `market`/`timeframe`/`direction`/`indicators`/`rr`/`balance`, `breakdown`, `createdAt`, `updatedAt`), helper types `StrategyExportSourceModel` + `StrategyExportStructuredInputs`, the `DEFAULT_EXPORT_TITLE` fallback, and two pure builders: `buildStrategyExportSource(input)` for the active generator path and `buildExportSourceFromSavedScript(saved, { breakdown? })` for the history path. Builders are deterministic and synchronous — no AI calls, no DB writes, no DOM access — so they are safe on either client or server, and same input always yields the same payload (per spec § Rules). Title falls back to `DEFAULT_EXPORT_TITLE` ("Untitled strategy") on empty input; `prompt` and `breakdown` are trimmed; `model` is resolved against `GROK_MODELS` so the serializer (spec 49) does not have to re-resolve constants; `structuredInputs` filters out empty strings, empty arrays, and `undefined` so spec 49 can use simple truthy checks; `script` is preserved verbatim (no whitespace normalization here — spec 49 owns fenced-code formatting); `breakdown` is `null` when the user has not loaded the Breakdown tab yet; `updatedAt` is reserved as `null` for forward compatibility with `scripts.updated_at` (currently not surfaced by `SavedScript`). No Zod schema (no API boundary at this step — spec 50 may add validation if needed). Contract is read-only here — the markdown serializer lives in spec 49 (`lib/export/strategy-markdown.ts`) and the copy/download actions live in spec 50. Documented in `context/architecture.md` § Data Contracts → "Strategy Export Source". `npm run build` passes ✅
- `49-export-markdown-serializer.md` — `lib/export/strategy-markdown.ts` exports `assembleStrategyExportMarkdown(source, options?)` + `StrategyExportMarkdownOptions` + `exportHasMetadata(source)`. Consumes spec-48 `StrategyExportSource`; optional `options` carries already-loaded `healthScore`, `alertTemplates`, and `backtestSummary` (no new AI). Stable section order: `#` title → `## Strategy Metadata` (bullet list: model, market, timeframe, direction, R:R, balance, indicators, created/updated as UTC `YYYY-MM-DD`) → `## Original Prompt` (blockquote, line breaks preserved) → `## Breakdown` (only when non-null; body verbatim) → `## Pine Script` (fenced `pine` block; fence length auto-expands if script contains triple backticks) → optional `## Health Score` / `## Alert Templates` (per-provider `###` + fenced `json` for `messageJson`) / `## Backtesting Summary` (reuses spec-33 `markdown` field + optional `###` title). Deterministic: inline bullet whitespace collapsed, document `.trim()`'d, no Notion/Obsidian-specific variants. No UI, no download route, no Notion API. Documented in `context/architecture.md` § "Strategy Export Markdown Serializer". `npm run build` passes ✅
- `50-export-actions-ui.md` — `/generate` output workflow: `FileText` toggle in `OutputActionBar` opens `ExportMarkdownPanel` (Notion/Obsidian copy + **Copy Markdown** / **Download .md**). Client-only download via `lib/export/download-markdown.ts` (Blob + anchor, sanitized filename). Assembly via `lib/export/build-export-markdown.ts` → spec-48 source + spec-49 serializer. `StrategyOutputCard` collects breakdown (`ExplainScriptPanel.onBreakdownChange`), optional Health/Alerts/Backtest results (`onResultChange` on panels — no export-time AI). `StrategyForm` passes `exportTitle` + `exportCreatedAt` (set on save/load, cleared on new generate). Panel hints when Breakdown not loaded; resets on generate/refine/history load. No OAuth, no Notion API, no backend route. `npm run build` passes ✅
- `53-forge-agent-tools.md` — Phase 6 tool-contract scaffolding. Seven contract files in new `lib/agent/tools/` directory — one file per tool (`search-user-scripts.ts`, `get-script-details.ts`, `run-health-score.ts`, `run-backtest-summary.ts`, `generate-alert-templates.ts`, `refine-script.ts`, `search-strategy-knowledge.ts`) plus shared `types.ts` (`AgentToolContext`, `AgentToolExecutor`, `AgentToolContract`) and aggregating `index.ts` (re-exports every contract, exposes `FORGE_TOOL_NAMES`, `ForgeToolName`, `forgeToolContracts` registry keyed by tool name, and `isForgeToolName()` runtime guard). Each tool file exports the Zod input schema (from the spec verbatim), the LLM-facing description, a sanitized `<NAME>_ERROR` constant, TS `Input`/`Output` aliases, and a typed `<Name>Executor` alias so spec 55 can wire `tool({ description, inputSchema, execute })` without schema drift. `AgentToolContext` carries `userId` (DB integer), `clerkId`, `plan`, `model` (`GrokModelId`), and `signal` (`AbortSignal`) — none of these fields appear in any LLM-facing input schema per spec § Security Notes. Outputs reuse existing strict types where the tool wraps an existing endpoint (`HealthScoreResult`, `BacktestSummaryResult`, `AlertTemplatesResult`, `SavedScript`) so spec 57's UI renders tool results with the same panels the manual flow uses, no shape translation. `search_user_scripts` cap on `tags` is `floor(MAX_TAGS_PER_SCRIPT / 2)` so the agent can't blow URL budgets; each tag length matches the storage contract's `MAX_TAG_LENGTH`. `run_backtest_summary` keeps `market`/`timeframe` as free-text (not enums) because the agent surfaces conversational values like `"BTC/USDT"`; spec 55's executor maps to the underlying enum or drops them. `search_strategy_knowledge` is provider-agnostic — the description explicitly forbids current prices, market news, sentiment, and buy/sell signals; the sanitized missing-provider fallback `"Strategy research is not available right now."` is exported as `SEARCH_STRATEGY_KNOWLEDGE_UNAVAILABLE_MESSAGE` so spec 55 doesn't drift from the spec copy. `refine_script` documentation calls out that the executor (spec 55) must count it against the user's daily AI quota and acquire the same per-user stream concurrency lock as a manual refine. Per spec § Scope Limits: contracts only — `execute` functions, the AI SDK `tool({...})` composition, and the final `forgeTools` map are spec 55. No CRUD routes (spec 54), no UI (spec 57), no guardrail logic (spec 58). Documented in `context/architecture.md` § Forge Agent Architecture → "Forge Agent Tool Contracts (spec 53)". `npm run build` passes ✅
- `52-forge-agent-memory-schema.md` — Phase 6 foundation. Two new Drizzle tables in `drizzle/schema.ts`: `agent_conversations` (`id`, `user_id → users.id` not-null, optional `title varchar(200)`, `messages jsonb notNull default '[]'` typed as `AgentMessage[]`, optional `script_id → scripts.id`, `created_at`, `updated_at`) and `agent_memory` (`id`, `user_id → users.id`, `profile jsonb notNull default '{}'` typed as `AgentUserProfile`, `updated_at`). Indexes: `agent_conversations_user_id_updated_at_idx` (composite, `user_id` + `updated_at DESC`) for the conversation-list sort path; `agent_memory_user_id_unique_idx` (UNIQUE) so spec 56's extraction upsert can target one row per user. New types in `lib/types/agent.ts` — `AgentMessageRole`, `AgentMessage` (role, content, optional `toolCalls` + `toolResults`, per-turn `createdAt`), `AgentToolCall` (`id`, `name`, `args`), `AgentToolResult` (`toolCallId`, `name`, `result`, optional `isError`), `AgentUserProfile` (all optional: preferred markets / timeframes / indicators, risk tolerance, strategy patterns, average health score, total strategies generated, bounded `insights[]`, `lastExtractedAt`), `SavedConversation` client shape. Re-exported from `lib/types/index.ts` so consumers keep importing from `@/lib/types`. New `lib/db/agent-mapper.ts` exports `rowToAgentConversation()` (returns `SavedConversation` with safe `??` coalescing for `messages`/`createdAt`/`updatedAt`) and `rowToAgentMemory()` (returns `AgentUserProfile` directly — `id`/`userId`/`updatedAt` deliberately not surfaced because spec 55 injects the profile into the system prompt and spec 57 never renders a "memory row"). Re-exported from `lib/db/index.ts`. Drizzle migration `0003_awesome_thundra.sql` generated (two `CREATE TABLE`, three FK constraints, one composite index, one unique index — no changes to existing tables). Scope per spec: no CRUD routes (54), no streaming endpoint (55), no extraction logic (56), no UI (57). `npm run build` passes ✅
- `54-forge-conversation-crud.md` — Phase 6 REST shell over `agent_conversations` (spec 52). Two route files mirror the spec 45 / 46 narrow-route style: `app/api/forge/conversations/route.ts` (GET list + POST create) and `app/api/forge/conversations/[conversationId]/route.ts` (GET detail + PATCH rename + DELETE). New schemas in `lib/api/validation.ts`: `createConversationSchema` (`{ scriptId: z.number().int().positive().nullable().optional() }`) and `updateConversationSchema` (`{ title: z.string().trim().min(1).max(200) }`). New DB helpers in `lib/db/agent-conversations.ts` (re-exported from `lib/db/index.ts`): `listConversationsForUser(userId)` selects `id`/`title`/`scriptId`/`createdAt`/`updatedAt` only (no `messages` — heavy for the sidebar feed) ordered by `updated_at desc`, capped at `MAX_CONVERSATIONS_PER_USER`; `getConversationForUser(userId, conversationId)` returns the full row including messages via owner-scoped SELECT; `createConversation(userId, scriptId)` runs FIFO eviction when the user is at the cap (oldest by `updated_at asc` deleted before insert), verifies script ownership pre-insert when `scriptId` is non-null (returns `{ ok: false, reason: 'script-not-owned' }` on foreign/missing), and inserts with empty messages; `updateConversationTitle(userId, conversationId, title)` owner-scoped update that bumps `updated_at`; `deleteConversation(userId, conversationId)` owner-scoped delete (no FKs reference the table); `appendMessages(conversationId, userId, newMessages)` for spec 55 — uses raw `sql\`messages || ${jsonb}::jsonb\`` for atomic jsonb append, bumps `updated_at`, owner-scoped via `id` + `user_id` in WHERE. New mapper `rowToAgentConversationSummary()` in `lib/db/agent-mapper.ts` returns `SavedConversation` with `messages: []` so the list view payload stays consistent with the detail view type without lying about unloaded messages. New `MAX_CONVERSATIONS_PER_USER = 50` constant in `lib/config/constants.ts` (matches spec 52's storage cap). New ownership resolver `lib/api/resolve-owned-conversation-route.ts` (parallels `resolve-owned-collection-route.ts` / `resolve-owned-script-route.ts`) — 400 invalid id, 404 missing DB user / missing row, 403 row exists but owned by another user; spec 54 enumerates 403/404 as distinct outcomes for the detail routes so the resolver intentionally surfaces both (vs. the script/collection resolvers which collapse them to a single 403). Route flow mirrors spec 45 / 46: `protectDataRoute` → resolver (PATCH/DELETE/GET-detail) → `getDbUserIdByClerk` (GET list, soft-empty) or `ensureDbUserForClerkId` (POST, auto-provision) → Zod-validate → helper → `apiSuccess({ conversation })` or `{ conversations }` or `{ ok: true }`. Sanitized JSON errors only. Per spec § Scope Limits: no message streaming, no memory extraction, no UI, no individual message editing. `npm run build` passes (routes register as `ƒ /api/forge/conversations` + `ƒ /api/forge/conversations/[conversationId]`) ✅
- `55-forge-agent-streaming-endpoint.md` — Phase 6 streaming brain. New `app/api/forge/route.ts` POST handler wires the spec-53 tool contracts to the real LLM via Vercel AI SDK `streamText` and persists each turn into the spec-54 `agent_conversations` row. Pre-flight chain mirrors the spec § Flow exactly: `protectAiRoute` (auth + rate limit + plan) → `forgeMessageSchema.safeParse` → `getDbUserIdByClerk` → `getConversationForUser` (404 covers both missing and foreign — pre-stream leak surface is negligible) → `MAX_MESSAGES_PER_CONVERSATION` cap (200, sanitized spec copy on 400) → `resolveModelForPlan(plan, undefined)` (DEFAULT_MODEL for both plans in v1) → `responseIfMissingXaiApiKey` → `acquireStreamLock(clerkUserId)` (409 if held). System prompt assembled via new `lib/agent/system-prompt.ts` `buildForgeSystemPrompt(profile, scriptContext?)` — pure & deterministic, four ordered sections (identity / long-term memory / active script / guardrails). The guardrails block is a minimum-viable placeholder for spec 58 (refusal patterns + prompt-injection-as-data rule + sanitize-tool-errors rule). Long-term memory is read via new `lib/db/agent-memory.ts` `getAgentMemoryForUser(userId)` (re-exported from `lib/db/index.ts`) — owner-scoped, returns `{}` until spec 56 starts populating profiles, so the memory section is omitted entirely on a fresh user. Optional active-script context is loaded via owner-scoped `eq(scripts.id, ?) AND eq(scripts.user_id, userId)` and folded through `rowToSavedScript()` into the prompt; truncated to 2000 chars (the agent always has `get_script_details` for the full body). Tool composition lives in `lib/agent/build-forge-tools.ts` `buildForgeTools(ctx)` — pairs each spec-53 contract with a runner from `lib/agent/tool-runners.ts`, wraps every `execute` in try/catch that returns the contract's sanitized `errorMessage`. The `AgentToolContext` (`userId`/`clerkId`/`plan`/`model`/`signal`) is captured via JS closure scope — the AI SDK's `experimental_context` is intentionally **not** used so the security-critical `userId` can't leak into a tool input payload. Tool runners (`lib/agent/tool-runners.ts`) are in-process equivalents of the existing AI routes: `runHealthScoreInline` / `runBacktestSummaryInline` / `runGenerateAlertTemplatesInline` / `runRefineScriptInline` reuse the route's existing system prompts (`HEALTH_SCORE_SYSTEM`, `BACKTEST_SUMMARY_SYSTEM`, `ALERT_TEMPLATES_SYSTEM`, `PINE_GENERATE_SYSTEM_PROMPT`) + token budgets + Zod schemas (loose intake → strict re-validate where applicable) + the same `normalizeAlertTemplatesOutput` / `assembleBacktestSummaryMarkdown` helpers. `runSearchUserScripts` and `runGetScriptDetails` are direct DB reads (no AI). Every runner forwards the parent stream's `AbortSignal` so client disconnects cancel sub-LLM calls immediately. `runRefineScriptInline` deliberately skips `acquireStreamLock` because the parent Forge stream already holds the user's lock — a second acquire would deadlock. `search_strategy_knowledge` ships v1 without a provider — the executor returns `{ results: [], query, unavailable: SEARCH_STRATEGY_KNOWLEDGE_UNAVAILABLE_MESSAGE }` so the LLM gets a structured response and paraphrases the spec-defined "research not available right now" copy. `streamText` is configured with `stopWhen: stepCountIs(FORGE_AGENT_MAX_STEPS)` (5 — caps the tool loop per spec § Flow), `temperature: 0.4` (slightly looser than the 0.2 used for structured-output routes since the agent is in conversation mode), `system` + `messages` (no `prompt` — `messages` carries the full thread), and `abortSignal: req.signal`. Conversation history is converted to `ModelMessage[]` via text-only `agentHistoryToModelMessages()` — assistant turns drop `toolCalls`, tool messages are skipped entirely (the assistant's text already paraphrases tool output, and replaying exact tool-call/tool-result pairs adds provider-specific edge cases without much benefit). Persistence (`lib/agent/persist-turn.ts`): three helpers — `buildUserAgentMessage(content)` (spec-52 shape with ISO `createdAt`); `stepsToAgentMessages(steps)` folds each AI SDK `StepResult` into one assistant message (text + structured `toolCalls`) and (when present) one follow-up tool message; `generateConversationTitle(firstMessage, model, signal)` runs only on first exchange (when `conversation.title` is null) via a single `generateText` call (`temperature: 0.2`, `maxOutputTokens: 40`, sanitises quotes / "Title:" prefixes / falls back to first 60 chars on error). All three helpers run inside `streamText`'s `onFinish` so the client receives the stream first; `appendMessages()` from spec 54 atomically jsonb-appends both user + reconstructed assistant/tool messages. Lock release runs in `onFinish`, `onError`, and the outer try/catch — three independent paths so a stream slot is never orphaned. Returns `result.toUIMessageStreamResponse()` (SSE-shaped UI Message Stream that spec 57's chat client will consume; tool calls + results + text deltas interleaved). New constants in `lib/config/constants.ts`: `MAX_MESSAGES_PER_CONVERSATION = 200`, `FORGE_AGENT_MAX_STEPS = 5`. New schema `forgeMessageSchema` (`{ conversationId: positive int, message: trimmed string 1–4000 }`) + `ForgeMessageRequest` type in `lib/api/validation.ts`. v1 quota model: every Forge POST counts as one AI action via `protectAiRoute` (free users get 3 Forge turns/day shared with other AI routes); per-tool sub-call quota deduction is deferred per the spec's "tracks tool-call quota consumption" note until we know which tools fire most often in practice. Per spec § Scope Limits: no memory extraction (spec 56 — `getAgentMemoryForUser` always returns `{}` until that ships), no UI (spec 57), no standalone guardrails module (spec 58 — inline placeholder in system prompt), no real-time tool-progress streaming beyond what the AI SDK emits natively, no per-tool quota deduction. `npm run build` passes (route registers as `ƒ /api/forge`) ✅
- `57-forge-agent-ui.md` — Phase 6 user-facing surface. `/forge` is now an auth-gated RSC page at `app/forge/page.tsx` (added to `proxy.ts` `isProtectedRoute` matcher alongside `/generate(.*)`) that hydrates the client with three server-loaded payloads: `initialPlan` (from `users.plan`, defaults `'free'`), `initialConversations: SavedConversation[]` (via the spec-54 `listConversationsForUser` helper), and an optional `seedScript: SavedScript | null` parsed from `?scriptId=<id>` and owner-checked against `scripts.user_id` (foreign or missing → silent `null`, never surfaces as an error). Loading skeleton at `app/forge/loading.tsx` mirrors the final two-panel layout so the navbar shell + sidebar grid don't shift in. Top-level client orchestrator `components/forge/ForgeExperience.tsx` wraps everything in `UserPlanProvider` (so `ModelSelector` parity carries over), owns the `activeId` + `sidebarOpen` + `hydrationToken` state, and renders the navbar (PineForge wordmark + Forge accent badge + `ModeToggle` + `UserButton`), a desktop two-panel grid (`280px` sidebar + `flex-1` chat) plus a mobile Sheet drawer over `lg:hidden` (same pattern as Script History on `/generate`). The `hydrationToken` is the load-bearing piece of UX: a monotonically-increasing counter bumped *only* on intentional navigation (sidebar conversation click, active-conversation delete) — the chat panel's hydration `useEffect` depends solely on the token (not on `activeConversationId`), so creating a new conversation mid-send no longer triggers a re-fetch that would race the user's pending message via `useChat`. `ForgeChat.tsx` is the chat orchestrator: it adapts the `@ai-sdk/react` `useChat` hook to the spec-55 `POST /api/forge` contract by passing a `DefaultChatTransport` whose `prepareSendMessagesRequest` repackages the SDK's payload into `{ conversationId, message }` (the server expects exactly that shape, not the SDK's `UIMessage` envelope). A `conversationIdRef` mirrors `activeConversationId` so `handleSubmit` can synchronously write the freshly-created conversation id into the transport's closure on the very first send — without it, the first message would either 400 (no id) or fire-and-forget against a stale id. `lib/agent/ui-messages.ts` is the persisted ↔ UI bridge: `agentMessagesToUIMessages(history)` walks the spec-52 `AgentMessage[]` thread and folds each assistant text message together with its trailing `tool` follow-up message into a single AI SDK `UIMessage` whose `parts` interleave `{ type: 'text' }` and `{ type: 'tool', toolName, state, input, output, errorText }` fragments — that's what `ForgeMessageList` renders on every hydrate, so reloads look identical to the live stream. `useForgeConversations` hook in `hooks/useForgeConversations.ts` is the sidebar's single source of truth: list, create, rename, delete, touch helpers all wire to the spec-54 routes with optimistic UI + rollback on failure (rename returns the previous title, delete restores the row in place). `ForgeConversationSidebar.tsx` renders the list (active row gets the emerald rim + `aria-current`), inline-rename (Enter commits / Escape reverts, same pattern as Script History rename), and a delete dialog (`AlertDialog`); the sidebar's "New chat" button just clears `activeId` so the empty state shows — actual creation is lazy-fired by `ForgeChat.handleSubmit` so empty conversations never pollute the list. `ForgeMessageList.tsx` is `role="log" aria-live="polite"`, auto-scrolls on new content via a sentinel `<div ref>` and a `MutationObserver` so streamed deltas don't fight the scroll lock, renders user bubbles (right-aligned, `bg-zinc-800/60`) vs assistant text (left-aligned, no bubble, light markdown via the spec-defined `<strong>` / `<em>` / `<code>` whitelist — no `dangerouslySetInnerHTML`, all text stays inert), and threads the in-flight typing indicator behind the last assistant message while `status === 'streaming'`. `ForgeToolCallCard.tsx` renders the in-line tool invocation as a collapsible card with a per-tool icon map (`Shield` health, `FlaskConical` backtest, `Bell` alerts, `Search` script search, `Code` get_script_details, `Pencil` refine, `Globe` strategy research) plus four states — `pending` (spinner + spec copy), `running` (same), `output-available` (one-line summary derived per-tool: `"Score: 7/10"` / `"Found 3 scripts"` / `"3 templates"` / `"Backtest summary ready"` / etc., expandable to the full structured payload), and `output-error` (amber rim + sanitized error text); the expandable region uses `aria-expanded` + `aria-controls` and reuses `Pre` with a JSON pretty-print for the raw input/output blob. `ForgeInput.tsx` is the composer: auto-resize textarea (rows 1→4 then internal scroll), `Enter` submits / `Shift+Enter` newline (matches the generator), client-side `FORGE_MAX_MESSAGE_LENGTH = 4000` cap matches the spec-55 `forgeMessageSchema`, soft amber tint at 3500 chars, character count tied to `aria-describedby`, disabled-with-banner copy when the conversation hits the spec-55 200-message cap, and a `Stop` button (calls `useChat`'s `stop()`) replaces the Send button while streaming. `ForgeEmptyState.tsx` ships the four spec-defined suggestion chips ("Analyze my last strategy" / "Help me build a BTC scalping strategy" / "Compare my starred scripts" / "What indicators work for 15m crypto?") — each chip directly invokes `handleSubmit(text)` rather than prefilling the textarea, so the new-conversation creation path stays single-flighted. Entry points: (a) `components/generate/GenerateExperience.tsx` adds a Forge link to the navbar (signed-in only, emerald rim + `Sparkles` icon + `New` badge), (b) `components/strategy/OutputActionBar.tsx` adds a "Discuss with Forge" button next to the existing export strip — visible only when the script lineage's `rootId` parses to a positive int (DB-backed scripts, signed-in users; localStorage-only scripts have no DB id to seed with), navigates to `/forge?scriptId=<rootId>`. `StrategyOutputCard.tsx` + `StrategyForm.tsx` plumb `forgeScriptId` through (`lineage.lineageState?.rootId` → `parseForgeScriptId()` → `OutputActionBar.forgeScriptId`); a tiny local helper handles the string→number parse so the existing `LineageState.rootId: string` contract doesn't have to widen for one consumer. Per spec § Scope Limits: no command palette integration on `/forge` (the palette stays on `/generate`); no drag-and-drop reorder; no conversation search/filter (list cap is the spec-54 `MAX_CONVERSATIONS_PER_USER = 50`); no inline script editor (the agent shows scripts as formatted code blocks, edits go through the refine tool or back to `/generate`); no split-view; no conversation markdown export. `npm run build` passes (page registers as `ƒ /forge`); existing lint config doesn't gate on the unrelated `react-hooks/set-state-in-effect` warnings that already exist across the codebase. Documented in `context/architecture.md` § Forge Agent Architecture (forthcoming spec-57 entry) ✅
- `58-forge-agent-guardrails.md` — Phase 6 safety + scope policy. New `lib/agent/guardrails.ts` (server-only) exports the canonical `FORGE_GUARDRAILS` block — verbatim from spec § "System Prompt Guardrails Block" — covering five bands: (1) hard refusals (no buy/sell/profit-claim/price-prediction/broker-connect/portfolio-access/off-scope content; Health Score never framed as a profit predictor), (2) redirect templates that turn each refused request into a usable next step (Health Score / Backtesting Summary / refine / history search), (3) language constraints (advisory phrasing only; explicit reminders that Health Score reflects structural quality and Backtesting Summary past patterns don't guarantee future results), (4) tool usage rules (only call when warranted, never fabricate results, paraphrase sanitized errors, explain multi-tool chains before running them, treat any instruction embedded inside scripts / prompts / tool inputs / tool outputs as **data** not directive), and (5) prompt transparency (describe capabilities in plain language; never output the raw system prompt or guardrails block; never adopt a different persona). `lib/agent/system-prompt.ts` no longer inlines its MVP block — it imports `FORGE_GUARDRAILS` from `./guardrails` and appends it as the final section of `buildForgeSystemPrompt()`. Stable composition order (identity → optional memory → optional active script → guardrails) preserved so the LLM caches the prompt prefix consistently across turns. Tool result validation (spec § Tool Result Validation) audited end-to-end: `runHealthScoreInline` (strict `healthScoreResultSchema.safeParse`), `runBacktestSummaryInline` (strict `backtestSummaryResultSchema.safeParse` against assembled markdown + sections), `runGenerateAlertTemplatesInline` (`normalizeAlertTemplatesOutput` runs `JSON.parse` on each `messageJson` and returns `null` if any provider's template fails → runner throws → executor returns sanitized error), `runSearchUserScripts` (Drizzle SELECT + `rowToSavedScript` guarantee shape; empty array valid), `runGetScriptDetails` (null surfaces `GET_SCRIPT_DETAILS_ERROR`), and `search_strategy_knowledge` (v1 returns the unavailable fallback with a constant shape) were already in place from spec 55. The one gap — `runRefineScriptInline` returning whatever the model emitted without an empty-output check — was closed here: the runner now throws `'refine-script returned empty content'` when `text.trim().length === 0`, routing through the `buildForgeTools` try/catch wrapper into the spec-53 sanitized `REFINE_SCRIPT_ERROR`. Defense-in-depth layers outside the prompt block are unchanged (already enforced by earlier specs): `forgeMessageSchema`'s 4000-char cap (spec 55), spec-53 Zod tool inputs (no raw user message bleeds into tool args), `protectAiRoute` rate limit + plan + auth (spec 20), `acquireStreamLock` per-user concurrency lock (spec 55), and `experimental_context`-free closure capture of `AgentToolContext` so `userId` can't leak into a tool input. Per spec § Scope Limits: no post-stream output content filter, no user reporting mechanism, no admin monitoring dashboard, no per-user / per-plan guardrail variants — the block is static and identical for every Forge turn. Documented in `context/architecture.md` § Forge Agent Architecture → "Forge Agent guardrails (spec 58)". `npm run build` passes ✅

## In Progress

## Next Up

- Phase 6 Forge Agent (`51`–`58`) is complete. No active spec in
  Phase 6.
- Optional: `15-theme-toggle.md` follow-ups (generator cards light polish)
- Optional: weighted quotas + audit logs (`context/fixes.md` Fix 3, 7)

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
- **Phase 5 medium-value foundation**: the required persistence columns and
  table already exist in Drizzle (`scripts.isStarred`, `scripts.tags`,
  `scripts.collectionId`, `collections`). Medium-feature planning should reuse
  these first and only introduce migrations if a live-schema audit finds drift.
- **Strategy Tags contract**: `scripts.tags` (jsonb `string[]`, default `[]`)
  is the source of truth; `SavedScript.tags` is always present
  (defaults `[]`). Normalization rules live in `lib/scripts/tags.ts` —
  `normalizeTags()` trims, lower-cases, drops empty values, drops entries
  longer than `MAX_TAG_LENGTH = 24`, de-duplicates, and clamps to
  `MAX_TAGS_PER_SCRIPT = 10`. Pure and deterministic, shared by client
  and server so persistence stays consistent. `tagsInputSchema` (Zod) is
  the API-boundary guard for shape; the mutation route (spec 41)
  parses → normalizes → persists (never writes raw input).
- **Tags mutation route**: `PATCH /api/scripts/[scriptId]/tags` mirrors
  the spec 37 star route — narrow, single-purpose, owner-scoped. Body is
  `{ tags: string[] }`, validated by `setScriptTagsSchema`. Server
  always re-runs `normalizeTags()` after Zod (Zod cannot dedupe /
  lower-case), then writes the normalized array + bumps `updated_at`.
  Response returns the full `SavedScript` via `rowToSavedScript()` so
  clients can drop optimistic UI state and trust the server payload.
- **History search route**: `GET /api/scripts/search` is a dedicated
  read endpoint — `GET /api/scripts` stays the recency+starred-union
  feed (spec 38) so the UI can pick between "browse" and "search"
  cleanly. All filters live in `searchScriptsForUser()`
  (`lib/db/search-user-scripts.ts`) and are ANDed with
  `eq(scripts.userId, userId)` first so cross-user leaks are
  structurally impossible. Text search uses Drizzle's `ilike()` plus a
  parameterized `metadata->>'prompt' ILIKE` clause — values are bound,
  never concatenated, and user-typed `%`/`_`/`\` are escaped so they
  don't act as SQL wildcards. Tag filter uses jsonb `@>` containment so
  multi-tag queries are AND-semantics. `starred` is symmetric (`true` =
  only starred, `false` = only unstarred, omitted = no filter).
  `collectionId` is wired now but only takes effect once spec 46 starts
  assigning rows.
- **Tags + Search UI (client-side filter)**: the history sheet filters
  the **in-memory** cache via `filterHistoryEntries()`
  (`lib/scripts/history-filter.ts`), not the server route. Rationale:
  the cache already holds the recency window + every starred row (specs
  38, 39), so client-side filtering is responsive, has no flicker, and
  works for signed-out users too. The semantics mirror the server
  route exactly (case-insensitive substring on `name`+`prompt`,
  AND-containment on tags) so swapping to server search later requires
  no UX changes. The server route stays the right tool for future
  cross-session search beyond the cached window. `useScriptHistory.setTagsEntry()`
  also runs `normalizeTags()` client-side before PATCH; the server
  re-normalizes so the boundary is double-locked.
- **Strategy Collections contract**: the `collections` table
  (`id`, `user_id`, `name varchar(100)`, `created_at`) and
  `scripts.collection_id` (`integer references collections(id)`,
  nullable) are the source of truth — both already shipped with
  `0000_mute_rattler.sql`. `SavedScript.collectionId` is always
  present as `number | null` (defaults `null`); a separate
  `SavedCollection` type (`{ id, name, createdAt }`) is the response
  shape for spec 45's CRUD. All naming rules live in
  `lib/collections/collections.ts` — `normalizeCollectionName()`
  trims and rejects empty / oversize values, casing is preserved
  (unlike tags, since collections are display labels), and
  `isSameCollectionName()` runs the case-insensitive comparison that
  spec 45's CRUD route uses for **app-layer** duplicate prevention
  (no DB unique index yet — a future migration on
  `(user_id, lower(name))` would replace the app check; until then
  the app guard is canonical). Spec 42's search route already
  filters on `collectionId` via `searchScriptsForUser`, so the
  contract closes the round-trip; spec 46's assignment route now
  populates `scripts.collection_id` so collection filters return
  matches.
- **Script collection assignment route**: `PATCH /api/scripts/
  [scriptId]/collection` is a narrow, single-purpose mutation —
  body `{ collectionId: number | null }`, validated by
  `setScriptCollectionSchema`. Flow mirrors star/tags routes:
  script ownership pre-check, then (when non-null) collection
  ownership pre-check on the **same** `userId`, then write with
  both `scripts.id` and `scripts.user_id` in the WHERE clause.
  Cross-user assignment is impossible (403 on foreign/missing
  collection, no existence leak). Response returns full
  `SavedScript` via `rowToSavedScript()` so clients trust
  `collectionId` from the server payload.
- **Strategy Export source contract**: `lib/export/source.ts` is the
  single source of truth for the Notion / Obsidian export payload.
  `StrategyExportSource` matches the spec-48 recommended payload
  one-to-one (title, prompt, script, model, structured inputs,
  breakdown, created / updated timestamps). The two builders —
  `buildStrategyExportSource()` for the active generator path and
  `buildExportSourceFromSavedScript()` for the history path — are
  pure, deterministic, and synchronous (no AI calls, no DB writes,
  no DOM), so spec 49's serializer can rely on a stable input
  regardless of where the data was assembled. `breakdown` is `null`
  when the Breakdown tab has not been loaded yet; spec 50 decides
  whether to skip the section or prompt the user. `updatedAt` is
  reserved as `null` so the contract does not need a breaking change
  once `SavedScript` exposes `scripts.updated_at`. Mirrors the
  spec-36 starred / spec-40 tags / spec-44 collections data-contract
  pattern — a contract-only step that lets later specs (49 markdown
  serializer, 50 client actions) depend on one canonical payload.
- **Forge Agent tool contracts** (spec 53): new `lib/agent/` namespace
  per `context/architecture.md` § System Boundaries ("`lib/agent/` —
  Agent internals: system prompt, tool definitions, memory helpers").
  Seven tool files in `lib/agent/tools/` — one per tool, mirroring the
  spec's one-section-per-tool structure so future edits land in the
  obvious place. Aggregating `index.ts` exposes `forgeToolContracts`
  (read-only registry keyed by tool name) and `FORGE_TOOL_NAMES`
  (string-literal tuple) so spec 55's streaming endpoint can iterate
  cleanly while spec 58 gets a single source of truth for the
  "known tool names" allowlist. `AgentToolContext` is intentionally
  the only place auth-scoped data lives — `userId`, `clerkId`,
  `plan`, `model`, `signal`. The LLM never sees these because they
  aren't part of any `inputSchema`; spec 55's executors receive them
  as a separate context parameter. Output types reuse the strict
  schemas spec 27/29/33 already publish (`HealthScoreResult`,
  `AlertTemplatesResult`, `BacktestSummaryResult`) plus the existing
  `SavedScript` model — so the agent's tool results round-trip
  through the same UI panels the manual flow uses with no shape
  translation. The deliberate divergence: `run_backtest_summary`
  keeps `market`/`timeframe` as free-text (not enums) because the
  agent gets these from conversation and the executor (spec 55) is
  responsible for mapping/dropping unsupported values before
  invoking the shared handler. `search_strategy_knowledge` is
  provider-agnostic (Tavily / Serper / Brave choice deferred to
  spec 55) and the sanitized missing-provider fallback message is
  exported as a constant so the executor can't drift from the
  spec-defined copy. Spec 53 is contracts only — `execute`
  functions, the AI SDK `tool({...})` composition, and the final
  `forgeTools` map land in spec 55.
- **Forge Agent streaming endpoint** (spec 55): `POST /api/forge` is
  the brain that wires every prior Phase 6 spec into a working chat
  turn. Single handler — conversation creation stays on
  `POST /api/forge/conversations` (spec 54), so this route only
  appends turns to an existing thread (`forgeMessageSchema` rejects
  the no-conversationId case at 400). The pre-stream IO chain runs
  in dependency order so each guard short-circuits before the next:
  `protectAiRoute` → schema parse → DB-user lookup →
  `getConversationForUser` → 200-message cap → model resolution →
  `XAI_API_KEY` env check → `acquireStreamLock`. Memory (spec 56's
  output) is read via the new `getAgentMemoryForUser()` helper —
  read-only here, so the streaming endpoint ships before extraction
  exists; the empty-`{}` path collapses the system-prompt memory
  section cleanly until spec 56 starts populating profiles. The
  active-script context (`/forge?scriptId=<id>`) is verified
  owner-scoped at prompt build time and silently dropped on missing
  / foreign rows because the conversation row's ownership is
  already locked in — there's no need to surface a "your script was
  deleted" error. Tool composition is split across three modules so
  each concern is a single file: contracts in `lib/agent/tools/`
  (spec 53), in-process executors in `lib/agent/tool-runners.ts`,
  and the `tool({...})` wiring in `lib/agent/build-forge-tools.ts`.
  The runner module is the canonical extraction of "the same logic
  the route handler uses, minus HTTP" for health-score / backtest /
  alerts / refine — they reuse the existing system prompts, token
  budgets, Zod schemas, and normalize/assemble helpers, so the
  agent's tool output is bit-for-bit identical to what the manual
  `/api/health-score` etc. would produce. The `experimental_context`
  parameter on `streamText` is **deliberately unused** — instead,
  every executor closes over the typed `AgentToolContext` via JS
  scope, so `userId` can never accidentally end up in a tool's
  input payload (the AI SDK's untyped context bag would make that
  audit harder). Refine-inside-agent skips its own
  `acquireStreamLock` because the parent already holds the user's
  lock — a second acquire would deadlock. History → ModelMessage
  conversion is text-only in v1: the stored AgentMessage tool-call
  / tool-result payloads are dropped on replay because the
  assistant's text response in each step already paraphrases tool
  output, and replaying exact id-matched pairs adds provider edge
  cases (id format mismatch, content-array vs string content) for
  little gain. Persistence (`onFinish`) reconstructs an assistant
  AgentMessage per step (with structured `toolCalls` preserved for
  spec 57's UI) plus one follow-up tool AgentMessage when results
  exist; spec 54's atomic-jsonb `appendMessages()` writes both the
  user message and the reconstructed thread in a single owner-scoped
  UPDATE. First-turn auto-title runs only when
  `conversation.title === null`, via a tight `generateText` call
  (sanitised + 60-char clamp + fallback to first 60 chars of the
  user message), then `updateConversationTitle()` from spec 54
  bumps the title and `updated_at` so the conversation floats to
  the top of the sidebar. Lock release fires in `onFinish` /
  `onError` / outer try/catch — three independent paths so a stream
  slot is never orphaned. v1 deliberately does not double-charge
  for tool sub-calls (the spec's "tracks tool-call quota
  consumption" line is deferred); each Forge POST is exactly one
  AI action against the user's daily quota. The route returns
  `result.toUIMessageStreamResponse()` so spec 57's chat UI can
  consume the SSE-shaped UI Message Stream directly.
- **Forge Agent conversation CRUD** (spec 54): two route files —
  `app/api/forge/conversations/route.ts` (GET list + POST create) and
  `app/api/forge/conversations/[conversationId]/route.ts` (GET detail
  + PATCH rename + DELETE) — mirror the spec 45 / 46 narrow-route
  pattern. Every helper in `lib/db/agent-conversations.ts` is
  owner-scoped: both `id` and `user_id` participate in every WHERE
  clause so cross-user reads/writes are structurally impossible even
  if the route resolver were bypassed. List query selects only
  `id`/`title`/`scriptId`/`createdAt`/`updatedAt` — never the
  `messages` jsonb column — because the sidebar feed never renders
  thread bodies and loading 50 full threads at once would blow up
  payload size. Detail loads happen via `getConversationForUser()`
  which selects the full row. POST handles two protections in one
  helper call (`createConversation`): (1) script ownership pre-check
  when `scriptId` is non-null so the agent can never attach a
  foreign script as initial context (403, no row-existence leak),
  and (2) FIFO eviction when the user is already at the
  `MAX_CONVERSATIONS_PER_USER = 50` cap — oldest by `updated_at asc`
  is deleted before insert, no pinned conversations in v1. PATCH only
  accepts `title` (v1 — message body is owned exclusively by spec 55's
  streaming endpoint); the rename bumps `updated_at` so the
  conversation floats to the top of the list. DELETE is a straight
  row removal because `agent_conversations` is a leaf table (nothing
  references its id at the FK layer). `appendMessages()` is a
  pre-built helper for spec 55 — uses `sql\`messages || ${json}::jsonb\``
  for an atomic jsonb append + `updated_at` bump in a single
  owner-scoped UPDATE, so the streaming endpoint doesn't need to load
  the full thread to write one turn. Ownership resolver
  `resolve-owned-conversation-route.ts` deliberately diverges from
  the script/collection resolvers — it surfaces 403 vs 404 as
  distinct outcomes per the spec (instead of collapsing into 403),
  because agent conversation ids are not enumerable from the client
  (no public list endpoint that returns ids from other accounts)
  so the existence-leak surface is negligible compared with the UX
  benefit. `rowToAgentConversationSummary()` returns
  `SavedConversation` with `messages: []` so the list-view payload
  stays the same client type as the detail view without claiming the
  conversation has zero messages — the empty array signals "messages
  not loaded for this view". POST uses `ensureDbUserForClerkId` so a
  freshly-signed-in user can start chatting before the background
  user sync resolves; GET / PATCH / DELETE use `getDbUserIdByClerk`
  with the same soft-empty / 404 semantics as the collections route.
- **Forge Agent memory schema** (spec 52): two new tables in
  `drizzle/schema.ts`. `agent_conversations` stores per-thread state as a
  single jsonb `messages` array (not one row per message) so a thread is
  always loaded in one read — caps live in higher specs (200 messages /
  conv via streaming endpoint, 50 conv / user via FIFO eviction in CRUD).
  Composite index `(user_id, updated_at DESC)` matches the "list my
  conversations" sort path. `agent_memory` is one row per user (UNIQUE
  index on `user_id`) so the spec-56 extraction upsert can target
  `ON CONFLICT (user_id) DO UPDATE` cleanly. Both `messages` and
  `profile` are `notNull().default('[]'/{}')` so reads never coalesce
  null and the `$type<>()` cast makes the mappers safe without `any`.
  Schema also imports `AgentMessage` / `AgentUserProfile` from
  `lib/types/agent.ts` — the contract lives in `lib/types/` so RSC,
  client, and DB layers share one source of truth without forcing
  Drizzle to leak into the client bundle. Mappers in
  `lib/db/agent-mapper.ts` (`rowToAgentConversation` returns a
  `SavedConversation`; `rowToAgentMemory` returns just the
  `AgentUserProfile` — the row metadata is intentionally hidden because
  spec 55 injects the profile and spec 57 never displays a "memory
  row"). Migration `0003_awesome_thundra.sql` adds the two tables, FKs
  (`user_id → users.id`, optional `script_id → scripts.id` on
  conversations), composite + unique indexes; no changes to existing
  tables.
- **Collections CRUD route**: `GET / POST /api/collections` and
  `PATCH / DELETE /api/collections/[collectionId]` follow the spec
  37 / 41 narrow-route style — narrow, single-purpose, owner-scoped.
  Every write statement includes both `eq(collections.id, ?)` **and**
  `eq(collections.userId, userId)` so cross-user writes are
  structurally impossible. Names are validated with
  `createCollectionSchema` / `renameCollectionSchema`
  (both `{ name: collectionNameInputSchema }`); the route still
  re-runs `normalizeCollectionName()` after Zod (Zod cannot trim
  whitespace for us) so the canonical value reaches both the
  duplicate guard and the DB. The duplicate guard
  (`findUserCollectionByNameInsensitive()`) runs a single SQL query
  with `lower(${collections.name}) = lower(${name})` ANDed under
  `userId`, returning 409 with sanitized copy — no DB unique index
  yet so the app guard is canonical, mirroring the spec-44 contract.
  PATCH passes `excludeId` so renaming a collection to its own
  current casing variant doesn't conflict with itself. DELETE
  unassigns referencing scripts before removing the collection
  (`UPDATE scripts SET collection_id = NULL` scoped to
  `user_id = ? AND collection_id = ?`) because the existing FK is
  `ON DELETE no action`; both writes are user-scoped, neon-http has
  no transactions, and the unassign step is idempotent so retries
  are safe on partial failure. POST uses `ensureDbUserForClerkId`
  so a freshly-signed-in user auto-provisions the DB row on first
  collection create; GET/PATCH/DELETE use `getDbUserIdByClerk` and
  return `{ collections: [] }` (GET) / 404 (PATCH/DELETE) on missing
  DB user, matching the existing `/api/scripts` envelope.

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
- Strategy Tags data contract (`40`): no migration — `scripts.tags` shipped
  in `0000_mute_rattler.sql`. Contract additions stay tight: `SavedScript`
  gets required `tags: string[]`, `rowToSavedScript()` maps `row.tags ?? []`,
  `savedScriptSchema` parses legacy entries via `.default([])`, and the two
  builders default to `tags: []`. All tag rules — trim, lower-case,
  de-dupe, drop empty, drop > 24-char, clamp 10 — live in
  `lib/scripts/tags.ts` so the mutation route (spec 41), search route
  (spec 42), and chip-editor UI (spec 43) can import a single source of
  truth (`normalizeTags`, `MAX_TAGS_PER_SCRIPT`, `MAX_TAG_LENGTH`,
  `tagsInputSchema`). No route, search, or UI work in this step
- Strategy Tags + Search UI (`43`): history sheet now owns search,
  filters, and tag editing without growing into a management screen.
  Pure helper `filterHistoryEntries()` / `isHistoryFilterActive()` in
  `lib/scripts/history-filter.ts` runs client-side against the cached
  list, mirroring spec 42's server semantics so behavior stays
  consistent if/when the UI switches to server search later. New hook
  method `useScriptHistory.setTagsEntry(id, tags)` parallels
  `toggleStarEntry`: signed-in path PATCHes `/api/scripts/[id]/tags`
  (client pre-runs `normalizeTags`, server re-runs — double-locked),
  optimistic cache update via `capScriptHistory()` so starred entries
  survive the 50-cap trim; signed-out path writes normalized tags to
  localStorage. UI additions in `components/strategy/ScriptHistory.tsx`:
  (a) search input with Search icon at the top of the sheet body,
  (b) active-filter chip row with per-tag X and global Clear,
  (c) per-entry tag chips (`<button aria-pressed>`) that toggle filter
  membership, (d) inline tag editor (comma-separated input + Save/Cancel
  + Esc to cancel) reached via a new `Tag` action button, (e)
  no-results state with a Clear-filters CTA when filtering empties the
  list. `partitionScriptsByStarred()` now consumes the **filtered**
  list so the Pinned section also narrows under filters. Rename/delete/
  star/load semantics, sheet copy, and the legacy
  empty-state-when-no-entries fall-through are untouched. A11y: every
  chip and action carries an `aria-label`, edit-mode buttons use
  `aria-expanded`, filter chips use `aria-pressed`, Search input has
  an `aria-label`
- Strategy Tags history search route (`42`): dedicated read endpoint
  `GET /api/scripts/search` (not an overload of `GET /api/scripts` — the
  base route keeps spec 38's recency+starred-union behavior, so the UI
  picks the right call by mode). Query layer is a single helper
  `searchScriptsForUser()` in `lib/db/search-user-scripts.ts` so the
  route stays thin (parse → coerce → call helper → map rows).
  `searchScriptsQuerySchema` validates query-param shape only — `q`
  trimmed + capped at 200, `tag` accepts repeated `?tag=` **and**
  comma-separated values (route flattens with `flatMap(v => v.split(','))`
  then runs the combined list through `normalizeTags()` so `Foo`, `foo`,
  and `FOO` resolve to the same DB value), `starred` accepts
  `'true' | 'false'` (symmetric — `false` filters to only-unstarred,
  not "no filter"), `collectionId` accepts a positive integer string.
  SQL safety: `q` is bound as a parameter via `ilike()` / `sql\`... ILIKE ${pattern}\``,
  and `escapeLikePattern()` escapes user-typed `%`/`_`/`\\` so they
  don't expand the match unintentionally; tag match uses parameterized
  jsonb `@>` containment (`${scripts.tags} @> ${JSON.stringify(tags)}::jsonb`);
  every condition is ANDed with `eq(scripts.userId, userId)` first.
  Results sort by `created_at` desc, capped at `MAX_HISTORY_ENTRIES`,
  returned as `{ scripts: SavedScript[] }` via `rowToSavedScript()`
  (same shape as `GET /api/scripts` so spec 43's UI can swap calls
  without touching parse paths). Status codes: 401 unauth (session
  helper), 400 invalid query (Zod issues), `{ scripts: [] }` on missing
  user (signed in but no DB row yet). No UI, no mutation, no ranking
  engine in this step — that's spec 43
- Strategy Collections assignment route (`46`): dedicated narrow route
  `PATCH /api/scripts/[scriptId]/collection` at
  `app/api/scripts/[scriptId]/collection/route.ts`. New
  `setScriptCollectionSchema` in `lib/api/validation.ts` —
  `{ collectionId: z.number().int().positive().nullable() }`.
  Route flow: session → parse script id → `getDbUserIdByClerk` →
  Zod-validate → script ownership pre-check → when `collectionId`
  is non-null, collection ownership pre-check (`eq(collections.id,
  collectionId)` AND `eq(collections.userId, userId)`) → update
  `scripts.collection_id` + bump `updated_at` → return
  `{ script: rowToSavedScript(updated) }`. `null` clears assignment.
  Foreign or missing target collection → 403 (no leak). No tag,
  star, or collection CRUD in this route. Spec 42's
  `collectionId` search filter now has live data once clients
  call this endpoint. Documented in `context/architecture.md` §
  Data Contracts → "Script collection assignment route".
  `npm run build` registers `ƒ /api/scripts/[scriptId]/collection`
- Strategy Collections CRUD route (`45`): two route files mirror the
  spec 37 / 41 narrow-route pattern exactly — `app/api/collections/
  route.ts` owns `GET` + `POST` and `app/api/collections/
  [collectionId]/route.ts` owns `PATCH` + `DELETE`. Schemas
  `createCollectionSchema` and `renameCollectionSchema` (added in
  `lib/api/validation.ts`) both wrap the spec-44
  `collectionNameInputSchema` so name length / shape rules stay
  centralized. New DB helpers in `lib/db/list-user-collections.ts`:
  `listCollectionsForUser(userId)` (orderBy `createdAt` desc; no cap
  because collection sets are coarse-grained), and
  `findUserCollectionByNameInsensitive(userId, name, excludeId?)`
  (single SQL with `lower(${collections.name}) = lower(${name})`
  ANDed under `eq(collections.userId, userId)` plus optional
  `ne(collections.id, excludeId)` for PATCH self-exclusion). Both
  helpers re-exported from `lib/db/index.ts` so spec 47's UI can
  import them. Route flow: session → parse id (PATCH/DELETE) →
  user resolution (POST = `ensureDbUserForClerkId`, others =
  `getDbUserIdByClerk` + 404 on missing) → Zod-validate →
  `normalizeCollectionName` → app-layer duplicate guard
  (409 on conflict) → ownership pre-check (PATCH/DELETE) → write →
  `{ collection }` (or `{ collections }` for GET, `{ ok: true }` for
  DELETE). All errors sanitized — only Zod's `error.issues` is
  forwarded for body validation failures, the rest are
  user-friendly strings. DELETE handles the existing
  `ON DELETE no action` FK on `scripts.collection_id` with a
  user-scoped unassign-then-delete sequence (`UPDATE scripts SET
  collection_id = NULL, updated_at = NOW() WHERE user_id = ?
  AND collection_id = ? AND collection_id IS NOT NULL`, then the
  collection delete). Both writes scoped to caller's `userId` so
  cross-user side effects are structurally impossible. neon-http
  has no transaction surface, but the unassign step is idempotent
  so a retry recovers from any partial-write window. Documented
  in `context/architecture.md` § Data Contracts → "Collections
  CRUD route". `npm run build` registers `ƒ /api/collections` +
  `ƒ /api/collections/[collectionId]`. No script-assignment route
  (spec 46), no picker UI (spec 47) in this step
- Strategy Collections data contract (`44`): no migration — the
  `collections` table (`id`, `user_id → users.id`,
  `name varchar(100)`, `created_at`) and `scripts.collection_id`
  foreign key both shipped in `0000_mute_rattler.sql`. Contract
  additions stay tight: `SavedScript` gets required
  `collectionId: number | null`, `rowToSavedScript()` maps
  `row.collectionId ?? null`, `savedScriptSchema` parses legacy
  entries via `z.number().int().nullable().default(null)`, and the
  two builders default to `collectionId: null`. New `SavedCollection`
  type added to `lib/types/index.ts` as the shared response shape for
  spec 45; new `rowToSavedCollection()` mapper in
  `lib/db/collection-mapper.ts` (re-exported from `lib/db/index.ts`)
  keeps collection rows shape-consistent. All collection naming rules
  — trim, min 1, max 100 chars (matches `varchar(100)` column),
  preserve casing, case-insensitive duplicate check via
  `isSameCollectionName()` — live in `lib/collections/collections.ts`
  so the CRUD route (spec 45), assignment route (spec 46), and UI
  (spec 47) can import a single source of truth
  (`normalizeCollectionName`, `isSameCollectionName`,
  `MAX_COLLECTION_NAME_LENGTH`, `MIN_COLLECTION_NAME_LENGTH`,
  `collectionNameInputSchema`). Duplicate prevention is app-layer
  only (no DB unique index yet) — documented as a future
  migration on `(user_id, lower(name))`. No route, search, or UI
  work in this step
- Strategy Tags mutation route (`41`): dedicated narrow route
  `PATCH /api/scripts/[scriptId]/tags` mirrors the spec 37 star route
  exactly — `requireClerkSession` → `parseScriptId` → `getDbUserIdByClerk`
  → `setScriptTagsSchema` (added to `lib/api/validation.ts` alongside
  `starScriptSchema`) → ownership pre-check → `normalizeTags()` on the
  parsed array → single `update().set({ tags, updatedAt }).returning()` →
  `rowToSavedScript(updated)`. Normalization runs **server-side after
  Zod**: Zod cannot dedupe or lower-case, so the route never trusts the
  raw client payload — clients can also pre-normalize for UX, but the
  server has the final word. Empty arrays are valid (clears all tags).
  Status codes: 400 invalid id, 400 Zod issues, 401 unauth (via session
  helper), 404 missing user, 403 non-owner, 500 update returned nothing.
  Sanitized JSON errors only — no Zod error string leak beyond
  `error.issues`. No search query, no chip-editor UI, no collection
  changes in this step
- Strategy Export source contract (`48`): no migration, no API route, no
  UI in this step — the contract is purely in-app. `lib/export/source.ts`
  is the new home for the export payload shape so the future markdown
  serializer (spec 49) and copy/download actions (spec 50) can import a
  single source of truth (`StrategyExportSource`,
  `StrategyExportSourceModel`, `StrategyExportStructuredInputs`,
  `DEFAULT_EXPORT_TITLE`, `buildStrategyExportSource`,
  `buildExportSourceFromSavedScript`). Same pattern as spec 36 starred /
  spec 40 tags / spec 44 collections data contracts — payload shape is
  defined once, normalization happens at the contract boundary
  (title fallback, trim prompt/breakdown, drop empty structured-input
  values, resolve `model` against `GROK_MODELS`), and downstream specs
  consume the canonical shape. The `script` body is intentionally
  passed through verbatim (no whitespace normalization) because spec 49
  owns fenced-code-block formatting; trimming here could remove
  semantically meaningful leading comments or trailing newlines in
  Pine Script. `updatedAt: string | null` is on the type but currently
  always `null` — `SavedScript` does not surface `scripts.updated_at`
  yet, so the field is reserved for forward compatibility (spec 49
  can render it once the row mapper exposes it without breaking the
  contract). No Zod schema: spec 48 has no API boundary, and the
  builders are pure TS — Zod would just duplicate the type guard. If
  spec 50 needs runtime validation (e.g. on a future server-side
  export route), it can add a thin schema at that boundary
- Forge Agent tool contracts (`53`): no execute, no API route, no AI
  SDK `tool()` composition in this step — that's spec 55. Seven
  contract files in new `lib/agent/tools/` directory plus shared
  `types.ts` + aggregating `index.ts`. Each contract file exports
  the LLM-facing description, Zod input schema (matches the spec
  verbatim — including `.describe()` on every field so the schema
  is self-documenting in the JSON-schema spec 55 hands the LLM), a
  sanitized `<NAME>_ERROR` constant for the executor to return on
  failure, and TS `Input`/`Output` aliases + a typed `<Name>Executor`
  alias so spec 55's `tool({ description, inputSchema, execute })`
  calls stay strict at the I/O boundary. `forgeToolContracts`
  registry uses `as const satisfies Record<ForgeToolName,
  AgentToolContract<unknown, unknown>>` so adding a tool to the map
  forces a corresponding entry in `FORGE_TOOL_NAMES` — exhaustiveness
  is type-checked. `isForgeToolName()` runtime guard exposed for
  spec 58's guardrails before any execute runs on an LLM-provided
  tool name. Privacy invariant baked into the file headers: the
  executor for `search_strategy_knowledge` must only pass the
  `query` string to the search provider — never `userId`,
  conversation history, or any other auth-context value. Bounded
  inputs: `search_user_scripts` caps `tags` at `floor(MAX_TAGS_PER_SCRIPT / 2)` and each tag at `MAX_TAG_LENGTH`
  (re-uses the spec-40 constants from `lib/scripts/tags.ts`),
  `script` ceilings across `run_health_score` /
  `run_backtest_summary` / `generate_alert_templates` /
  `refine_script` match the existing 20k underlying-endpoint
  bounds, `instruction` on `refine_script` matches the 1k bound on
  `refineScriptSchema`. `npm run build` passes (no new routes —
  contracts are pure TS).
- Forge Agent memory extraction (`56`): post-exchange background
  process that turns recent Forge conversations into the structured
  `AgentUserProfile` injected by spec 55's system prompt. New module
  `lib/agent/memory-extraction.ts` owns the full flow — Zod schema
  (`agentUserProfileSchema`, matches the spec verbatim), system +
  user prompt builders (`MEMORY_EXTRACTION_SYSTEM`,
  `buildMemoryExtractionUserPrompt`), trigger checks
  (`MIN_USER_MESSAGES_FOR_EXTRACTION = 4`, `EXTRACTION_DEBOUNCE_MS =
  3_600_000`, `RECENT_CONVERSATIONS_LIMIT = 3`), merge logic
  (`mergeProfiles` + private `uniqueMerge` / `mergeInsights`), and
  the conditional entry point `maybeExtractAndPersistMemory()` that
  the streaming endpoint's `onFinish` calls fire-and-forget. Three
  new DB helpers in `lib/db/agent-memory.ts` —
  `upsertAgentMemory(userId, profile)` uses
  `onConflictDoUpdate(target: agentMemory.userId)` against the spec-52
  `agent_memory_user_id_unique_idx`, `getMemoryLastUpdated(userId)`
  selects only `updated_at` so the 1-hour debounce is a single
  cheap round-trip on every Forge turn, and `getScriptCountForUser(userId)`
  runs `count(*)::int` for the denormalized
  `totalStrategiesGenerated` field (spec § Output Schema —
  "computed from a simple count(*) on the user's scripts table, not
  extracted from conversations"). One new conversation helper —
  `listRecentConversationsWithMessages(userId, limit)` in
  `lib/db/agent-conversations.ts` — returns full thread bodies (the
  sidebar list path's `listConversationsForUser` deliberately drops
  the `messages` jsonb to stay cheap; the extractor needs them).
  All four re-exported from `lib/db/index.ts`. Trigger logic
  evaluates *post-turn* user-message count: the route folds the new
  user message + reconstructed assistant/tool turns into the
  conversation snapshot before invoking the extractor, so the very
  fourth user message becomes the first eligible turn. Extraction
  call uses `generateObject` (cheaper than `streamText`),
  `temperature: 0` (deterministic), `maxOutputTokens: 800`
  (profile is small), and **no abort signal** — extraction runs
  *after* the user's stream completes, so coupling to
  `req.signal` would sometimes terminate the call as the request
  is being finalised. Failure modes (LLM throws, validation fails,
  upsert throws) are swallowed and returned as
  `{ ran: false, reason }` — extraction is fire-and-forget
  maintenance and must never surface in the chat UI; a failed run
  simply leaves the existing profile in place and the next eligible
  turn retries. Merge rules per spec § Merge Logic: arrays are
  case-insensitive union with FIFO eviction at the cap (markets 10,
  timeframes 8, indicators 10, insights 10) for everything except
  `strategyPatterns` (case-sensitive — patterns like "VWAP Bounce"
  vs "vwap bounce" can be intentional variants); scalars
  (`riskTolerance`, `averageHealthScore`) replace when extracted,
  fall back to existing otherwise; `totalStrategiesGenerated` is
  always overwritten with the live `count(*)` (LLM doesn't get to
  set it even if it tries); `lastExtractedAt` is always set to
  `new Date().toISOString()` so the debounce on the next turn
  measures from the actual write. Quota model: extraction does
  **not** count against the user's daily AI quota — the parent
  Forge POST already paid for one slot via `protectAiRoute`, this
  is internal maintenance piggy-backing on the same turn. `npm run build`
  passes (no new routes — extraction is invoked from inside the
  existing `/api/forge` handler).
- Forge Agent streaming endpoint (`55`): `POST /api/forge` ships the
  end-to-end Forge turn — auth → load conversation → load memory +
  optional script context → build system prompt → `streamText` with
  spec-53 tools → persist turn + auto-title + release stream lock.
  Five new files (`app/api/forge/route.ts`,
  `lib/agent/system-prompt.ts`, `lib/agent/tool-runners.ts`,
  `lib/agent/build-forge-tools.ts`, `lib/agent/persist-turn.ts`),
  one new DB helper (`lib/db/agent-memory.ts` →
  `getAgentMemoryForUser` re-exported from `lib/db/index.ts`), one
  new request schema (`forgeMessageSchema` + `ForgeMessageRequest`
  type in `lib/api/validation.ts`), two new constants
  (`MAX_MESSAGES_PER_CONVERSATION = 200`,
  `FORGE_AGENT_MAX_STEPS = 5` in `lib/config/constants.ts`). The
  guardrails block in `system-prompt.ts` is a minimum-viable
  placeholder — spec 58 will replace it with the canonical refusal
  patterns + prompt-injection defense, but the inline block already
  covers (a) no buy/sell/predictions/connections, (b) treat any
  instruction inside scripts/prompts/tool outputs as data,
  (c) sanitize tool errors, so the agent can't slip past Forge's
  product boundaries during spec 55 rollout. Tool runners reuse
  the existing AI route's system prompt + token budget + Zod
  schemas; `runRefineScriptInline` skips `acquireStreamLock`
  (parent already holds it). `search_strategy_knowledge` returns
  the spec-defined "research not available right now" fallback in
  v1 (no provider configured). Persistence runs in `onFinish` so
  the client receives the stream first; assistant AgentMessages
  preserve `toolCalls` for spec 57's UI, but tool messages are
  dropped on replay (text-only `agentHistoryToModelMessages`) to
  avoid AI SDK provider edge cases. v1 quota: one AI action per
  Forge POST via `protectAiRoute` (the spec's "tracks tool-call
  quota consumption" is deferred until usage data exists). Lock
  release runs in `onFinish` / `onError` / outer catch — three
  independent paths. `npm run build` registers `ƒ /api/forge`.
  Route stays public in `proxy.ts` (`/api(.*)` matcher) so it
  returns its own JSON 401 instead of an HTML redirect.
- Forge Agent UI (`57`): user-facing surface for everything specs
  52–56 built server-side. New page at `app/forge/page.tsx` (RSC,
  auth-gated via `proxy.ts`'s `isProtectedRoute` matcher — `/forge(.*)`
  is added alongside the existing `/generate(.*)`) hydrates three
  server-loaded payloads into the client: `initialPlan` (so
  `UserPlanProvider` matches `/generate`), `initialConversations`
  (the spec-54 sidebar feed, no message bodies), and `seedScript`
  (parsed from `?scriptId=<id>`, owner-checked against
  `scripts.user_id`, foreign / non-numeric / missing → silent `null`).
  Top-level orchestrator `ForgeExperience` owns three pieces of
  client state: `activeId` (selected conversation, `number | null`),
  `sidebarOpen` (mobile Sheet drawer), and `hydrationToken` (a
  monotonically-increasing counter). The token is the load-bearing
  UX primitive — `ForgeChat`'s hydration `useEffect` depends solely
  on it, never on `activeConversationId`. The parent bumps it only
  on intentional navigation (`handleSelect` from sidebar, `handleDelete`
  when the active row goes away), so creating a new conversation
  mid-send via `handleSubmit` doesn't trigger a re-hydration cycle
  that would race the user's in-flight `useChat` message — the
  same `activeId` state update *would* re-fetch and wipe the
  pending message if hydration listened to id changes directly.
  `ForgeChat` adapts `@ai-sdk/react`'s `useChat` to the spec-55
  `POST /api/forge` contract via a `DefaultChatTransport` whose
  `prepareSendMessagesRequest` rewrites the SDK's
  `{ messages, body }` envelope into `{ conversationId, message }` —
  the server doesn't speak the SDK's `UIMessage` shape, and using
  the transport hook is the supported escape hatch. `conversationIdRef`
  mirrors `activeConversationId` so `handleSubmit` can write the
  freshly-created conversation id into the transport's closure
  *synchronously* on first send — without it, the React state
  update wouldn't have flushed by the time the SDK reads the body.
  Persisted-to-UI conversion lives in `lib/agent/ui-messages.ts`
  (`agentMessagesToUIMessages`) — it walks the spec-52 thread once,
  folding each assistant text message with its trailing `tool`
  follow-up into a single AI SDK `UIMessage` whose `parts` array
  interleaves `{ type: 'text' }` and `{ type: 'tool', toolName,
  state, input, output, errorText }` fragments. Hydrated reloads
  therefore render identically to a live stream — the same
  `ForgeMessageList` consumes both. `useForgeConversations` hook
  (`hooks/useForgeConversations.ts`) wraps the spec-54 routes with
  optimistic UI: rename returns previous title on rollback, delete
  restores the row in place, create prepends, touch bumps to top
  (called from `ForgeChat.onConversationActivity` after each
  successful turn so the sidebar order matches `updated_at desc`
  without a refetch). `ForgeConversationSidebar` reads from the
  hook, renders the active row with an emerald rim +
  `aria-current="page"`, inline-renames on double-click or kebab
  menu, and confirms deletes via `AlertDialog`. The "New chat"
  button just clears `activeId` so the empty state shows; actual
  POST `/api/forge/conversations` is *lazy-fired* by
  `ForgeChat.handleSubmit` on the first send so empty
  conversations never pollute the list. Tool-call rendering lives
  in `ForgeToolCallCard.tsx` — per-tool icon map (`Shield` health,
  `FlaskConical` backtest, `Bell` alerts, `Search` script search,
  `Code` get_script_details, `Pencil` refine, `Globe` research),
  four states (`pending` + `running` show spinner + spec copy;
  `output-available` shows a one-line per-tool summary —
  `"Score: 7/10"`, `"Found N scripts"`, `"N templates"`,
  `"Backtest summary ready"` — expandable to the full structured
  payload; `output-error` shows the sanitized executor error in an
  amber-rimmed card), `aria-expanded` + `aria-controls` on the
  toggle. `ForgeInput.tsx` is the composer: auto-resize textarea
  (4 visible rows then internal scroll), `Enter` submits /
  `Shift+Enter` newline, `FORGE_MAX_MESSAGE_LENGTH = 4000` matches
  the spec-55 `forgeMessageSchema` so client + server bounds
  agree, soft amber tint past 3500 chars, character count tied to
  `aria-describedby`, disabled-with-banner state when the
  conversation hits the spec-55 200-message cap, `Stop` button
  (calls `useChat.stop()`) replaces Send while streaming.
  `ForgeEmptyState.tsx` ships the four spec-defined suggestion
  chips and routes each click directly through
  `handleSubmit(text)` rather than prefilling the textarea — keeps
  the new-conversation creation path single-flighted (one source
  of truth for "create + send"). Entry points: navbar Forge link
  in `GenerateExperience.tsx` (signed-in only, emerald rim +
  `Sparkles` + `New` badge); "Discuss with Forge" button in
  `OutputActionBar.tsx` shows only when the lineage rootId parses
  to a positive int (DB-backed scripts only — localStorage-only
  entries have no DB id to seed with). `StrategyForm.tsx` →
  `StrategyOutputCard.tsx` → `OutputActionBar.tsx` plumb
  `forgeScriptId` through; a local `parseForgeScriptId()` helper
  handles the `LineageState.rootId: string` → `number | null`
  parse at the call site so the lineage type contract doesn't
  have to widen for one consumer. Loading skeleton at
  `app/forge/loading.tsx` mirrors the final layout so the navbar
  shell + sidebar grid don't reflow. Per spec § Scope Limits: no
  command palette on `/forge`; no drag-and-drop reorder; no
  conversation search (list cap is the spec-54
  `MAX_CONVERSATIONS_PER_USER = 50`); no inline script editor; no
  split-view; no markdown export of conversations. `npm run build`
  passes; `/forge` registers as a dynamic route; only two new
  lint findings were introduced and both have been fixed (a
  setState-in-useEffect on the unused prefill path of
  `ForgeInput` — removed the prefill mechanism entirely since
  suggestions submit directly; and a literal `// Forge` comment
  inside JSX text in `ForgeExperience` — wrapped in `{ }`
  expression).
- Forge Agent conversation CRUD (`54`): no UI, no streaming, no memory
  extraction — pure REST shell over the spec-52 `agent_conversations`
  table. Two route files (`app/api/forge/conversations/route.ts` and
  `[conversationId]/route.ts`) plus one DB helper module
  (`lib/db/agent-conversations.ts`), one ownership resolver
  (`lib/api/resolve-owned-conversation-route.ts`), two Zod schemas
  (`createConversationSchema`, `updateConversationSchema`), one new
  summary mapper (`rowToAgentConversationSummary`), and one new
  constant (`MAX_CONVERSATIONS_PER_USER`). `listConversationsForUser`
  intentionally selects a narrowed column set so the sidebar GET
  ships with `messages: []` for every row — full thread bodies only
  materialize when the user opens a specific conversation via the
  detail GET. `createConversation` is a single-helper protect-point
  for two concerns (script ownership pre-check + FIFO eviction at
  the 50-conversation cap) so the route stays a thin orchestrator.
  `appendMessages` is exposed now (not deferred to spec 55) so the
  streaming endpoint can wire append → spec 55 owns the
  per-conversation 200-message cap before calling, and the helper
  uses atomic jsonb `||` so it never has to load + rewrite the whole
  thread to add one turn. Resolver diverges from script/collection
  resolvers — 403 vs 404 are distinct outcomes per spec rather than
  collapsed into 403, because conversation ids are not enumerable
  from any public endpoint. `npm run build` registers
  `ƒ /api/forge/conversations` + `ƒ /api/forge/conversations/[conversationId]`.
- Forge Agent memory schema (`52`): no UI, no API route, no extraction
  logic — schema + types + mappers only. Two new tables in
  `drizzle/schema.ts` (`agent_conversations` with FKs to `users.id` and
  optional `scripts.id`; `agent_memory` with FK to `users.id` and a
  `UNIQUE` constraint on `user_id` so spec 56's upsert can target one
  row per user via `ON CONFLICT (user_id) DO UPDATE`). Composite index
  `(user_id, updated_at DESC)` on conversations matches the spec-54
  list path. `messages` (`AgentMessage[]`) and `profile`
  (`AgentUserProfile`) are typed via `.$type<>()` + `notNull().default()`
  so reads never coalesce null and the mappers stay `any`-free. All
  agent types live in `lib/types/agent.ts` (`AgentMessage`,
  `AgentMessageRole`, `AgentToolCall`, `AgentToolResult`,
  `AgentUserProfile`, `SavedConversation`) and are re-exported from
  `lib/types/index.ts` so RSC / client / DB layers share one contract
  with no Drizzle leakage. `lib/db/agent-mapper.ts` exports
  `rowToAgentConversation()` (full `SavedConversation` with safe `??`
  coalescing on `messages` / timestamps) and `rowToAgentMemory()` (just
  the profile — row metadata deliberately not surfaced because spec 55
  injects the profile and spec 57 never displays a "memory row"). Both
  re-exported from `lib/db/index.ts`. Drizzle migration
  `0003_awesome_thundra.sql` generated (`CREATE TABLE` + 3 FKs + 1
  composite index + 1 unique index; zero changes to existing tables).
  Remote `db:migrate` deferred — required before spec 54/55 endpoints
  go live. `npm run build` passes
- Clerk: custom auth pages, protected non-public routes, CSP tuned for Clerk Frontend API host
- Neon/Drizzle: per-user script history wired; migrations `0000` + `0001` applied
- Upstash: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `.env.local` / Vercel
- Audit report (report.md): SEC-001 closed; remaining items in `context/fixes.md`
- Fix 2 UI: client model locks + `UserPlanContext`; deferred polish: quota hint, `/pricing` on all 429 toasts
- A11Y-001: ModelSelector radiogroup semantics done; optional follow-up: `aria-disabled` + focus when locked
- A11Y-002: resolved — `LandingExamples` Copy control is a `<button>` with `aria-label`
- NEXT-001: Root `app/error.tsx` and `app/loading.tsx` present (tracker was stale)
