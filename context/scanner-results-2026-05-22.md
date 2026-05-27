# Scanner Results — full — 2026-05-22

**Generated from**: `.agents/SCANNER.md`  
**Scope**: `full` (Security + Performance + Code Quality + Component Structure)  
**Date**: 2026-05-22  
**Project**: PineForge (Next.js 16 App Router + Clerk + Drizzle/Neon + Phase 5 features)

> Only actual, observable issues present in the checked code are reported.  
> Rules followed: no speculation on missing features, auth not implemented = not reported as vuln, `.env` files intentionally ignored, incomplete/stub features skipped unless active risk, zero noise.

---

## 🔴 Critical

- None.

## 🟠 High

- **File**: `components/strategy/StrategyForm.tsx` · **Lines**: 49–588 (the exported `StrategyForm` component function itself is ~540 lines)  
  **Issue**: Violates core standards ("Functions under 50 lines", "one job per component"). This single component owns form state, structured inputs, generation/refine orchestration, lineage/versioning, history load/save, prompt improver, command menu, and renders the input + output cards.  
  **Fix**: Extract state/logic into focused custom hooks (`useStrategyForm`, `useGenerationSession`, etc.) and/or smaller sub-components. (Already delegates some to `StrategyInputsCard`/`StrategyOutputCard`/`useScriptGeneration` — good start, but not enough.)  
  **Status**: ✅ Fixed (2026-05-22) — `StrategyForm.tsx` ~155 lines (orchestrator + JSX). Logic split: `hooks/strategy/useStrategyFormInputs.ts`, `useStrategyLineageSync.ts`, `useStrategyGenerationSession.ts`, `useStrategyOutputTabGuards.ts`, `useStrategyKeyboardShortcuts.ts`, `lib/scripts/strategy-compare.ts`. Public API (`StrategyFormHandle`, `forwardRef`) unchanged.
- **File**: `components/strategy/ScriptHistory.tsx` · **Lines**: 1–657 (main component + massive `HistoryEntryProps` + internal handlers)  
**Issue**: One file/component does search/filtering, per-entry rename/tag/collection/star/delete UI + state, collection chips, preview formatting, sheet integration, optimistic updates, etc. (Even with good extractions to `lib/scripts/history-filter.ts`, `history-list.ts`, `useCollections`, etc.)  
**Fix**: Split into `HistoryEntry`, `HistoryFilterChips`, dedicated hooks for the editing states, etc.  
**Status**: ✅ Fixed (2026-05-22) — `ScriptHistory.tsx` ~165 lines (orchestrator + Sheet). Logic split: `hooks/strategy/useHistoryEntryEditing.ts`, `useHistoryFilters.ts`; UI: `HistoryEntry.tsx`, `HistoryTagEditor.tsx`, `HistoryFilterBar.tsx`, `HistoryEntryList.tsx`. Public API unchanged.
- **File**: `components/strategy/ScriptOutput.tsx` · **Line**: 6 (`import { highlightPineScript } from '@/lib/ai/highlight'`)  
**Issue**: Static import of shiki (via `createHighlighter` + theme + lang) at module evaluation time. Shiki is heavy (WASM + grammar); this bloats the main client bundle for the entire `/generate` experience even when no script is present.  
**Fix**: Make it dynamic: `const mod = await import('@/lib/ai/highlight'); ... mod.highlightPineScript(...)` inside the `useEffect` (or a lazy singleton wrapper). The lazy init inside the module is already there — just don't pull the module until needed.  
**Status**: ✅ Fixed (2026-05-22) — static import removed; `useEffect` uses dynamic `import('@/lib/ai/highlight')` with existing `cancelled` guard. Shiki loads only when a settled non-editable script needs highlighting. Optional: `npm run build` to confirm chunk split on `/generate`.
- **File**: 5 route files (exact duplicate functions)  
**Issue**: Identical `parse*Id` helpers:  
  - `app/api/scripts/[scriptId]/route.ts:9`  
  - `app/api/scripts/[scriptId]/star/route.ts:9`  
  - `app/api/scripts/[scriptId]/tags/route.ts:10`  
  - `app/api/scripts/[scriptId]/collection/route.ts:9`  
  - `app/api/collections/[collectionId]/route.ts:15`  
  All do the same `Number.parseInt` + finite + `>=1` check.  
  **Fix**: One shared `lib/api/parse-route-id.ts` (or `parsePositiveInt`) + import everywhere. Trivial, zero-risk.  
  **Status**: ✅ Fixed (2026-05-22) — `lib/api/parse-route-id.ts` exports `parsePositiveInt`; also bundled with Low #3 into `resolveOwnedScriptRoute` / `resolveOwnedCollectionRoute` so all 5 routes share one helper.

## 🟡 Medium

**Summary**: 4 of 4 fixed (envelope, debug log, indexes generated, rate limiting). Drizzle indexes still need a live `npm run db:migrate` apply against Neon — the only Medium follow-up left is operational, not code.

