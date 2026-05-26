# 66 — Strategy Snapshot Export

## Goal

A premium export that produces a self-contained, beautifully formatted HTML
file containing the complete strategy record — script, analysis, metadata, and
a back-link QR code — suitable for printing, journaling, or archiving.

---

## Problem

The existing markdown export (specs `48`–`50`) is excellent for Notion and
Obsidian power users, but many traders prefer a single portable file they can
open in any browser, print, or attach to a trade journal. A self-contained HTML
export fills this gap without requiring a third-party integration.

---

## Solution

A new "Snapshot" export action (Pro-only) that generates a styled, self-contained
`.html` file containing everything about a strategy in one document — usable
offline with no external dependencies.

---

## Export Contents

The HTML snapshot includes:

1. **Header**: PineForge logo (inline SVG), strategy title, generation date
2. **Metadata table**: model, market, timeframe, direction, R:R, account balance
3. **Assumptions** (if present — from spec `60`): amber-tinted block
4. **Original Prompt**: styled blockquote
5. **Breakdown**: formatted sections if present
6. **Pine Script**: syntax-highlighted code block (Prism.js styles inlined)
7. **Health Score**: score badge + verdict + strengths/risks/next-steps
8. **Alert Templates**: per-provider collapsible sections with formatted JSON
9. **Backtest Summary**: all 5 sections
10. **Comparison diff** (if a baseline exists): side-by-side or unified diff view
11. **Footer**: generation metadata, QR code linking to `https://pineforge.app`

All CSS is inlined. No external fonts, no external scripts, no network requests.
The file opens correctly offline.

---

## QR Code

Generated using a pure-JS QR code library (`qrcode` or `qr-code-styling`,
inlined as a small SVG). Encodes the PineForge marketing URL — not a direct
link to the specific script (privacy: the export does not expose the user's
DB script ID publicly).

---

## Assembler

New pure module `lib/export/strategy-snapshot-html.ts`:

```ts
function assembleStrategySnapshotHtml(
  source: StrategyExportSource,
  options: StrategySnapshotOptions
): string
```

`StrategySnapshotOptions` extends `StrategyExportMarkdownOptions` (spec `49`)
with the same optional sections (`healthScore`, `alertTemplates`, `backtestSummary`)
plus `comparisonBaseline?: string`.

Returns a complete `<!DOCTYPE html>` string with all styles inlined.
Deterministic output — same inputs always produce the same HTML.
No AI calls, no DB writes, no DOM access (runs on the server).

---

## Download Mechanism

New server action `actions/export-snapshot.ts` (Server Action, not API route):

1. Accepts the same `StrategyExportSource` + options used by the markdown export
2. Calls `assembleStrategySnapshotHtml`
3. Returns the HTML string via `{ success: true, data: { html: string } }`
4. Client calls `downloadBlob(html, 'strategy-snapshot.html', 'text/html')`
   using the existing download utility pattern

No new API route — Server Action is appropriate here (mutation-free, returns
a data blob for download).

---

## Entitlement

Pro-only. The "Snapshot Export" button in the Output Action Bar is:
- Visible but locked with a lock icon for free users
- Shows upgrade toast on click
- Available immediately for Pro users

---

## Design

The HTML file uses the terminal design language:
- Dark background (`#09090b` zinc-950)
- **Neon accent (`#c8ff00`)** — must match the in-app palette exactly. Do not
  substitute emerald, green, or any other accent. The QR code, dividers, and
  any score chip use neon.
- Body text `#fafafa` (zinc-50) on dark; muted text `#a1a1aa` (zinc-400)
- Borders `#27272a` (zinc-800)
- Monospace font for code (system mono fallback, no external font)
- Clean section separators matching the terminal aesthetic
- Print-friendly: `@media print` rules ensure white background + black text
  for users who print the document (neon accent stays as a subtle hairline,
  not a fill, on printed pages)

---

## Out of Scope (This Spec)

- PDF export (requires headless Chrome or a PDF library — not justified for v1)
- Sharing snapshots via URL (privacy consideration)
- Animated or interactive HTML
- Including the Comparison Report artifact (spec `63`) in the snapshot

---

## Affected Files

New:
- `lib/export/strategy-snapshot-html.ts`
- `actions/export-snapshot.ts`
- `lib/export/snapshot-styles.ts` — inlined CSS string

Modified:
- `components/strategy/OutputActionBar.tsx` — Snapshot Export button (Pro lock)
- `lib/auth/model-entitlement.ts` — export entitlement helper
- `lib/export/source.ts` — no changes expected (already covers all needed fields)

---

## Success Criteria

- Snapshot HTML opens correctly offline in any modern browser
- All sections present and correctly formatted
- QR code renders and points to the correct URL
- File contains no external network requests
- `@media print` produces a readable output
- Pro entitlement enforced
- `npm run build` passes
