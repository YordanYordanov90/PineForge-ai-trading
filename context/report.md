# Scan Results — full — 2026-07-07

> **Verification (2026-07-07, second pass)**: All 18 findings below re-checked against the current code — every fix is correctly implemented. `tsc --noEmit`, `eslint --quiet`, and `next build` all pass clean. The CSP fix went further than suggested: the header moved from `next.config.ts` to Clerk's strict nonce-based CSP in `proxy.ts` (`lib/security/csp-directives.ts`), removing `unsafe-inline`/`unsafe-eval` entirely. Two minor follow-ups from reviewing the new code:
> - `hooks/strategy/useScriptComparisonSelection.ts:63-70` — `const json = await res.json()` is implicitly `any` and `json.error` goes straight to `toast.error`; convention elsewhere is `const json: unknown` + `messageFromApiErrorJson()`. (Low)
> - `lib/scripts/stream-script-response.ts:16-24` and `hooks/strategy/useExplainScriptStream.ts:151-158` — the reader loops never call `decoder.decode()` (no args) after the loop to flush, so a multi-byte UTF-8 character split across the final chunk would be dropped. Pre-existing behavior carried over in the refactor; ASCII-heavy Pine output makes it unlikely in practice. (Low)

## 🔴 Critical
None found.

## 🟠 High

- ✅ **File**: `app/api/comparison-reports/route.ts` · **Line**: 48-51
  **Issue**: The `POST` catch block returns `err.message` directly to the client (`apiError(message, 502)`). The try block wraps a Drizzle DB write and an xAI `generateObject` call, so a failure can leak driver/SQL internals (column/constraint names, query fragments) to the caller — every sibling AI route returns a fixed generic message instead.
  **Fix**: Log the real error server-side (`devWarn`) and return a fixed generic string, matching the pattern used in the other 22 routes.

- ✅ **File**: `components/forge/ForgeConversationSidebar.tsx` · **Line**: 1-458
  **Issue**: 458-line file mixes the sidebar list, inline rename editing, a dropdown action menu, and a delete-confirmation dialog (204-234) in one module; `ConversationButton`/`ConversationRenameRow`/`ConversationActions` are already defined in-file (239-443) but never split out.
  **Fix**: Extract the delete dialog into `components/forge/DeleteConversationDialog.tsx` and move the three sub-components into their own files under `components/forge/`.

- ✅ **File**: `components/strategy/ScriptHistory.tsx` · **Line**: 1-391 (keyboard nav 169-243, compare-select 90-141, inline fetch 122-135)
  **Issue**: Mixes sheet UI, a custom keyboard-navigation engine, multi-select-for-comparison state, and a raw `fetch('/api/comparison-reports', …)` call inline — even though this same file already delegates comparable logic to `useHistoryFilters`/`useHistoryEntryEditing`.
  **Fix**: Extract the keyboard-nav effect into `hooks/strategy/useHistoryKeyboardNav.ts` and the compare-selection + fetch logic into `hooks/strategy/useScriptComparisonSelection.ts`.

- ✅ **File**: `components/strategy/ExplainScriptPanel.tsx` · **Line**: 57-253
  **Issue**: A full state machine (phase, cache `Map` ref, `AbortController` ref, streamed-fetch reader loop against `/api/explain-script`) is inlined ahead of the render with no extraction, despite the established `hooks/strategy/` convention for this exact pattern.
  **Fix**: Extract into `hooks/strategy/useExplainScriptStream.ts`; leave the component to just render `phase`/`text`.

- ✅ **File**: `hooks/useScriptGeneration.ts` · **Line**: 48-169 (`generate`, ~120 lines) and 171-274 (`refine`, ~103 lines)
  **Issue**: Both functions are well over the 50-line convention and duplicate the same logic three times over: the reader/decoder streaming loop (127-139 vs. 230-242), the HTTP-status-to-toast mapping (76-117 vs. 201-220), and the "parse assumptions block on finish" step (153-165 vs. 259-269).
  **Fix**: Extract a shared `streamScriptResponse(res, { onChunk })` helper and a shared `mapGenerationErrorStatus(status)` helper used by both `generate` and `refine`.

## 🟡 Medium