- **File**: `drizzle/schema.ts` (and the `0000_mute_rattler.sql` migration)  
**Issue**: No explicit indexes on columns that every signed-in query path hits first: `scripts.user_id` (list + search + star + tag + collection mutations), `scripts.collection_id`, `scripts.is_starred`, `scripts.created_at` (ORDER BY). Foreign-key constraints exist but do not automatically create lookup indexes on the referencing side in Postgres.  
**Fix**: Add `.index('...').on(...)` (or `.index()` for simple) in the Drizzle table definitions, run `drizzle-kit generate`, apply migration. Low risk; queries are already capped at 50 rows.  
**Status**: ✅ Schema + migration generated (2026-05-22) — `drizzle/migrations/0002_groovy_scalphunter.sql` adds composite btree indexes on `(scripts.user_id, scripts.created_at DESC)`, `(scripts.user_id, scripts.is_starred)`, `(scripts.user_id, scripts.collection_id)`, and `(collections.user_id, collections.created_at DESC)`. ⚠️ **Pending**: run `npm run db:migrate` against Neon when ready (requires `DATABASE_URL_UNPOOLED`).
- **File**: API surface + client hooks (across `health-score`, `alert-templates`, `backtesting-summary`, `collections/*`, `scripts/*`, `generate`, etc.)  
**Issue**: Inconsistent response shapes. Structured AI routes return `{ success: boolean; data: T|null; error: string|null }`; CRUD routes use `{ collection: ... }`, `{ scripts: [...] }`, `{ ok: true }`, or plain `{ error: ... }`. Client code (`useHealthScore`, `useCollections`, `useScriptHistory`, etc.) has branching logic for each.  
**Fix**: Pick one canonical envelope (or rely purely on HTTP status + minimal body) and enforce it.  
**Status**: ✅ Fixed (2026-05-22) — `lib/api/envelope.ts` + `lib/api/parse-envelope.ts`; all `/api/*` JSON routes and client hooks migrated. Streaming success bodies unchanged; errors use envelope. Documented in `architecture.md` § Data Contracts.
- **File**: `app/generate/page.tsx:14`  
**Issue**: Leftover debug statement: `console.log('userId', userId);` in a production Server Component (executes on every `/generate` load for every visitor).  
**Fix**: Delete the line. (The plan lookup logic around it is correct and intentional.)  
**Status**: ✅ Fixed (2026-05-22) — line removed; surrounding blank lines tightened.
- **File**: Data routes (`/api/collections*`, `/api/scripts/*` except the AI ones)  
**Issue**: No rate limiting. Only `protectAiRoute` (which calls `checkRateLimit` + concurrency lock) protects generation/analysis. Authenticated users can hammer collections CRUD, tag mutations, search, etc.  
**Fix**: Either a lightweight per-user limiter on the data paths or extend the protection helper. (Not critical at current scale, but a clear gap.)  
**Status**: ✅ Fixed (2026-05-22) — `lib/api/protected-data-route.ts` (`protectDataRoute`) + `dataUserRatelimit` (120 req/min per user, plan-agnostic) + `checkDataRateLimit`. Wired into every non-AI route: `collections` GET/POST, `collections/[id]` PATCH/DELETE, `scripts` GET/POST, `scripts/[id]` PATCH/DELETE, `scripts/[id]/star`, `.../tags`, `.../collection`, `scripts/search`, `users/sync`. Ownership helpers refactored to accept the already-validated Clerk user id (no duplicate `auth()` call). 429 reasons surface via `messageFromApiErrorJson` in `useScriptHistory` mutations.

## 🔵 Low

- Several `components/ui/*` (e.g. `separator.tsx:1`, `label.tsx:1`, some shadcn wrappers) carry `"use client"` even when they contain no hooks, browser APIs, or event handlers. (Common shadcn artifact; radix primitives sometimes force it downstream.)  
**Status**: ✅ Fixed (2026-05-22) — removed from `separator.tsx` and `label.tsx`. Audited the rest: `input-group`, `dialog`, `sheet`, `tabs`, `tooltip`, `command`, `sonner`, `action-tooltip` legitimately need the directive (hooks or event handlers).
- `lib/ai/highlight.ts:36` hardcodes `langs: ['javascript']` for Pine v5 scripts (acceptable similarity but not optimal tokenization for Pine keywords).  
**Status**: ✅ Addressed (2026-05-22) — extracted to `PINE_SHIKI_LANG` constant with a comment explaining the JavaScript-as-approximation rationale and that a custom Pine TextMate grammar is deferred until maintenance cost is justified. Choice is now deliberate and visible.
- Minor duplication of "check session → get db userId → ownership select → 400/403/404/409" boilerplate across the narrow `[id]` routes (secure and correct, just verbose).  
**Status**: ✅ Fixed (2026-05-22) — extracted to `lib/api/resolve-owned-script-route.ts` (`resolveOwnedScriptRoute`) and `lib/api/resolve-owned-collection-route.ts` (`resolveOwnedCollectionRoute`). All 5 narrow routes (`scripts/[scriptId]/route.ts`, `.../star/route.ts`, `.../tags/route.ts`, `.../collection/route.ts`, `collections/[collectionId]/route.ts`) now use them. Ownership semantics unchanged.
- Error boundary files (`app/error.tsx`, `app/generate/error.tsx`) duplicate the `console.error` + custom panel pattern.  
**Status**: ✅ Fixed (2026-05-22) — extracted to `hooks/useErrorLogger.ts`. Wired into `app/error.tsx`, `app/generate/error.tsx`, and `app/global-error.tsx`. Future remote-logging (Sentry, Vercel Agent) plugs into the hook once.

## ✅ No issues found in:

- **Security** (all categories): No secrets/tokens/`NEXT_PUBLIC_*` sensitive values, no raw request bodies passed to LLMs, every body + query validated with Zod before any logic, every mutating route has `requireClerkSession` + `userId` scoping on the DB query itself (cross-user impossible by construction), no string-concat SQL, errors are always sanitized user messages (never stacks or raw LLM output), `dangerouslySetInnerHTML` only receives shiki output (which escapes source), no CSRF vectors (Clerk token auth), prompt injection surface is limited by structured `generateObject` + explicit system prompts telling the model its scope.
- **Performance**: No N+1 patterns (parallel `Promise.all` where two queries are needed, otherwise single parameterized queries), no blocking data in layout, no raw `<img>` (or `next/image` needed), streaming used for generation, shiki highlighter is at least lazily initialized inside the module.
- **Code quality**: Zero `any`, strict TS throughout, linter clean, no unused imports/dead code, no `TODO`/`FIXME` in source, all external input validated at the system boundary, `{ success, data, error }` pattern used where Server Actions would have been (but API routes are the correct choice here per architecture), normalize* helpers are the single source of truth for tags/collections.
- **Component structure**: Good existing splits (`*Card`, `*Panel`, `lib/scripts/*`, `lib/export/*`, `lib/db/*-mapper.ts`, custom hooks). The large files are the main remaining opportunities.

