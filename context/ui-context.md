# UI Context

## Brand

Product name: **PineForge**. Logo wordmark: `Pine` + accent `Forge` (neon-400/500).
Use `lib/brand.ts` (`PRODUCT_NAME`, `brandLogoParts()`) in nav, metadata, and headers.

## Theme

**Default:** dark trading terminal (`next-themes`, `storageKey="pineforge-theme"`).
**Toggle:** `ModeToggle` on landing, `/generate`, and auth — diagonal TL→BR wipe
(`lib/theme/theme-transition.ts`); `prefers-reduced-motion` skips animation.

**Light mode (phased):** shell utilities `.pf-page`, `.pf-nav`, etc. in
`globals.css` cover page backgrounds and nav. Generator cards, output terminal
chrome, and landing hero sections may still use dark-terminal zinc until a
follow-up pass (`context/features/15-theme-toggle.md`).

Design language: zinc surfaces + neon accent (`#c8ff00`) in both modes; shadcn
`:root` / `.dark` CSS variables in `globals.css`.

## Colors

All components use these tokens. No hardcoded hex values in components.
**Neon (`#c8ff00`) is the single primary accent.** Do not introduce emerald,
green, or teal as accents — those were earlier-phase tokens and are fully
replaced.

| Role              | Tailwind Class                          | Usage                                  |
| ----------------- | --------------------------------------- | -------------------------------------- |
| Page background   | `pf-page` gradient `#0a0a0a → #151515` + neon radial glow | Root page base (dark)                  |
| Card surface      | `bg-[#111111]`                          | Standard cards                         |
| Card (generator)  | `bg-[#111111]/80` + `backdrop-blur`     | Generator panel cards                  |
| Border            | `border-zinc-800` / `#27272a`           | All card and input borders (dark)      |
| Border (light)    | `border-zinc-200`                       | All card and input borders (light)     |
| Accent            | `bg-neon-500` (`#c8ff00`)               | Primary buttons, highlights            |
| Accent hover      | `hover:bg-neon-500/10`                  | Outlined button hover state            |
| Accent text (dark)  | `text-neon-300` / `text-neon-400`     | Accent labels, accent links on dark    |
| Accent text (light) | `text-neon-600` / `text-neon-700`     | Accent labels, accent links on light   |
| Focus ring        | `focus-visible:ring-neon-500/30`        | All inputs and buttons                 |
| Body text         | `text-zinc-100` (dark) / `text-zinc-900` (light) | Primary readable text         |
| Muted text        | `text-zinc-400` (dark) / `text-zinc-600` (light) | Labels, hints, helper text    |
| Code text         | `text-neon-300/95`                      | Pine Script output                     |
| Code background   | `bg-black/55`                           | Code container background              |
| Error background  | `bg-rose-500/10`                        | Error state card background            |
| Error border      | `border-rose-500/30`                    | Error state card border                |
| Error text        | `text-rose-200`                         | Error message text                     |
| Warning / info    | `text-amber-400` + `border-amber-500/30` + `bg-amber-500/10` | Char count, stream badge, contextual tips, research pre-fill banner |

### Semantic state colors

Use these only when state semantics genuinely apply. Do **not** use them as
generic palette variety on metadata badges (see "Muted Metadata Badge" pattern).

| State                       | Token                                                     |
| --------------------------- | --------------------------------------------------------- |
| Positive / success / "good" | `text-neon-400` + `border-neon-500/40` + `bg-neon-500/10` |
| Warning / educational / info | `text-amber-400` + `border-amber-500/30` + `bg-amber-500/10` |
| Negative / error / "bad"    | `text-rose-400` + `border-rose-500/40` + `bg-rose-500/10` |

## Typography

| Role              | Font       | Variable / Class                              |
| ----------------- | ---------- | --------------------------------------------- |
| Body / UI         | Inter      | `font-sans` (`--font-sans`)                   |
| Headings / brand  | Syne       | `font-heading` (`--font-heading`)             |
| All code / mono   | Geist Mono | `font-mono` (`--font-geist-mono`)             |
| Landing hero      | Syne       | `text-3xl` → `text-6xl` (responsive)          |
| Card titles       | —          | `text-xl font-semibold`                       |
| Labels            | —          | `text-sm text-zinc-400`                       |
| Helper text       | —          | `text-xs text-zinc-400`                       |

## Border Radius

| Context            | Class          |
| ------------------ | -------------- |
| Pills / badges     | `rounded-full` |
| Inputs / buttons   | `rounded-md`   |
| Cards / panels     | `rounded-xl`   |
| Modals / drawers   | `rounded-xl`   |

## Component Library

shadcn/ui on top of Tailwind CSS v4. Components live in `components/ui/`.
Use the CLI to add new components — do not hand-edit `components/ui/*` after
generation. The Sheet component is used for the Script History drawer.

## Layout Patterns