- ✅ **File**: `lib/export/snapshot-renderers.ts` · **Line**: 163-170 (`renderBacktest`)
  **Issue**: `b.markdown` (free-form LLM output, up to 8000 chars) is interpolated into the exported HTML with only a `\n → <br>` replacement — no `escapeHtml()`, unlike every other field in this file (`renderHealth`, title above it on line 167). This markdown is model output driven by attacker-influenceable prompt/script input to `/api/backtesting-summary`, and lands in a self-contained `.html` snapshot the user downloads and opens/shares (`actions/export-snapshot.ts`). A model coaxed into emitting `<script>`/`<img onerror>` text would have it execute when the file is opened.
  **Fix**: Run `b.markdown` (or each underlying bullet) through `escapeHtml()` before interpolation, same as the other renderers in this file.

- ✅ **File**: `app/(app)/forge/page.tsx` · **Line**: 46-51
  **Issue**: `listConversationsForUser(dbUserId)` and `loadSeedScript(dbUserId, scriptIdParam)` are independent DB reads but are awaited sequentially rather than via `Promise.all`, adding a full extra round-trip to every `/forge` load.
  **Fix**: Await `searchParams` alongside the existing `Promise.all` at line 41, then run both reads through `Promise.all`.

- ✅ **File**: `app/(app)/progress/page.tsx` · **Line**: whole file
  **Issue**: No sibling `loading.tsx` exists for this route (unlike `/forge` and `/generate`), and `getProgressStats` does a DB read plus in-memory aggregation with no `Suspense` boundary, so navigation blocks on a blank screen.
  **Fix**: Add `app/(app)/progress/loading.tsx` or wrap the dashboard in `<Suspense>`.

- ✅ **File**: `components/progress/ProgressDashboard.tsx`, `HealthScoreTrendChart.tsx`, `RiskThemesPanel.tsx`, `RefinementDepthPanel.tsx`, `MemoryInsightsPanel.tsx` · **Line**: 1 (directive)
  **Issue**: All five are pure presentational components (no `useState`/`useEffect`/handlers) but carry `'use client'`, forcing the entire progress dashboard subtree into client JS/hydration unnecessarily.
  **Fix**: Drop `'use client'` and render as Server Components, passing data straight from `progress/page.tsx`.

- ✅ **File**: `components/forge/ForgeAssistantMarkdown.tsx` · **Line**: 1-5
  **Issue**: `react-markdown` + `remark-gfm` are imported eagerly at module scope and pulled into the initial `/forge` bundle via `ForgeExperience → ForgeChat → ForgeMessageList → ForgeAssistantMarkdown`, with no lazy-loading anywhere in that chain.
  **Fix**: Load it via `next/dynamic(() => import(...), { ssr: false })` from `ForgeMessageList.tsx` so the markdown parser loads only when a message needs rendering.

- ✅ **File**: `app/api/generate-variants/route.ts` · **Line**: 15-103 (POST, ~89 lines)
  **Issue**: Mixes auth, entitlement checks, a manual extra-quota-deduction loop, prompt normalization, and parallel generation in a single function.
  **Fix**: Extract the quota-deduction loop (35-48) into a small helper.

- ✅ **File**: `app/api/generate/route.ts` · **Line**: 21-103 (POST, ~83 lines)
  **Issue**: Mixes validation, template-entitlement gating, lock handling, and inline prompt-context building (70-80) that duplicates the builder-function pattern used elsewhere (e.g. `buildHealthScoreUserPrompt`).
  **Fix**: Extract a `buildGenerateContextBlock()` helper.

- ✅ **File**: `app/api/health-score/route.ts` · **Line**: 60-132 (POST, ~73 lines)
  **Issue**: Health-score generation and the "persist to `scripts.metadata`" side effect (103-126) are two separate concerns handled in one function.
  **Fix**: Extract `persistHealthScoreIfOwned(clerkId, scriptId, result)`.

- ✅ **File**: `components/forge/ForgeChat.tsx` · **Line**: 185-209
  **Issue**: An inline `useEffect` fetches `/api/scripts` to resolve a script name, duplicating the fetch-in-hook pattern this same file otherwise follows (`useForgeChatTransport`, `useForgeConversationHydration`, `useForgeChatScroll`, `useForgeResearchHandoff`).
  **Fix**: Move this effect into `useForgeConversationHydration` or a new `hooks/forge/useActiveScriptName.ts`.