---

**After Scanning (per SCANNER.md)**

Do not automatically act on findings. This file is a permanent record of the audit.

For quick wins, the following low-risk items are candidates for `context/progress-tracker.md`:

- Remove stray `console.log` in `app/generate/page.tsx`
- Extract the duplicated `parse*Id` helpers into a shared utility
- Add recommended Drizzle indexes on `scripts` table

Only items that are low-risk, self-contained, and unrelated to unimplemented features should be added.

---

**Next scan recommendation**: Re-run after any of the High/Medium items above are addressed, or when Phase 6 Forge Agent code lands.

---

## Resolution Log — 2026-05-22 follow-up session

### What was fixed in this session

**All 🔵 Low items (4/4)**

- `"use client"` removed from `components/ui/separator.tsx` and `components/ui/label.tsx`.
- `lib/ai/highlight.ts` — `PINE_SHIKI_LANG` constant + rationale comment.
- `lib/api/resolve-owned-script-route.ts` + `lib/api/resolve-owned-collection-route.ts` — shared session→user→ownership helper used by all 5 narrow `[id]` routes.
- `hooks/useErrorLogger.ts` — shared `useEffect → console.error(error)` hook used by `app/error.tsx`, `app/generate/error.tsx`, `app/global-error.tsx`.

**High #4 (paired with Low #3)**

- `lib/api/parse-route-id.ts` — `parsePositiveInt(raw)`. Used by both `resolveOwned*Route` helpers; eliminates the 5-file duplicate.

**🟡 Medium quick wins (2/4)**

- `app/generate/page.tsx` — debug `console.log('userId', userId)` removed.
- `drizzle/schema.ts` — added composite btree indexes via `(table) => [...]` third-arg syntax:
  - `scripts_user_id_created_at_idx` on `(user_id, created_at DESC)` — covers `listScriptsForUser` ORDER BY + all user-only prefix filters.
  - `scripts_user_id_is_starred_idx` on `(user_id, is_starred)` — covers the starred union + `starred` search filter.
  - `scripts_user_id_collection_id_idx` on `(user_id, collection_id)` — covers collection search filter + post-delete unassign.
  - `collections_user_id_created_at_idx` on `(user_id, created_at DESC)` — covers `listCollectionsForUser`.
- Migration generated: `drizzle/migrations/0002_groovy_scalphunter.sql` (committed).

**API response envelope (🟡 Medium)**

- `lib/api/envelope.ts` — `apiSuccess`, `apiError`, `apiInvalidRequest`, `ApiEnvelope<T>`.
- `lib/api/parse-envelope.ts` — `parseApiSuccessEnvelope` for client hooks.
- `lib/api/message-from-api-error.ts` — reads `success: false` + `error` string first.
- All 16 routes under `app/api/` migrated; auth/ownership helpers (`requireClerkSession`, `resolveOwned*`, `jsonApiError`, `responseIfMissingXaiApiKey`) emit envelope errors.
- Client hooks: `useCollections`, `useScriptHistory`, `usePromptImprover` (AI hooks already matched envelope).
- `architecture.md` § API response envelope documents `data` payload shapes.

**Rate limiting on CRUD routes (🟡 Medium)**

- `lib/rate-limit/upstash.ts` — new `dataUserRatelimit` (120 req/min per user, sliding window, `pineforge:data` prefix). Plan-agnostic; data operations aren't a paid feature.
- `lib/rate-limit/check.ts` — new `checkDataRateLimit(userId)` (skips IP limit since data routes always require a Clerk session).
- `lib/api/protected-data-route.ts` — `protectDataRoute()` (session + per-user data limit; returns 401/429 via the envelope).
- `resolveOwnedScriptRoute` / `resolveOwnedCollectionRoute` refactored to take a pre-validated Clerk user id (no duplicate `auth()` per request); composes cleanly with `protectDataRoute`.
- All 9 non-AI route files now call `protectDataRoute()` before any DB read/write.
- `useScriptHistory` mutations (`rename`, `delete`, `star`, `tags`, `collection`, `addEntry`) read the envelope error and toast the server's 429 message instead of a generic fallback.
- AI routes continue to use `protectAiRoute` (its stricter daily AI bucket + IP limit is unchanged).

**Verification**

- `npx tsc --noEmit` — clean.
- `ReadLints` — no errors on any touched file.
- `npm run db:generate` — ran successfully, no schema drift.

**ScriptHistory split (🟠 High)**

- `hooks/strategy/useHistoryEntryEditing.ts` — rename / tag edit / star / collection pending state; wraps `useScriptHistory` mutators.
- `hooks/strategy/useHistoryFilters.ts` — search, tag, and collection filter state + `filteredEntries` / starred / unstarred derivation.
- `components/strategy/HistoryTagEditor.tsx`, `HistoryEntry.tsx`, `HistoryFilterBar.tsx`, `HistoryEntryList.tsx` — presentational subcomponents.
- `components/strategy/ScriptHistory.tsx` — thin Sheet orchestrator (~165 lines). Public API unchanged.

### ⚠️ Still pending action

