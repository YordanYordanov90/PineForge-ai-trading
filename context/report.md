## Scan Results — full — 2026-07-07

### 🔴 Critical
- None.

### 🟠 High
- **File**: `components/strategy/StrategyOutputCard.tsx` · **Lines**: 1–708 (full file)
  **Issue**: 708-line client component acts as multi-panel orchestrator for 7 tabs (`script`, `breakdown`, `checklist`, `health`, `backtest`, `alerts`, `compare`). Owns cross-panel reset keys, export markdown + snapshot flows, variant strip state, success pulse, refine chat integration, and tab coordination. Violates "one job per component" and "functions under 50 lines" from code-standards.md and AGENTS.md.
  **Fix**: Reduce to thin layout host + tab primitives. Extract per-panel orchestration/state (e.g. dedicated hooks for export coordination, compare, reset key fan-out) into focused modules.
  **Re-validation**: ✅ **Confirmed.** `wc -l` = 708. Child panels (`HealthScorePanel`, `BacktestSummaryPanel`, `ExplainScriptPanel`, etc.) are already extracted; the remaining problem is the orchestrator's prop surface (~50 props), tab wiring, and local export/snapshot coordination — not missing panel splits.

- **File**: `components/forge/ForgeChat.tsx` · **Lines**: 1–595
  **Issue**: Large client component owns streaming chat (`useChat`), message list integration, tool call rendering, research banner, scroll-to-bottom, input wiring, max-conversation guard, and multiple side effects. Does too many jobs in one file.
  **Fix**: Split message list / tool rendering concerns, input, and orchestration into smaller sub-components or hooks while keeping the transport and high-level flow.
  **Re-validation**: ⚠️ **Partially overstated.** `wc -l` = 595. Message list, tool cards, typing indicator, input, scroll FAB, and empty state are already delegated to `ForgeMessageList`, `ForgeToolCallCard`, `ForgeInput`, `ForgeScrollToBottomFab`, `ForgeEmptyState`. The file is still a valid structural concern (~595 lines of `useChat` transport, hydration, conversation lifecycle, research banner, and scroll orchestration), but "owns tool call rendering" is inaccurate — that lives in `ForgeMessageList`.

- **File**: `app/api/forge/route.ts` · **Lines**: 47–236 (POST handler) · file total 311
  **Issue**: The POST handler function is monolithic (~190 lines of orchestration): pre-flight sequence (protect + parse + user + conv + cap + model + key + lock), parallel loads, system prompt, message assembly, streamText + tools + stopWhen + onFinish (persist title + messages + tips + memory extraction), lock release, and multiple catch paths. Violates size and single-responsibility rules.
  **Fix**: Extract pre-flight into a helper, persist logic into `lib/agent/persist-turn.ts` (already partially there) or dedicated coordinator; keep route as thin composition.
  **Re-validation**: ✅ **Confirmed.** POST spans lines 47–236. `persist-turn.ts` and `maybeExtractAndPersistMemory` already absorb some logic; the route still coordinates the full turn inline.

- **File**: `hooks/strategy/useStrategyGenerationSession.ts` · **Lines**: 126, 195, 213
  **Issue**: Two `useCallback` hooks trigger `react-hooks/exhaustive-deps` for missing `'core'`. Also `catch (e)` at line 126 is unused.
  **Fix**: Prefix unused error as `_e` or use `catch {}`. For deps: either add `core`, destructure stable refs with an eslint-disable comment, or restructure.
  **Re-validation**: ⚠️ **Lint confirmed; stale-closure risk overstated.** ESLint reports missing `core` on `loadVariant` (195) and `handleGenerate` (213), but both callbacks already list the specific methods they use (`core.setGeneratedScript`, `core.handleGenerate`) — stable `useCallback` refs from `useStrategyGenerationCore`. Adding whole `core` would satisfy the linter but is not required for correctness. Unused `catch (e)` at line 126 is a real lint issue.

### 🟡 Medium
- **File**: `app/api/generate-variants/route.ts` · **Lines**: 5, 53
  **Issue**: Imports `apiError` (never used; `jsonApiError` / `apiSuccess` used instead). Destructures `model` from parsed data but never uses the local binding (`entitlement.model` is used at line 81).
  **Fix**: Remove unused import and `model` from destructure.
  **Re-validation**: ✅ **Confirmed.** ESLint warnings at lines 5 and 53.

- **File**: `actions/export-snapshot.ts` · **Line**: 40
  **Issue**: `catch (err)` parameter defined but never referenced. Intentional sanitized error path is correct.
  **Fix**: Rename to `catch (_err)` or `catch {}`.
  **Re-validation**: ✅ **Confirmed.** ESLint warning at line 40.

- **File**: `app/api/progress/route.ts` · **Line**: 1
  **Issue**: Imports `apiError` but the route only returns `apiSuccess` or delegates to `protectDataRoute` error responses.
  **Fix**: Remove the unused import.
  **Re-validation**: ✅ **Confirmed.** ESLint warning at line 1.

- **File**: `components/forge/ForgeExperience.tsx` · **Lines**: 4, 52
  **Issue**: `useAuth` imported; `isLoaded` and `isSignedIn` destructured but never referenced anywhere in the file.
  **Fix**: Remove the import and destructuring (auth gating is at route/proxy level).
  **Re-validation**: ✅ **Confirmed.** ESLint warnings at line 52; `useAuth` appears only on import + call.

