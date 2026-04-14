# Next.js app audit — Carry-forward issues only

**Scope:** unresolved/relevant items from prior audit sessions, re-validated against current codebase.  
**Build:** `npm run build` passes.  
**Date:** 2026-04-14

---

## HIGH

- **[SEC-001] Public generation surface still allows abuse-cost risk**
  - **Files:** `app/api/generate/route.ts`, `app/api/refine-script/route.ts`, `app/api/explain-script/route.ts`
  - **Current state:** Input validation and sanitized errors are in place, and baseline security headers/CSP are already added. However, AI routes remain callable without user identity/quotas and without enforcement throttles.
  - **Why this remains relevant:** Even with valid payload schemas, unrestricted route access can still be abused for excessive LLM usage and cost spikes. This is primarily an operational security/availability risk rather than a type-safety bug.
  - **Risk profile:** Cost amplification, provider quota exhaustion, degraded availability for legitimate users, and no attribution for abusive clients.
  - **Recommended path:**
    1. Short term: lightweight IP throttle for AI routes.
    2. Mid term: per-user quotas once auth lands.
    3. Long term: policy layer (rate tiers, burst control, anomaly detection).
  - **Note:** This is already planned for later development and can remain intentionally deferred.

---

## MEDIUM

- **[A11Y-001] Model selector lacks explicit single-select semantics**
  - **File:** `components/strategy/ModelSelector.tsx`
  - **Current state:** The control visually behaves like a segmented single-select, but the accessibility semantics are still generic buttons.
  - **Why this remains relevant:** Screen readers and keyboard-only users may not receive proper context about the control being one choice from a group, and which option is currently selected.
  - **Impact:** Reduced accessibility quality and potential WCAG operability/understandability gaps.
  - **Recommended fix:** Add semantic grouping and state exposure (e.g., radiogroup-style semantics with clear selected state and label association).

- **[A11Y-002] Decorative “Copy” control appears interactive**
  - **File:** `components/landing/LandingCodePreview.tsx`
  - **Current state:** A `div` styled with `cursor-pointer` and button-like visuals appears actionable but has no keyboard/focus semantics and no real action.
  - **Why this remains relevant:** UI affordance implies interactivity while accessibility and behavior do not match, which can confuse users and assistive technologies.
  - **Impact:** Misleading interaction model; keyboard users cannot activate what appears to be a control.
  - **Recommended fix:** Either convert to a real button with behavior and accessible naming, or restyle as clearly decorative (remove pointer/hover action cues).

- **[COPY-001] Hero badge model naming is out of sync with product reality**
  - **File:** `components/landing/LandingHero.tsx`
  - **Current state:** Hero text still says “Grok-3 Powered” while current model configuration and product messaging have moved beyond that.
  - **Why this remains relevant:** Marketing copy mismatch reduces trust and creates confusion between landing claims and actual generator behavior.
  - **Impact:** Product credibility and messaging consistency issue.
  - **Recommended fix:** Update badge copy to match current model branding used in the app.

- **[NEXT-001] Global route-level error/loading UX is incomplete**
  - **Files:** `app/error.tsx` (missing), `app/loading.tsx` (missing), `app/generate/error.tsx` (present)
  - **Current state:** Segment-level recovery exists for `/generate`, but root-level app fallback/recovery and loading shell are still not defined.
  - **Why this remains relevant:** Unexpected errors outside `/generate` can still fall back to framework-default UX; loading transitions at app root are not branded/controlled.
  - **Impact:** Inconsistent resilience UX across routes and weaker production polish.
  - **Recommended fix:** Add root `app/error.tsx` and root `app/loading.tsx` with brand-consistent fallback/retry experience; keep existing `/generate/error.tsx` for segment-specific handling.

---

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 1 |
| MEDIUM   | 4 |

These are the only carry-forward items still relevant after recent fix passes.

---

## Delivery sizing (effort + priority)

| ID | Effort | Priority | Rationale |
|----|--------|----------|-----------|
| SEC-001 | M | P1 | Requires route protection strategy decisions (IP throttle now, per-user later with auth integration). |
| A11Y-001 | S | P2 | Localized semantic improvements in `ModelSelector` without architectural changes. |
| A11Y-002 | S | P2 | Small UI correction in landing preview (either real button behavior or remove interactive affordance). |
| COPY-001 | S | P3 | Copy-only change in hero badge text. |
| NEXT-001 | M | P2 | Add root `app/error.tsx` + `app/loading.tsx` and align fallback UX patterns. |

### Suggested implementation order

1. `SEC-001` (risk/cost control first)
2. `A11Y-001` and `A11Y-002` (quick accessibility wins)
3. `NEXT-001` (global resilience/UX consistency)
4. `COPY-001` (messaging polish)