- **Apply the index migration to Neon**: `npm run db:migrate` (requires `DATABASE_URL_UNPOOLED` in environment). The SQL is non-destructive (`CREATE INDEX` only, no locking surprises on tables this size) but is a live-DB write so it was not auto-run.

---

## Handoff to the next chat — Open scanner items

Pick up here in a fresh chat. Context to load: `context/scanner-results-2026-05-22.md`, `context/architecture.md`, `context/progress-tracker.md`.

### Recommended next session — API response envelope (🟡 Medium)

✅ **Done (2026-05-22)** — see Resolution Log below and `architecture.md` § API response envelope.

### Other open items (in priority order)

1. **Apply Drizzle migration `0002_groovy_scalphunter.sql`** (🟡 Medium · ops) — one shell command (`npm run db:migrate`) once `DATABASE_URL_UNPOOLED` is set. Last remaining Medium follow-up; code is in place.
2. **Split `ScriptHistory.tsx`** (🟠 High) — ✅ Done (2026-05-22). See Resolution Log below.

**Done this session**: Lazy shiki import in `ScriptOutput.tsx`; StrategyForm split; ScriptHistory split (`hooks/strategy/useHistoryEntryEditing.ts`, `useHistoryFilters.ts` + four subcomponents).

### Don't re-open

- Security clean (`✅ No issues found in: Security`).
- Performance clean except for the shiki bundle item (`✅ No N+1 patterns`).
- Code quality clean (`✅ Zero any, strict TS throughout, linter clean`).
- Component structure — all scanner-flagged large files split (StrategyForm + ScriptHistory).

---

## Resolution Log — 2026-05-23 follow-up

**Re-scan 🔵 Low — `hooks/useScriptHistory.ts` mutation duplication**

- `patchScriptOnApi` + `deleteScriptOnApi` — shared helpers for PATCH/DELETE on `/api/scripts/[id]` and sub-routes.
- Five mutation callbacks (`renameEntry`, `deleteEntry`, `toggleStarEntry`, `setTagsEntry`, `setCollectionEntry`) use helpers; behavior unchanged.
- `npx tsc --noEmit` — clean.

**Re-scan 🟡 Medium — `ScriptOutput.tsx` + `HealthScorePanel.tsx` structural splits**

- **ScriptOutput** (~103-line orchestrator): `script-output-styles.ts`, `ScriptOutputIdle`, `ScriptOutputSkeleton`, `ScriptOutputStreaming`, `ScriptOutputEditable`, `ScriptOutputHighlighted`, `ScriptOutputPlain`. Shiki `useEffect` + `validateScript` / `ValidationResult` exports unchanged.
- **HealthScorePanel** (~112-line orchestrator): `HealthScoreEmptyState`, `HealthScoreLoadingState`, `HealthScoreErrorState`, `HealthScoreResultView`, `HealthScoreScoreHeader`, `HealthScorePanelActions`. `useHealthScore` + phase routing + `onResultChange` unchanged.
- `npx tsc --noEmit` — clean.

**Re-scan 🟠 High — `hooks/useScriptHistory.ts` dual-store split**

- **Facade** (~31 lines): [hooks/useScriptHistory.ts](hooks/useScriptHistory.ts) — composes `useLocalScriptHistory` + `useApiScriptHistory(active)`; re-exports `buildSavedScript*`.
- **Stores**: [lib/scripts/local-history-store.ts](lib/scripts/local-history-store.ts) (~151), [lib/scripts/api-history-store.ts](lib/scripts/api-history-store.ts) (~175, includes `patchScriptOnApi` / `deleteScriptOnApi` / `migrateLocalEntriesToApi`), [lib/scripts/build-saved-script.ts](lib/scripts/build-saved-script.ts) (~69).
- **Hooks**: [hooks/strategy/useLocalScriptHistory.ts](hooks/strategy/useLocalScriptHistory.ts) (~90), [hooks/strategy/useApiScriptHistory.ts](hooks/strategy/useApiScriptHistory.ts) (~195, fetch + migration toast + API mutators).
- Public API unchanged (`entries`, 6 mutators, `refreshEntries`, builder imports from `@/hooks/useScriptHistory`). `STORAGE_KEY` no longer re-exported from facade (internal to local store).
- `npx tsc --noEmit` — clean.

**Still open (re-scan)**: ops migration apply (`0002_groovy_scalphunter.sql`) only.

---

## Re-scan — full — 2026-05-22 (afternoon)

**Scope**: `full`
**Trigger**: User-invoked re-scan after the morning fixes landed.
**Tree state**: Post StrategyForm + ScriptHistory splits, post envelope + rate-limiting + indexes generation.

> All findings below are **code quality / refactor**. Zero security findings, zero correctness bugs, zero performance regressions. Previous "✅ No issues found in: Security / Performance / Code quality" status still holds.

### 🔴 Critical
- None.

### 🟠 High

- **File**: `hooks/useScriptHistory.ts` · **Lines**: 336–635 (`useScriptHistory`), file total ~623
  **Issue**: Single hook owns localStorage + API dual stores, migration toast, six mutations (each with duplicated API vs local branches), and `useSyncExternalStore` wiring. Main export is ~300 lines — violates "functions under 50 lines" and is the main remaining maintainability hotspot after `ScriptHistory.tsx` was split.
  **Fix**: Extract `useLocalScriptHistory` / `useApiScriptHistory` and keep `useScriptHistory` as a thin facade. (Partial: `patchScriptOnApi` + `deleteScriptOnApi` — see 🔵 Low below.)
  **Status**: ✅ Fixed (2026-05-23) — facade ~31 lines; `useLocalScriptHistory` + `useApiScriptHistory`; stores in `lib/scripts/local-history-store.ts` + `api-history-store.ts`; builders in `lib/scripts/build-saved-script.ts`. Behavior and consumer imports unchanged.
  **Note**: New finding — not flagged in the morning scan. Always existed at this size; previous pass focused on `StrategyForm` + `ScriptHistory` and didn't open this file.

