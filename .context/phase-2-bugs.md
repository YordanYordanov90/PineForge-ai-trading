# Phase 2 — Audit: Issues & Quick Wins

**Created**: April 2026  
**Updated**: April 2026 (post-fix pass)  
**Scope**: Full-project scan (Next.js app, API routes, components, hooks, config).

---

## Current status snapshot

- **Phase 2 features**: shipped and build-passing.
- **Audit fixes**: completed for all listed items except rate limiting.
- **Remaining known issue**: `SEC-003` (rate limiting), intentionally deferred to later implementation.

---

## Open issues

### HIGH

- **[SEC-003] No rate limiting on AI API routes** — **OPEN / DEFERRED**
  - **Files**: `app/api/generate/route.ts`, `app/api/refine-script/route.ts`, `app/api/explain-script/route.ts`
  - **Reason**: deferred to planned later development (Phase 4 / Upstash).

---

## Fixed issues

### HIGH

- **[SEC-001] Missing security headers in `next.config.ts`** — **FIXED**
  - Added: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

- **[SEC-002] `/api/generate` missing try/catch around `streamText`** — **FIXED**
  - Wrapped generation stream setup in `try/catch` and returns sanitized 500 JSON on failure.

### MEDIUM

- **[QUAL-001] `StrategyForm.tsx` too large (~806 lines)** — **FIXED**
  - Refactored into:
    - `hooks/useScriptGeneration.ts`
    - `hooks/usePromptImprover.ts`
    - `components/strategy/StrategyInputsCard.tsx`
    - `components/strategy/StrategyOutputCard.tsx`
  - `StrategyForm.tsx` now orchestrates state/lineage/imperative loading.

- **[BUG-001] Stale closure for elapsed time on abort** — **FIXED**
  - Abort elapsed timing now uses scoped `startTime`.

- **[QUAL-002] `ExplainScriptPanel` cache key used full script string** — **FIXED**
  - Cache now uses script fingerprint (`length/hash/head/tail`) + mode.

- **[DOCS-001] `TECHNICAL_.md` drift on explain max script length** — **FIXED**
  - Document aligned to `20_000`.

- **[DOCS-002] `PRD_.md` Phase 2 table stale** — **FIXED**
  - Multi-tab output and webhook export marked ✅ Done.

### LOW

- **[QUAL-003] Hardcoded model in improve-prompt** — **FIXED**
  - Uses `DEFAULT_MODEL`.

- **[QUAL-004] Unsafe cast for localStorage history** — **FIXED**
  - Added runtime Zod validation for parsed history.

- **[QUAL-005] Missing route-level `error.tsx` for `/generate`** — **FIXED**
  - Added `app/generate/error.tsx`.

- **[QUAL-006] Unconstrained `rr` in Zod** — **FIXED**
  - Added bounded numeric regex + length limit schema.

---

## Verification

- `npm run build` passes after refactor + security/doc fixes.
- Lint checks for touched refactor files pass.

---

## References

- `.context/phase-2.md`
- `.documents/PRD_.md`
- `.documents/TECHNICAL_.md`

---

*End of phase-2-bugs audit document.*
