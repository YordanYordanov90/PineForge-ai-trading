# UX Design Document
**Grok Trading Strategy Generator**

**Version**: 1.2
**Date**: April 2026

**Design Direction**: Premium dark trading terminal aesthetic — modern, minimal, high-contrast emerald accents. Glassmorphic cards. Generative AI streaming feel.

---

## 1. Design Principles

1. **Dark mode first** — `zinc-950` base, never pure black
2. **Glassmorphic cards** — `backdrop-blur` + `bg-zinc-950/35` + `border-zinc-800/70`
3. **Emerald as the single accent** — buttons, highlights, active states, code color
4. **Speed signals trust** — streaming text feels fast even when it isn't
5. **Zero friction to first generation** — no auth wall, no signup gate in Phase 1–3

---

## 2. Route Structure & Pages

| Route | Page | Status |
|---|---|---|
| `/` | Landing page | ✅ Done |
| `/generate` | Generator tool | ✅ Done |
| `/strategy/[slug]` | Public share page | Phase 4 |

**Landing implementation**: The marketing page is composed from modules in [`components/landing/`](../components/landing/) (`LandingPage`, `LandingNavbar`, `LandingHero`, `LandingFeatureGrid`, `LandingHowItWorks`, `LandingCodePreview`, `LandingCta`, `LandingFooter`, `LandingBackground`). Only `LandingNavbar` is a client component (scroll progress bar).

---

## 3. Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `zinc-950` | Page base |
| Card | `zinc-900/70` + `backdrop-blur` | All cards |
| Border | `zinc-800/70` | Card borders |
| Accent | `emerald-500` | Primary buttons |
| Accent hover | `emerald-400` | Button hover |
| Accent subtle | `emerald-400/30` | Focus rings |
| Body text | `zinc-100` | Primary text |
| Muted text | `zinc-400` | Labels, hints |
| Code text | `emerald-300/95` | Pine Script output |
| Code bg | `black/55` | Code container |
| Error | `rose-500/30` border + `rose-500/10` bg | Error states |
| Warning | `amber-400` | Char count warning |

---

## 4. Typography

- **Body / UI**: Inter via `font-sans` (`--font-sans`), loaded in root layout
- **Headings & landing brand**: Syne via `font-heading` (`--font-heading` / `--font-syne`)
- **Code**: Geist Mono via `font-mono` (`--font-geist-mono`) — consistent across `<pre>` / `<code>` on the generator; landing code previews use `font-mono` as well
- Hero (landing): large display type via `font-heading` (responsive scale, e.g. `text-3xl`–`text-6xl` range)
- Card titles: `text-xl font-semibold` (often paired with `font-heading` on marketing sections)
- Labels: `text-sm text-zinc-400`
- Helper text: `text-xs text-zinc-400`

---

## 5. Landing Page (Done) — `/`

**Sections in order** (see `LandingPage` composer):
1. **Navbar** — Sticky, glass-style bar (`bg-zinc-950/80 backdrop-blur-md`), logo left, "Open App" right, emerald **scroll progress** line under the bar
2. **Hero** — Badge, "Describe it. / Grok writes it. / You trade it." + subtitle; primary CTA **Start Generating**, secondary **View Examples** (`#how-it-works`); right side shows a **terminal-style** generative mock (`strategy.pine`), not a static image
3. **Feature grid (bento)** — Four value blocks: **Streaming AI Generation**, **3-Tier Alerts**, **Dynamic SL & TP**, **Exact Risk Sizing** (asymmetric grid on large screens)
4. **How it works** — Headline *"From thought to trade in 15 seconds."* + three numbered steps (Describe It → Grok Writes It → You Trade It)
5. **Production-ready output** — "Pine Editor — TradingView" chrome + syntax-styled sample script (from `landing-code-sample.ts`), not a bitmap screenshot
6. **Bottom CTA** — "Ready to script smarter?" + **Launch Generator Now**
7. **Footer** — One line: "Built for traders, powered by Grok" + copyright

**Layout**: Main content `max-w-7xl mx-auto px-6`; root uses `min-w-0` / flex column so document scrolling and sticky nav behave correctly (no nested scroll from `overflow-x-hidden` on the page shell).

**Navigation behavior**: "Open App", **Start Generating**, **Launch Generator Now**, and equivalent CTAs link to **`/generate`** (the live generator route).

---

## 6. Generator Page — `/generate`

### Layout
- Max width: `max-w-6xl mx-auto px-6`
- Two-column grid on `lg+`: `lg:grid-cols-[1fr_1.05fr]`
- Single column stacked on mobile