- **File**: `lib/agent/memory-extraction.ts` · **Line**: 115
  **Issue**: `const { seenTips: _seen, ...profileForPrompt } = existingProfile` — `_seen` is assigned but flagged as unused.
  **Fix**: `void _seen;` after destructure, or omit via a small helper that strips `seenTips`.
  **Re-validation**: ✅ **Confirmed.** ESLint warning at line 115.

- **File**: `hooks/strategy/useStrategyGenerationSession.ts` · **Line**: 126
  **Issue**: `catch (e)` unused (separate from the exhaustive-deps item above).
  **Fix**: `catch {}` or `catch (_e)`.
  **Re-validation**: ✅ **Confirmed.** (Grouped with High item; listed here for lint inventory parity.)

### 🔵 Low
- Several files contain long functions / components (>50–100+ lines) that are currently single-purpose but would benefit from further internal extraction for readability (e.g. parts of `lib/agent/tool-runners.ts`, `lib/agent/memory-extraction.ts`, `lib/db/*` helpers). No correctness impact.
- Lint reports **10 warnings, 0 errors** (unchanged since original scan). `npx tsc --noEmit` is clean.
- Minor: some catch paths in AI routes only `console.warn` under `NODE_ENV === 'development'` (correct for prod sanitization, but could centralize dev logging).

### ❌ False positives
- **None fully invalid.** Every lint warning reproduces on re-scan. Structural High items are real maintainability violations against project standards, not runtime bugs.
- **Overstated (not false)**:
  1. `useStrategyGenerationSession` "stale closure risk" — callbacks already depend on the specific `core.*` methods they call.
  2. `ForgeChat` "owns tool call rendering" — delegated to `ForgeMessageList` / `ForgeToolCallCard`; orchestration size is the real issue.

### ✅ No issues found in:
- **Security**: No hardcoded secrets, tokens, or keys in source (only `process.env.XAI_API_KEY` / Clerk keys via env; placeholders like "YOUR_API_KEY" are example data in normalize helpers). `NEXT_PUBLIC_*` limited to Clerk publishable key and Pro plan ID (intentionally public). All 24 API routes use `protectAiRoute` or `protectDataRoute` + ownership resolvers where applicable. Every route with a request body validates via Zod `safeParse` before logic or LLM calls (`progress` GET has no body — N/A). No raw SQL string concatenation (Drizzle + parameterized `sql` templates). Errors sanitized via `apiError` / envelope (no stacks, no raw LLM text). `dangerouslySetInnerHTML` only in `ScriptOutputHighlighted` (shiki) and `StrategyFingerprint` (deterministic SVG). No custom cookies; Clerk handles auth. Prompt injection surface limited (structured output + guardrails + tool input schemas). No unvalidated LLM outputs rendered to UI.
- **Performance**: No N+1 query patterns on hot paths (`Promise.all` for recent+starred). Composite indexes on `scripts` and `agent_conversations` in `drizzle/schema.ts`. Shiki via dynamic `import()`. `loading.tsx` at `app/loading.tsx`, `app/(app)/generate/loading.tsx`, `app/(app)/forge/loading.tsx`. No raw `<img>`. Streaming on AI paths. Parallel loads in RSC entry points (e.g. Forge page).
- **Code quality**: Zero `any` types in application source (only a comment in `lib/db/script-mapper.ts` mentioning `as any`). Strict TS clean. Consistent `{ success, data, error }` envelope on JSON routes and Server Actions. External input validated at boundaries. No active `TODO`/`FIXME` in source. Dead code limited to the 10 lint warnings above.
- **Component structure**: Prior large files (`StrategyForm`, `ScriptHistory`, `HealthScorePanel`, `ScriptOutput`) remain thin after historical splits. Current growth isolated to the High items above. `'use client'` justified on all current client leaves. No client components wrapping server components unnecessarily. Forge and Strategy output areas already use sub-component extraction; remaining debt is orchestrator size.

**Verification performed (re-scan)**:
- `npm run lint` → 10 warnings, 0 errors (identical to original scan)
- `npx tsc --noEmit` → clean
- `wc -l` on High-severity files (708 / 595 / 311)
- Manual re-read of all flagged files and POST handler span
- Spot-check: API route protection (24/24), `NEXT_PUBLIC_*`, `dangerouslySetInnerHTML`, `any` types, `loading.tsx` presence

---

**After Scanning (per SCANNER.md)**

Do not automatically act on findings. This report is a permanent record.

**Re-validation summary**: Original scan is **accurate**. No findings were fixed since the first run; all 10 lint warnings still present. Two descriptions were slightly overstated (ForgeChat tool rendering ownership; exhaustive-deps stale-closure severity). High-severity items are **standards/maintainability** issues, not security or correctness defects.

For quick wins, low-risk self-contained items (lint cleanups only) could be candidates to add to `context/progress-tracker.md` as a new feature/task:

- Remove unused imports/vars flagged by lint (5–6 sites)
- Fix or document exhaustive-deps warnings (1 hook — prefer stable method refs + targeted eslint comment over adding whole `core`)

Would you like me to add any low-risk fixes to `context/progress-tracker.md` as a new feature?

Only low-risk, self-contained, one-file changes unrelated to unimplemented features would be proposed.