- **File**: `hooks/strategy/useStrategyGenerationSession.ts` · **Lines**: 36–303 (~267 in one hook)
  **Issue**: Generation/refine orchestration, tab guards, shortcuts, compare state, TradingView copy, and multiple reset keys live in one hook (created during the StrategyForm refactor but still monolithic).
  **Fix**: Split by concern: `useGenerationHandlers`, `useRefineSession`, `useOutputTabResets` (or similar), composed in a ~50-line coordinator.
  **Status**: ✅ Fixed (2026-05-23) — coordinator ~115 lines; `useStrategyOutputResets`, `useStrategyRefineSession`, `useStrategyOutputActions`, `useStrategyGenerationCore`. Tab guards composed in coordinator after core (needs `compare` + `generatedScript`). Webhook + command menu state remain in coordinator. Public API unchanged; `StrategyForm.tsx` untouched.
  **Note**: Echo of morning work — this file was *created* by the previous refactor when `StrategyForm.tsx` was split. It is a "split product that itself grew too big."

### 🟡 Medium

- **File**: `components/strategy/ScriptOutput.tsx` · **Lines**: 51–198 (~147 in `ScriptOutput`)
  **Issue**: Component still does idle / skeleton / streaming / highlighted / editable layouts in one function. Shiki is correctly dynamic-imported (lines 72–77) — bundle issue is resolved; size/structure remains.
  **Fix**: Extract `ScriptOutputIdle`, `ScriptOutputSkeleton`, `ScriptOutputHighlighted` presentational pieces.
  **Status**: ✅ Fixed (2026-05-23) — orchestrator ~103 lines; subcomponents under `components/strategy/ScriptOutput*.tsx` + `script-output-styles.ts`. Public API (`ScriptOutput`, `validateScript`, `ValidationResult`) unchanged.
  **Note**: Different dimension from the morning finding on this file (which was the shiki bundle, now fixed). Structural size was not previously flagged.

- **File**: `components/strategy/HealthScorePanel.tsx` · **Lines**: ~1–273
  **Issue**: Panel + score UI + run/reset + refine prefill + export callback in one client component (~230+ lines).
  **Fix**: Extract score display and action bar; keep panel as orchestrator only.
  **Status**: ✅ Fixed (2026-05-23) — orchestrator ~112 lines; `HealthScoreScoreHeader`, `HealthScorePanelActions`, phase states, `HealthScoreResultView` (sections colocated). Props and export unchanged.
  **Note**: New finding — not in the morning scan.

- **File**: `drizzle/migrations/0002_groovy_scalphunter.sql` · **Ops**
  **Issue**: Indexes are defined in `drizzle/schema.ts` and migration is generated, but applying to Neon is still a manual step (`npm run db:migrate` with `DATABASE_URL_UNPOOLED`).
  **Fix**: Run migration in the target environment when ready.
  **Note**: Carryover from morning scan — explicitly listed as "⚠️ Still pending action."

### 🔵 Low

- **File**: `hooks/useScriptHistory.ts` · **Lines**: 439–623 (mutation callbacks)
  **Issue**: Five API mutation callbacks repeat the same `fetch → readMutationErrorMessage → parseApiSuccessEnvelope → setApiEntries` pattern with only URL/body differing.
  **Fix**: One `mutateScript(id, path, body, fallbackMessage)` helper — low risk, same file or `lib/scripts/history-api.ts`.
  **Status**: ✅ Fixed (2026-05-23) — `patchScriptOnApi` + `deleteScriptOnApi` (now in `lib/scripts/api-history-store.ts` after High split); mutation callbacks collapsed. Toast strings, `capScriptHistory` usage, and 429 envelope messages unchanged.
  **Note**: Collapsed into the High `useScriptHistory` dual-store split (also ✅ 2026-05-23).

### ✅ No issues found in (re-confirmed)

- **Security**: No hardcoded secrets; only `NEXT_PUBLIC_CLERK_*` on the client; all 16 API routes use `protectAiRoute` or `protectDataRoute`; bodies/queries validated with Zod (`safeParse` confirmed across every route); Drizzle queries parameterized (including `search-user-scripts` LIKE escaping); dev-only `console.warn` in AI routes (no stack traces in API JSON); `dangerouslySetInnerHTML` limited to shiki HTML.
- **Performance**: `Promise.all` for parallel script lists (`lib/db/list-user-scripts.ts:14`); composite indexes in schema; shiki lazy-loaded via dynamic import; `app/generate/loading.tsx` present; no raw `<img>` usage; no N+1 patterns.
- **Code quality**: No `any` in source; no `TODO`/`FIXME` in TS; no stray `console.log` in `app/`; API envelope consistent (`lib/api/envelope.ts`); `StrategyForm.tsx` (~153) and `ScriptHistory.tsx` (~167) are thin orchestrators after refactor; shared helpers (`parsePositiveInt`, `resolveOwned*Route`, `useErrorLogger`) eliminate prior duplication.
- **Component structure**: Morning-flagged large files (StrategyForm, ScriptHistory) confirmed split.

### Verdict

All re-scan findings are **safe to defer**. None block Phase 6 (Forge Agent). The pattern (*"you fixed the big file, now the file you extracted is the new big file"*) is normal for an iterative refactor; it ends when extracted pieces are small enough that further splitting buys nothing.

~~`useStrategyGenerationSession.ts` split~~ — ✅ fixed (2026-05-23); four sub-hooks + thin coordinator; see Resolution Log below.