- **Generator page** (`/generate`): Two-column grid `lg:grid-cols-[1fr_1.05fr]`
  with `gap-6 lg:gap-8`. Single column on mobile (output below inputs).
  Max width `max-w-6xl mx-auto px-6`.
- **Landing page** (`/`): Full-width sections, max-width `max-w-7xl mx-auto px-6`.
  Document-level scroll. Page shell uses `overflow-x-clip` (not `hidden`) so
  sticky descendants are not broken by an implicit scroll container.
- **Navbar**: Sticky top bar. Landing wraps `LandingTicker` + `LandingNavbar`
  inside a single `sticky top-0 z-50` container so they pin together.
  Background: `bg-zinc-950/80 backdrop-blur-md`. Scroll progress bar uses
  `bg-neon-500` over `bg-zinc-200/80 dark:bg-zinc-800/60`. Generator: standard
  fixed nav.
- **Drawers**: shadcn Sheet slides in from left. `w-80` desktop, full-width mobile.
- **Collapsibles**: Advanced Options panel uses Tailwind height animation.
  Chevron icon rotates on open/close.
- **Overflow rule**: prefer `overflow-x-clip` over `overflow-x-hidden` on page
  shells and `body` — `clip` does not establish a scroll container, so sticky
  positioning keeps working further down the tree.

## Icons

Lucide React. Stroke-based only. Sizes: `h-4 w-4` for inline / labels,
`h-5 w-5` for buttons and interactive controls.

## Key Component Patterns

**Template Pills** (in-generator quick-start pills)
```
flex flex-wrap gap-2
Default:  rounded-full border border-zinc-300 bg-white/70 text-zinc-600
          dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400
Hover:    hover:border-neon-500/30 hover:text-neon-700 dark:hover:text-neon-300
Active:   terminal-active-pill border-neon-500/50 text-neon-700 dark:text-neon-300
```

**Model Selector**
```
Segmented control — 3 buttons inline
Active:   border-neon-500/70 bg-neon-500/15 text-neon-700 dark:text-neon-300
Inactive: text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200
          hover:bg-zinc-100 dark:hover:bg-zinc-800/50
Below:    description text for selected model
```

**Muted Metadata Badge** (templates, history rows, fingerprints)

Used for **non-critical** metadata (market, timeframe, direction, difficulty,
Health Score chip on a template card). Do **not** color-code by value — value
encoding lives in the surrounding context (e.g. the Health tab itself).

```
inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]
font-medium uppercase tracking-wider
Light: border-zinc-200 bg-zinc-100 text-zinc-600
Dark:  dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400
```

For free-form chip tags (no border emphasis):
```
rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600
dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400
```

When a badge **does** carry semantic meaning (an error state, a warning, a
"success" verdict on a Health Score card itself), use the semantic state
tokens from the Colors section.

**Primary CTA Button** — use the shared `.pf-improve-prompt-btn` utility for
neon-accented CTAs in both modes (defined in `globals.css`). Avoid inlining
`border-neon-500/45 bg-neon-500/10 …` ad-hoc; reuse the utility so dark/light
parity stays consistent.

**Output Card Header (left → right)**
```
"Output" | Validator badge | "Streaming" badge | Generation stats
         | [Stop] | Download .pine | Copy
```
- Streaming badge: only while `isGenerating`
- Stop: only during streaming when script is non-empty
- Validator badge + stats + Download + Copy: only when idle with script present

## Shell Utilities (`globals.css`)

Prefer these utility classes over re-implementing dark/light variants in every
component. They are defined in `app/globals.css` and handle both themes.

| Utility                  | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `.pf-page`               | Root page background gradient + neon radial glow   |
| `.pf-nav`                | Sticky navbar background + backdrop-blur           |
| `.pf-nav-muted`          | Muted nav link / pill                              |
| `.pf-card`               | Standard card surface + border (both modes)        |
| `.pf-badge`              | Small inline pill (e.g. landing hero subtitle)     |
| `.pf-heading`            | Heading typography (Syne)                          |
| `.pf-improve-prompt-btn` | Primary neon-accent CTA (both modes)               |
| `.pf-refine-panel`       | Refine-chat panel surface                          |
| `.pf-terminal-window` + `.terminal-code-surface` | Landing code/example surface |

## App-wide Navigation (2026 Phase 7)

The authenticated app surface (`/generate`, `/forge`, `/reports`, `/templates`) is now wrapped by a single `AppNavbar` via the `app/(app)` route group layout.

- `components/AppNavbar.tsx` provides consistent logo, primary nav links (Generator / Forge / Templates / Reports), active route highlighting via `usePathname`, ModeToggle, auth controls (UserButton or Sign In), and a mobile hamburger + Sheet.
- Page-specific chrome (e.g. ScriptHistory trigger on `/generate`, Forge conversations mobile toggle) remains inside the individual page components.
- Landing (`/`) and auth pages keep their dedicated navbars and are **not** part of the `(app)` group.
- Styling reuses `.pf-nav` / `.pf-nav-muted` tokens and brand logo patterns from `LandingNavbar`.
