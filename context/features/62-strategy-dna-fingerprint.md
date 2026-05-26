# 62 — Strategy DNA Fingerprint

## Goal

Every saved script gets a small, deterministic procedural SVG "fingerprint"
badge generated from its metadata — giving the history drawer instant visual
scannability without requiring users to read titles.

---

## Problem

As a user's script library grows, the history drawer becomes a wall of text
entries that all look the same. Visual scanning is slow. The fingerprint makes
each strategy visually unique and immediately recognisable.

---

## Solution

A client-side pure function that deterministically generates a small SVG
(32×32px) from a set of script metadata inputs. Same inputs always produce the
same SVG. No AI, no API calls, no new DB columns.

---

## Fingerprint Inputs

```ts
type FingerprintInputs = {
  indicators: string[]    // from structuredInputs
  timeframe: string       // e.g. "15m", "1h", "Daily"
  direction: 'Long' | 'Short' | 'Both' | 'Any'
  market: string          // e.g. "Crypto", "Forex"
  scriptLength: number    // character count of the script
  version: number         // refinement version
}
```

All fields are already present on `SavedScript` — no schema changes required.

---

## Visual Design

The fingerprint is a 32×32 SVG composed of:

1. **Background**: a shade derived from the `market` field (crypto = deeper
   blue-grey, forex = slate, equities = zinc, any = neutral)
2. **4×4 grid of cells**: each cell is filled or empty based on a hash of
   the indicator names — similar to GitHub identicons but with **neon
   (`#c8ff00`) / zinc** cells matching the terminal palette. Do not use
   emerald, green, or rainbow palettes — neon is the single accent.
3. **Accent line**: a single horizontal or diagonal stroke encoding direction
   (long = upward angle, short = downward, both = horizontal)
4. **Version dots**: 1–3 small corner dots encoding refinement depth
   (1 dot = v1, 2 dots = v2–v3, 3 dots = v4+)

The result is visually distinct per strategy but never random — the same
strategy always shows the same badge.

---

## Implementation

New pure module `lib/scripts/fingerprint.ts`:

```ts
function hashToInt(s: string): number
function buildFingerprintSvg(inputs: FingerprintInputs): string
```

`hashToInt` uses a simple djb2-style hash (no crypto dependency).
`buildFingerprintSvg` returns a complete inline SVG string, safe to render
via `dangerouslySetInnerHTML` (no user input touches the SVG — all inputs
are from the app's own stored data).

New component `components/strategy/StrategyFingerprint.tsx`:
- Accepts `SavedScript`
- Derives `FingerprintInputs` from the script
- Renders the SVG inside a `title` tooltip showing the strategy name
- Accessible: `role="img"` + `aria-label`

---

## Integration Points

- `ScriptHistoryEntry` — renders `StrategyFingerprint` at the left edge of
  each history row (replaces or sits beside the existing row icon)
- Template cards (spec `59`) — fingerprints displayed on curated templates
- Comparison Reports (spec `63`) — fingerprints used as visual anchors in
  the report header when comparing two strategies

---

## Security Note

The SVG is built entirely from app-owned structured data — never from raw
user text. No `<script>` tags, no event attributes, no external references.
Safe to render inline.

---

## Out of Scope (This Spec)

- Animated fingerprints
- User-customisable colours
- Fingerprint export
- Fingerprints in the Forge conversation list

---

## Affected Files

New:
- `lib/scripts/fingerprint.ts` — `buildFingerprintSvg()` + `hashToInt()`
- `components/strategy/StrategyFingerprint.tsx`

Modified:
- `components/strategy/ScriptHistoryEntry.tsx` — render `StrategyFingerprint`

---

## Success Criteria

- Every history entry shows a fingerprint badge
- Same script always renders the same fingerprint across sessions
- Different strategies with different metadata render visibly different badges
- No layout shift — fingerprint is fixed 32×32
- Accessible (`role="img"`, `aria-label`, `title`)
- `npm run build` passes
