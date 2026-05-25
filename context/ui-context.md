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

| Role              | Tailwind Class                          | Usage                                  |
| ----------------- | --------------------------------------- | -------------------------------------- |
| Page background   | `pf-page` gradient `#0a0a0a → #151515` + neon radial glow | Root page base (dark)                  |
| Card surface      | `bg-[#111111]`                          | Standard cards                         |
| Card (generator)  | `bg-[#111111]/80` + `backdrop-blur`     | Generator panel cards                  |
| Border            | `border-zinc-800` / `#27272a`           | All card and input borders             |
| Accent            | `bg-neon-500` (`#c8ff00`)               | Primary buttons, highlights            |
| Accent hover      | `hover:bg-neon-500/10`                  | Outlined button hover state            |
| Focus ring        | `focus-visible:ring-neon-500/30`        | All inputs and buttons                 |
| Body text         | `text-zinc-100` / `#ffffff`             | Primary readable text                  |
| Muted text        | `text-zinc-400` / `#a1a1aa`             | Labels, hints, helper text             |
| Code text         | `text-neon-300/95`                      | Pine Script output                     |
| Code background   | `bg-black/55`                           | Code container background              |
| Error background  | `bg-rose-500/10`                        | Error state card background            |
| Error border      | `border-rose-500/30`                    | Error state card border                |
| Error text        | `text-rose-200`                         | Error message text                     |
| Warning           | `text-amber-400`                        | Char count warning, stream badge       |

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
  Document-level scroll, no `overflow-x-hidden` on page shell.
- **Navbar**: Sticky top bar. Landing: `bg-zinc-950/80 backdrop-blur-md` +
  emerald scroll progress bar. Generator: standard fixed nav.
- **Drawers**: shadcn Sheet slides in from left. `w-80` desktop, full-width mobile.
- **Collapsibles**: Advanced Options panel uses Tailwind height animation.
  Chevron icon rotates on open/close.

## Icons

Lucide React. Stroke-based only. Sizes: `h-4 w-4` for inline / labels,
`h-5 w-5` for buttons and interactive controls.

## Key Component Patterns

**Template Pills**
```
flex flex-wrap gap-2
Default:  rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1 text-xs
Hover:    hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300
Active:   border-emerald-500/70 bg-emerald-500/15 text-emerald-300
```

**Model Selector**
```
Segmented control — 3 buttons inline
Active:   border-emerald-500/70 bg-emerald-500/15 text-emerald-300
Inactive: text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50
Below:    description text for selected model
```

**Output Card Header (left → right)**
```
"Output" | Validator badge | "Streaming" badge | Generation stats
         | [Stop] | Download .pine | Copy
```
- Streaming badge: only while `isGenerating`
- Stop: only during streaming when script is non-empty
- Validator badge + stats + Download + Copy: only when idle with script present