~~`useScriptHistory.ts` dual-store split~~ — ✅ fixed (2026-05-23); facade ~31 lines, stores/hooks split as above.

---

## Resolution Log — 2026-05-23 (continued)

**Re-scan 🟠 High — `hooks/strategy/useStrategyGenerationSession.ts` split**

- **Coordinator** (~115 lines): [hooks/strategy/useStrategyGenerationSession.ts](hooks/strategy/useStrategyGenerationSession.ts) — composes sub-hooks, owns `outputRef`, webhook panel state, command menu state; calls `useStrategyOutputTabGuards` and `useStrategyKeyboardShortcuts` with values from core/actions.
- **Sub-hooks**: [hooks/strategy/useStrategyOutputResets.ts](hooks/strategy/useStrategyOutputResets.ts) (~40), [hooks/strategy/useStrategyRefineSession.ts](hooks/strategy/useStrategyRefineSession.ts) (~30), [hooks/strategy/useStrategyOutputActions.ts](hooks/strategy/useStrategyOutputActions.ts) (~55), [hooks/strategy/useStrategyGenerationCore.ts](hooks/strategy/useStrategyGenerationCore.ts) (~215, `useScriptGeneration` + handlers + compare/validation).
- Public API unchanged (`StrategyForm.tsx` consumer, same return keys). `onGenerationComplete` / `onRefineComplete` IIFE pattern preserved in core.
- `npx tsc --noEmit` — clean.

**Still open (re-scan)**: ops migration apply (`0002_groovy_scalphunter.sql`) only.

---

## Scan Results — full — 2026-05-26

**Scope**: `full`

**Trigger**: Explicit user request via @context/SCANNER.md

**Context**: Post Phase 5 value features + early Phase 6 Forge Agent work (conversations CRUD, memory schema + 0003 migration, tool runners). Many prior refactors from 2026-05-22/23 logs (StrategyForm split, ScriptHistory split, useScriptHistory dual-store, useStrategyGenerationSession split, HealthScorePanel/ScriptOutput subcomponents) are in place. Fresh lint (`npm run lint`) + static inspection + tsc + targeted greps/reads performed. No code changes made during this scan.

### 🔴 Critical
- None.

### 🟠 High

- **File**: `components/strategy/StrategyOutputCard.tsx` · **Lines**: 1–581 (full file)
  **Issue**: 581-line client component owns multi-tab output orchestration (Script / Breakdown / Health Score / Backtest Summary / Alert Templates / Explain Script / Compare), 10+ pieces of cross-panel state (export results, successPulse, panel reset keys), generation lifecycle effects, markdown serialization + download coordination, and all Phase 5 AI panel integrations. Does multiple jobs despite existing sub-panels.
  **Fix**: Reduce to thin layout + tab host; extract per-panel state/effects into dedicated hooks (e.g. useHealthExport, useBacktestExport) or further sub-orchestrators. (Grew significantly since prior ~103-line post-split state in 05-23 logs.)
  **Status**: ⏸ Deferred (2026-05-27) — explicitly held back to a future session by user request. File size now ~592 lines after the effect-pattern refactors (the prev-tracker state pairs added a few lines); split still warranted before Phase 6 Forge handoff lands more panels.

### 🟡 Medium

- **Pattern**: `react-hooks/set-state-in-effect` (19 errors)
  **Files** (selected): `components/strategy/StrategyForm.tsx:98`, `StrategyOutputCard.tsx:207,284`, `RefineChat.tsx:36,42`, `ExplainScriptPanel.tsx:92`, `components/forge/ForgeToolCallCard.tsx:68,82`, `components/landing/LandingHeroTerminal.tsx:71`, `LandingScrollIndicator.tsx:22`, `RevealOnScroll.tsx:20`, `hooks/useShortcutLabel.ts:16` (and 9 more)
  **Issue**: Synchronous `setState(...)` calls directly inside `useEffect` callback bodies (resets on dep changes, media-query inits, prefill handlers, pulse timers, effect-driven clears). React anti-pattern per the rule; risks cascading renders.
  **Fix**: Refactor to lazy initializers, refs for one-time flags, or derived state where applicable. (Full list from `npm run lint`.)
  **Status**: ✅ Fixed (2026-05-27) — all 11 spots refactored idiomatically using the React-docs "Adjusting state when a prop changes" pattern (`setState` during render gated by tracked-prev state). Two new shared hooks: `hooks/usePrefersReducedMotion.ts` and rewritten `hooks/useShortcutLabel.ts` (both `useSyncExternalStore`). See Resolution Log — 2026-05-27 below for per-file detail. No `eslint-disable` escape hatch used.

- **File**: `app/global-error.tsx` · **Line**: 72
  **Issue**: `<a href="/">` for internal "Back to home" navigation (instead of Next `<Link>`).
  **Fix**: Import `Link from 'next/link'` and use `<Link href="/">`.
  **Status**: ✅ Fixed (2026-05-27) — `next/link` import added; `<a>` replaced with `<Link>`.

- **File**: `components/strategy/AlertTemplateCard.tsx` · **Line**: 9
  **Issue**: `pfOutputBody` imported from `@/lib/ui/terminal-texture` but never used in the component body (dead import).
  **Fix**: Remove the unused identifier from the import destructuring.
  **Status**: ✅ Fixed (2026-05-27) — identifier removed from the import block.

### 🔵 Low

