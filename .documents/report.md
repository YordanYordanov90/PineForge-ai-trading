# Next.js app audit — Universal Next.js Scanner

**Scope:** `app/`, `components/`, `lib/`, `next.config.ts`, `package.json`, `tsconfig.json` (no `middleware.ts` present).  
**Build:** `npm run build` completed successfully (Next.js 16.2.2).  
**Date:** 2026-04-12

---

## CRITICAL

No exploitable issues confirmed in reviewed code paths (e.g. LLM output is highlighted via Shiki `codeToHtml`, which escapes markup for display; streaming path renders plain text in `<pre><code>`).

---

## HIGH

- **[API-001] Server does not enforce prompt/balance size limits**
  - **File:** `app/api/generate/route.ts:8-12`
  - **Issue:** Zod schema uses `z.string().min(1)` for `prompt` and `balance` with no `.max()`. The UI caps prompt length via `MAX_PROMPT_LENGTH` in `StrategyForm`, but callers can bypass the client and POST arbitrarily large bodies.
  - **Why it matters:** Risk of excessive token usage, higher API cost, and potential denial-of-service against the route or provider.
  - **Suggested fix:** Align server with client: `import { MAX_PROMPT_LENGTH } from '@/lib/constants'` and add `.max(MAX_PROMPT_LENGTH)` (and a reasonable `.max()` for balance, e.g. 32–64 chars for numeric strings). Optionally reject non-numeric balance with a refine.

- **[SEC-001] Public, unauthenticated generation endpoint**
  - **File:** `app/api/generate/route.ts:36-58`
  - **Issue:** `POST /api/generate` has no authentication and no rate limiting.
  - **Why it matters:** Anyone can consume provider quota and run up cost; no per-user accountability.
  - **Suggested fix:** Add auth (e.g. session) when you introduce accounts; add rate limiting (edge middleware, Vercel Firewall, Upstash Redis, or similar) and consider CAPTCHA on abuse patterns.

---

## MEDIUM

- **[ERR-001] No try/catch around streaming in API route**
  - **File:** `app/api/generate/route.ts:49-57`
  - **Issue:** `streamText` / `toTextStreamResponse` are not wrapped in try/catch. Configuration or provider errors may surface as unhandled failures.
  - **Why it matters:** Poor error observability and rougher client experience than a controlled JSON error.
  - **Suggested fix:** Wrap in try/catch; on failure return `Response.json({ error: '…' }, { status: 502 })` or similar without leaking secrets.

- **[BUG-001] Stale state used for elapsed time on abort**
  - **File:** `components/strategy/StrategyForm.tsx:125-131`
  - **Issue:** In the `AbortError` branch, code uses `genStartTime` from React state; state may not have flushed before abort, so `setGenElapsed` can be skipped incorrectly.
  - **Why it matters:** Elapsed timer after “Stop” can be wrong or missing.
  - **Suggested fix:** Capture `const startTime = Date.now()` at the start of `generate` (already present at line 77) and use that local variable in the abort branch instead of `genStartTime`.

- **[A11Y-001] Model selector lacks explicit single-select semantics**
  - **File:** `components/strategy/ModelSelector.tsx:19-43`
  - **Issue:** Three `<button>` elements act as a segmented control; no `role="radiogroup"`, `aria-labelledby`, or per-button `aria-checked` / `aria-pressed`.
  - **Why it matters:** Screen reader users get weaker context for which option is active.
  - **Suggested fix:** Use `role="radiogroup"` on the container, `aria-labelledby` pointing to the “Model” label, and `aria-checked={isSelected}` on each button (or `aria-pressed` if you prefer toggle semantics).

- **[A11Y-002] Decorative “Copy” looks interactive but is not focusable**
  - **File:** `components/landing/LandingCodePreview.tsx:29-32`
  - **Issue:** A `div` with `cursor-pointer` mimics a button but has no `role`, `tabIndex`, or keyboard handler.
  - **Why it matters:** Misleading for keyboard and assistive tech users (and fails WCAG operable controls expectations if perceived as real action).
  - **Suggested fix:** If purely decorative, remove `cursor-pointer` and hover affordances; if it should copy, use `<button type="button">` with an accessible name.