### Left Panel — Inputs Card
- Strategy textarea (8 rows, `resize-none`)
- Live char counter below textarea (see §10)
- Prompt Templates grid above textarea (Task 4)
- Model selector — segmented control between textarea and balance input:
  - Three options: **Reasoning** | **Fast** | **Grok-4**
  - Active state: `border-emerald-500/70 bg-emerald-500/15 text-emerald-300`
  - Inactive state: `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50`
  - Description shown below selector (e.g., "Best quality, slower")
  - Default: Reasoning (`grok-4-1-fast-reasoning`)
- "Advanced Options" collapsible section (Task 7):
  - Timeframe select
  - Market select
  - Direction select
  - Indicators multi-select
  - R:R slider
- Account balance input + Generate button row
- "Improve My Prompt" secondary button (Task 7)
- Error display below button row

### Right Panel — Output Card
- Header: "Output" title + Stop button (during stream) + Copy button + Download button (Task 6)
- Description: "Streams live while Grok writes…"
- Code area: `max-h-[640px] overflow-auto`
  - Loading state: skeleton rows (while streaming, no script yet)
  - Streaming state: plain `<pre><code>` with `emerald-300/95` text
  - Complete state: `shiki`-highlighted Pine Script (Task 5)
  - Empty state: "Your script will appear here."
- Generation stats below code area (Task 13): "Generated in 8.3s · ~420 tokens"
- Validator badge in output header (Task 12): green "Valid v5" or amber warning
- Separator + 3 info chips (Alert tiers / Auto lines / Risk rules)
- Refine Chat section below card (Task 10) — appears after first generation

---

## 7. Error State Designs

Every error must have a visible UI state — not just a toast:

| Error | UI Treatment |
|---|---|
| API / Grok failure | Rose banner inside output card + sonner toast |
| Prompt too long | Red char counter + disabled Generate button + inline message |
| Invalid balance | Red text below balance input field |
| Stream interrupted | Partial script shown + amber "Stream interrupted" badge in header |
| Rate limit (Phase 4) | Full-width emerald/amber banner above form with upgrade CTA |
| Clipboard unavailable | Sonner toast only (Copy button stays, user can select manually) |

---

## 8. Prompt Templates (Task 4)

- Location: above strategy textarea, inside left card
- Layout: `flex flex-wrap gap-2`
- Style: pill buttons — `rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1 text-xs`
- Hover: `hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300`
- Active/selected: `border-emerald-500/70 bg-emerald-500/15 text-emerald-300`
- Clicking fills textarea — user can still edit freely

---

## 9. Script History Drawer (Task 8)

- Trigger: "History" button in page header (clock icon, `lucide-react`)
- Component: shadcn `Sheet` (slides in from left)
- Width: `w-80` on desktop, full-width on mobile
- Entry card shows: script name (editable), date, prompt preview (truncated), version badge
- Actions per entry: Load · Rename · Delete
- Empty state: "No saved scripts yet. Generate your first one."

---

## 10. Live Character Count (Task 14)

```
Below textarea, right-aligned:
  "124 / 1500"  ← zinc-400 (default)
  "1210 / 1500" ← amber-400 (>1200)
  "1420 / 1500" ← rose-400 (>1400)
  Generate button disabled at 1500
```

---

## 11. Micro-Interactions

| Interaction | Behavior |
|---|---|
| Generate click | Button → "Generating…" with disabled state |
| Streaming | Text appears incrementally, no cursor animation needed |
| Copy button | "Copy" → "Copied!" for 1.4s, sonner toast |
| Download button | "Download" → brief "Downloading…" → back to "Download", sonner toast |
| Stop button | Appears only during stream when script has started. Disappears on stop/complete |
| Template pill click | Textarea fills instantly, pill gets active style |
| History entry load | Sheet closes, form fills with saved prompt + balance |
| shiki highlight | No flash — render plain text during stream, swap to highlighted on complete |

---

## 12. Accessibility

- All interactive elements have `aria-label` or visible label
- Generate button has `aria-busy={isGenerating}`
- Output area has `aria-live="polite"`
- Focus rings use `focus-visible:ring-emerald-400/30`
- Keyboard: `Ctrl+Enter` triggers generate (Phase 3 bonus)
- Char counter announces changes to screen readers via `aria-live`
- Color is never the sole error indicator — always paired with text

---

## 13. Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< lg` (mobile/tablet) | Single column, output below inputs |
| `lg+` (desktop) | Two-column `[1fr_1.05fr]` grid |
| Output code block | `max-h-[400px]` on mobile, `max-h-[640px]` on desktop |
| Template pills | Wrap freely on all screen sizes |

---

*This document is the single source of truth for all UI/UX decisions.*