- **Pattern**: `react/jsx-no-comment-textnodes` (5+ occurrences)
  **Files**: `app/generate/loading.tsx:48,91`, `app/loading.tsx:30`, `app/global-error.tsx:52`, `components/error/GeneratorFaultPanel.tsx:38`, `components/forge/ForgeConversationSidebar.tsx:127`
  **Issue**: JSX text children contain `// ` sequences (intentional terminal-chrome labels in skeletons, e.g. `// GENERATOR :: SYNCING`). ESLint rule treats them as misplaced comment syntax in children.
  **Fix**: Acceptable for visual design (or scope the rule / render labels differently); not a runtime bug.
  **Status**: ✅ Fixed (2026-05-27) — all 6 sites wrapped in `{'// LABEL'}` string-literal expression children. Visual output unchanged; ESLint rule satisfied without disabling.

### ✅ No issues found in: Security, Performance (data + bundle), core Code quality invariants

- **Security** (re-confirmed clean):
  - No hardcoded secrets, API keys, or tokens anywhere in `app/`, `components/`, `lib/`, `hooks/`.
  - `NEXT_PUBLIC_*` usage limited to Clerk publishable key (in `next.config.ts` only; required for client).
  - All 19+ API routes protected: AI routes via `protectAiRoute` (Clerk + rate limit + plan), data routes via `protectDataRoute` + ownership resolvers (`resolveOwnedScriptRoute`, `resolveOwnedCollectionRoute`, `resolveOwnedConversationRoute`).
  - Every mutating handler does `await req.json().catch(() => null)` + `Schema.safeParse(body)` before any logic (Zod in `lib/api/validation.ts` and feature schemas).
  - Drizzle queries use parameterized builders + explicit `escapeLikePattern` in `search-user-scripts.ts`; no string concat or raw sql interpolation of user data.
  - Error responses always go through `apiError` / `apiInvalidRequest` (sanitized strings only, never `error.stack`, never raw LLM output, never internal ids). Dev-only `console.warn` gated behind `NODE_ENV === 'development'`.
  - `dangerouslySetInnerHTML` used only for trusted shiki-generated HTML in `ScriptOutputHighlighted.tsx`.

- **Performance** (clean on core dimensions):
  - No N+1 query patterns (hot path `listScriptsForUser` uses `Promise.all` for recent + starred, then in-memory Map merge; search and agent queries are single statements).
  - Composite indexes present in `drizzle/schema.ts` for all frequent filters/sorts (scripts: user+createdAt, user+isStarred, user+collectionId; agent_conversations: user+updatedAt).
  - Shiki highlighter lazy-loaded (dynamic import of `@/lib/ai/highlight` inside `ScriptOutput.tsx` useEffect; singleton promise cache).
  - `loading.tsx` exists at `/`, `/generate`, `/forge`.
  - No raw `<img>` elements (lucide icons + CSS only).
  - `'use client'` directives present only on files with hooks, event handlers, or browser APIs (media queries, scroll listeners, local state). No obvious dead client markers on pure presentational leaves.

- **Code quality** (invariants hold):
  - Zero `any` types in application source (confirmed via grep + `npx tsc --noEmit` clean).
  - No `TODO` / `FIXME` / `HACK` markers in `app/`, `lib/`, `components/`, `hooks/`.
  - Consistent `{ success, data, error }` envelope on every JSON API response via `lib/api/envelope.ts`.
  - Error handling uniform (no route throws raw errors; all caught and mapped to `apiError`).
  - Only one low-severity unused import (flagged above); no other dead code surfaced by lint beyond the effect/JSX rules.

- **Component structure**:
  - Prior hotspots (useScriptHistory facade ~31 lines, StrategyForm orchestrator, ScriptHistory, HealthScorePanel ~112-line orchestrator, ScriptOutput ~103-line orchestrator) remain addressed from 05-23 work.
  - New growth observed in `StrategyOutputCard` (Phase 5 panel accumulation) and Forge modules (`ForgeChat.tsx` 346 lines, `useForgeConversations.ts` 210 lines, `memory-extraction.ts` 491 lines, `tool-runners.ts` 280 lines). Agent modules are single-purpose (tool calling / memory) but large due to LLM orchestration complexity.

**Verdict**: 19 lint errors + 1 warning now present (was clean on 05-23 per logs). Primary structural concern is `StrategyOutputCard.tsx` re-growth. React effect setState pattern is the most common quality smell. **Zero security, zero correctness, zero data-layer issues.** Ops migration apply (0002 + 0003) carries forward from prior scan.

> **Update 2026-05-27**: All Medium + Low items above resolved (`npm run lint` and `npx tsc --noEmit` clean). Only the 🟠 High `StrategyOutputCard.tsx` split + the two ops migrations remain open. See Resolution Log — 2026-05-27 below.

All findings above are **directly evidenced** by:
- `npm run lint` (full output captured)
- `npx tsc --noEmit` (clean)
- Grep + read_file on every security/performance rule in SCANNER.md
- Line counts and import analysis on large files

---

## Resolution Log — 2026-05-26

**New scan findings recorded above. Per explicit instruction: no code generation, no refactoring performed or proposed in this step.**

**Reproduce locally**:
```bash
npm run lint
npx tsc --noEmit
# Then manual review of flagged files + SCANNER categories via grep/read
```

**Still open (carry-over + new)**:
- ~~Apply Drizzle migrations `0002_groovy_scalphunter.sql` + `0003_awesome_thundra.sql`~~ + `0004_nervous_morg.sql` — ✅ Applied on Neon 2026-05-27 (per user). Conversation SELECTs in `lib/db/agent-conversations.ts` now include `type`; defensive insert fallback + `as any` casts in `lib/db/agent-mapper.ts` removed.
- ~~Address the 19 `set-state-in-effect` + 5 `jsx-no-comment-textnodes` + dead import + `<a>` vs `<Link>` to restore lint-clean state.~~ — ✅ Done 2026-05-27. See Resolution Log — 2026-05-27 below.
- 🟠 `StrategyOutputCard.tsx` split — explicitly deferred 2026-05-27 (user-requested separate session/task).
- Monitor `StrategyOutputCard.tsx` size as more workflow features (Forge handoff, comparison reports, etc.) land.