- **[COPY-001] Hero badge contradicts configured models**
  - **File:** `components/landing/LandingHero.tsx:13`
  - **Issue:** Badge text reads “Grok-3 Powered” while `GROK_MODELS` in `lib/constants.ts` uses Grok 4 / 4.1 ids.
  - **Why it matters:** Inconsistent product messaging vs implementation.
  - **Suggested fix:** Update badge to match actual models (e.g. “Grok 4” / “xAI Grok”) after product confirmation.

- **[NEXT-001] No route-level error (or loading) UI**
  - **File:** `app/` tree (absent `error.tsx`, `loading.tsx` under `app/` or `app/generate/`)
  - **Issue:** Failures fall back to default Next.js error handling without app-branded recovery.
  - **Why it matters:** Weaker UX and harder debugging for users on `/` and `/generate`.
  - **Suggested fix:** Add `app/error.tsx`, optionally `app/generate/error.tsx`, and `loading.tsx` where you want skeleton states.

- **[CFG-001] No security headers in Next config**
  - **File:** `next.config.ts:3-5`
  - **Issue:** Empty config; no `headers()` for baseline protections (e.g. `X-Frame-Options`, `Referrer-Policy`, strict `Content-Security-Policy` if feasible).
  - **Why it matters:** Defense in depth against clickjacking and some injection contexts; CSP helps if any HTML rendering expands later.
  - **Suggested fix:** Add `headers` async export in `next.config.ts` per Next.js docs; tune CSP for your scripts/fonts.

---

## LOW

- **[METRIC-001] “Tokens” label is word count**
  - **File:** `components/strategy/StrategyForm.tsx:273-276`
  - **Issue:** UI shows `~{generatedScript.split(/\s+/).length} tokens`, which counts whitespace-separated words, not LLM tokens.
  - **Why it matters:** Misleading metrics for users comparing runs.
  - **Suggested fix:** Rename to “words” or remove until real token counts exist.

- **[DEAD-001] Unused constant**
  - **File:** `lib/constants.ts:29`
  - **Issue:** `MAX_HISTORY_ENTRIES` is exported but not referenced in application code.
  - **Why it matters:** Dead code and confusion for future readers.
  - **Suggested fix:** Remove or wire into a history feature when implemented.

- **[STYLE-001] Inline styles on landing components**
  - **Files:** `components/landing/LandingNavbar.tsx:55-58`, `components/landing/RevealOnScroll.tsx:60-64`
  - **Issue:** Dynamic `width` / `transitionDelay` via `style` — necessary for runtime values but conflicts with “Tailwind only” conventions in some repos.
  - **Why it matters:** Consistency and theming; not a functional bug.
  - **Suggested fix:** Keep as-is (valid) or move to CSS variables set from small inline `style` blocks if you want fewer magic properties.

---

### Quick Wins (Low/No Risk)

**Quick Win #1: Fix hero badge model name**
- **File:** `components/landing/LandingHero.tsx:13`
- **Time:** ~5 minutes
- **Risk:** None
- **Benefit:** Marketing matches `lib/constants.ts` model ids.
- **Suggested change:** Replace “Grok-3 Powered” with text that matches shipped models (e.g. “Grok 4 · xAI”).

**Quick Win #2: Rename misleading “tokens” label**
- **File:** `components/strategy/StrategyForm.tsx:273-276`
- **Time:** ~5 minutes
- **Risk:** None
- **Benefit:** Honest UI copy.
- **Suggested change:** Use “words” instead of “tokens”, or drop the metric.

**Quick Win #3: Remove or use `MAX_HISTORY_ENTRIES`**
- **File:** `lib/constants.ts:29`
- **Time:** ~5 minutes
- **Risk:** None if unused
- **Benefit:** Cleaner constants module.
- **Suggested change:** Delete the export until a history feature exists.

**Quick Win #4: Use local `startTime` in abort handler**
- **File:** `components/strategy/StrategyForm.tsx:77-78, 125-131`
- **Time:** ~10 minutes
- **Risk:** Low (test Stop during generation)
- **Benefit:** Correct elapsed time after cancel.
- **Suggested change:** Store `startTime` in a ref set at generation start, or use the existing local `startTime` variable inside `generate` closure for the `AbortError` branch.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 2 |
| MEDIUM   | 8 |
| LOW      | 3 |

**Positive notes:** Zod validation on the API; model id allowlist; streaming read loop with abort support; `prefers-reduced-motion` handled in `RevealOnScroll`; production build passes.