- ✅ **File**: `components/strategy/GeneratorCommandMenu.tsx` · **Line**: 188-287
  **Issue**: The "View" `CommandGroup` repeats an identical `CommandItem` block seven times, differing only in tab id and label.
  **Fix**: Derive from a `const TAB_COMMANDS = [...]` array and `.map()` over it.

## 🔵 Low

- ✅ **File**: `next.config.ts` · **Line**: 20
  **Issue**: CSP `script-src` includes `'unsafe-inline' 'unsafe-eval'`. Not a standalone bug (commonly required for Clerk/Next.js), but it means CSP provides no mitigation if the `renderBacktest` XSS gap above (or any future unescaped-output bug) is triggered.
  **Fix**: Move to a nonce-based CSP once feasible, as defense-in-depth.

- ✅ **File**: `components/strategy/StrategyInputsCard.tsx:150-159` and `components/strategy/AlertTemplateCard.tsx:66-73`
  **Issue**: Near-identical pill/badge markup duplicated verbatim in two files; no shared `Badge` component exists in `components/ui/`.
  **Fix**: Add `components/ui/badge.tsx` and use it in both.

- ✅ **File**: `lib/agent/ui-messages.ts` · **Line**: 48-126 (`agentMessagesToUIMessages`, ~78 lines)
  **Issue**: Exceeds the 50-line convention, handling three message roles in one function.
  **Fix**: Split per-role handling into helper functions, parallel to the existing `toolPartFromCall`/`toolPartFromResult`.

- ✅ **File**: `hooks/useForgeConversations.ts` · **Line**: 50-168
  **Issue**: `createConversation`, `renameConversation`, `deleteConversation` each repeat the same fetch → optimistic-update → error-toast → rollback shape.
  **Fix**: Factor a shared `withOptimisticMutation` helper.

- ✅ **File**: Multiple — `components/forge/ForgeExperience.tsx:108`, `components/generate/GenerateExperience.tsx:60`, `components/forge/ScriptPickerDialog.tsx:49`, `components/strategy/ExplainScriptPanel.tsx:132`
  **Issue**: Several components call `fetch` directly instead of going through a hook, inconsistent with the established `hooks/*` data-fetching convention (`useCollections.ts`, `useComparisonReports.ts`).
  **Fix**: Move these into small dedicated hooks to match convention.

## ✅ No issues found in

- **Security**: Auth/ownership — all 23 API routes correctly use `protectAiRoute`/`protectDataRoute`, enforce ownership on PATCH/DELETE via `resolveOwnedScriptRoute`/`resolveOwnedConversationRoute`/`resolveOwnedCollectionRoute`, and validate bodies with Zod. No hardcoded secrets; both `NEXT_PUBLIC_` vars are intentionally public (Clerk publishable key, a plan-ID string). No raw SQL concatenation — all `sql\`...\`` usages are parameterized. Prompt injection — `lib/agent/guardrails.ts` and `lib/agent/system-prompt.ts` treat embedded content as data. No cookie-setting code (Clerk manages sessions). `dangerouslySetInnerHTML` usages elsewhere render deterministic, non-user-controlled output.
- **Performance**: No N+1 patterns in `lib/db/*.ts` (all use batched/`inArray`/`Promise.all`). Drizzle schema indexes match query patterns. No `<img>` tags found anywhere. `/generate` page and its `loading.tsx` are fine.
- **Code quality**: Zero real `any` violations found. ESLint spot-checks across `lib/db`, `lib/export`, `lib/scripts`, `lib/agent`, `lib/ai`, and all API routes came back clean (no unused imports/vars). All 23 routes consistently use the `{ success, data, error }` envelope (streaming routes correctly bypass it only for the streamed body). `actions/export-snapshot.ts` already returns the correct envelope shape and re-checks entitlement server-side.
- **Component structure**: `StrategyOutputCard.tsx`, `ProCheckoutDialog.tsx`, `HistoryEntry.tsx` are large but already cleanly decomposed. `'use client'` placement is otherwise appropriate — top-level "Experience" components own real state, and other pages are Server Components except where genuinely interactive.