---

## Resolution Log — 2026-05-27

**Scope**: Address all 🟡 Medium + 🔵 Low findings from the 2026-05-26 scan. The 🟠 High (`StrategyOutputCard.tsx` split) was explicitly held back for a separate session per user request.

**Verification** (post-fix):
- `npm run lint` — clean (was 19 errors + 1 warning).
- `npx tsc --noEmit` — clean.
- `npm run dev` — HMR recompiled through every change with no errors.

### 🟡 Medium — fixed

**Dead import (`AlertTemplateCard.tsx:9`)**
- Removed `pfOutputBody` from the `@/lib/ui/terminal-texture` import block.

**`<a>` → `<Link>` (`app/global-error.tsx:72`)**
- Added `import Link from 'next/link'`; replaced `<a href="/">` with `<Link href="/">` ("Back to home" CTA on the root layout fault screen). Works inside `global-error.tsx`'s own `<html>/<body>` shell.

**`react-hooks/set-state-in-effect` (11 sites, 9 files)** — refactored idiomatically per React docs ("Adjusting state when a prop changes" / `useSyncExternalStore` where applicable). No `eslint-disable` used.

New shared primitives:
- [hooks/usePrefersReducedMotion.ts](hooks/usePrefersReducedMotion.ts) — `useSyncExternalStore`-based reader for `(prefers-reduced-motion: reduce)`. Used by all three landing components below.
- [hooks/useShortcutLabel.ts](hooks/useShortcutLabel.ts) — rewritten with `useSyncExternalStore` (no effect; hydration-safe `SSR_MOD_KEY_LABEL` snapshot, `getModKeyLabel()` client snapshot).

Per-file refactors:

| File | Approach |
|---|---|
| `components/landing/LandingHeroTerminal.tsx` | `usePrefersReducedMotion()` + `intersected` from observer callback (callback-side `setState` is not flagged); `visible = reduceMotion \|\| intersected`. Observer now restarts if reduced-motion toggles mid-session. |
| `components/landing/RevealOnScroll.tsx` | same pattern as above; observer disconnects after first intersection. |
| `components/landing/LandingScrollIndicator.tsx` | `usePrefersReducedMotion()` + `useSyncExternalStore` for scroll-threshold boolean (`window.scrollY <= 200`). |
| `components/strategy/RefineChat.tsx` | `prevResetKey` / `prevPrefillNonce` tracked state; setStates moved into render-time conditional. Focus/scroll moved to a narrow effect that now properly clears its 0ms timer on unmount. |
| `components/forge/ForgeToolCallCard.tsx` | dropped `wasLoadingRef`; replaced with `prevIsLoading` state-tracked transition detection. Pulse-cleanup `setTimeout` lives in a dedicated effect keyed on `justCompleted`. |
| `components/strategy/ExplainScriptPanel.tsx` | removed dead `setText('')` + `setPhase('idle')` in the empty-script branch — render early-returns at line 191 before reading either; added `inFlightRef.abort()` for safety so stream is released when script clears. |
| `components/strategy/StrategyOutputCard.tsx` | composite `resetKeysComposite` + `prevResetKeys` state fans out the 6 panel-reset setStates during render; `wasGeneratingRef` replaced with `prevIsGenerating` state for the success-pulse transition. `useRef` dropped from imports. |
| `components/strategy/StrategyForm.tsx` | template prefill split: `templateLoadResult` derived via `useMemo` (none / missing / denied / ok); banner dismissal switched to `dismissedTemplateId` state. The remaining `useEffect` performs side effects only (toast + cross-hook setters) — no local `setState` in its body. |

### 🔵 Low — fixed

**`react/jsx-no-comment-textnodes` (6 sites)** — every literal `// LABEL` JSX text child wrapped in `{'…'}` expression child. Visual output unchanged; rule satisfied without scope edits. Sites:
- `app/generate/loading.tsx` (2× — `SYNCING`, `STANDBY`)
- `app/loading.tsx` (1× — `ESTABLISHING CONNECTION`)
- `app/global-error.tsx` (1× — `ROOT LAYOUT FAULT`)
- `components/error/GeneratorFaultPanel.tsx` (1× — `// GENERATOR :: ${variant}`, the dynamic suffix already lived inside `{…}`)
- `components/forge/ForgeConversationSidebar.tsx` (1× — `no sessions yet`)

### Incidental improvements (fall-out from refactors, no behavior regressions)

- `RefineChat`'s 0ms focus timer now has cleanup on unmount (previously leaked).
- `ExplainScriptPanel` now aborts the in-flight `/api/explain-script` stream when the script clears (previously dangled until natural completion or next mount).
- `LandingHeroTerminal` / `RevealOnScroll` now react to runtime reduced-motion changes (previously stuck on the mount value because the effect had `[]` deps).

### Still open after this session

1. **🟠 `StrategyOutputCard.tsx` split** — explicitly deferred. File is now ~592 lines after the effect refactors (added ~10 lines of tracked-prev state). Split should still happen before Phase 6 Forge handoff lands more panels.
2. **Ops migration apply (`0002_groovy_scalphunter.sql` + `0003_awesome_thundra.sql`)** — unchanged. `npm run db:migrate` with `DATABASE_URL_UNPOOLED`.

### Don't re-open

- Security clean (no findings 2026-05-26, no regression after refactor — changes were UI/hook-internal only).
- Performance clean (no new effects, no new client bundles, two fewer leaked timers).
- Code quality: lint + tsc both clean as of 2026-05-27 09:46 (UTC+3).

