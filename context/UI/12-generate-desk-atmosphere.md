# 12 — Generate Desk Atmosphere

Peripheral trading-desk atmosphere for `/generate` only. Builds on
[UI/11](11-terminal-identity-phase-2.md) (`TerminalAmbientBackground`). Auth
keeps the full lobby treatment (ticker + activity HUD); the generator gets a
**quieter workbench** variant.

## Goal

Make `/generate` feel alive and trading-native without competing with the strategy
field or output panel. One memorable cue: *dark emerald desk with a soft market
ticker at the bottom*.

## Scope

### 1. Generate ticker variant

Extend [`TerminalPriceTicker`](../../components/auth/TerminalPriceTicker.tsx)
(or extract shared quote row logic) with `variant="auth" | "generate"`:

| Property | Auth (current) | Generate (new) |
|----------|----------------|----------------|
| Scroll speed | 48s loop | 64–72s loop (slower) |
| Container opacity | `bg-zinc-950/85` | `bg-zinc-950/60` |
| Text contrast | current | dimmer (`text-zinc-600` symbols, muted deltas) |
| Delta jitter interval | 2800ms | 3500–4000ms |
| Activity HUD | paired above ticker | **not shown** on generate |

- Fixed to bottom of viewport on `/generate` only
- `pointer-events-none`, decorative only
- `sr-only` disclaimer: simulated quotes, not a live feed (reuse auth copy)

### 2. Optional slow glow breathe (generate ambient)

Add to [`TerminalAmbientBackground`](../../components/ui/terminal-ambient-background.tsx)
`variant="generate"` only:

- CSS `@keyframes terminal-glow-breathe` — emerald blob opacity ±5%, **10s** cycle
- Apply to one glow layer only (not grid, not noise)
- `@media (prefers-reduced-motion: reduce)`: static glow

### 3. Column-aware spotlight (optional, if breathe is not enough)

Very faint radial washes anchored to the two-column layout:

- Left: emerald tint behind inputs column (~4–6% opacity at column center)
- Right: neutral zinc tint behind output column

Implement as optional third layer in `TerminalAmbientBackground` or a
`GenerateDeskSpotlight` wrapper — only if visual QA shows flat background after
ticker + breathe.

**Out of scope for v1:** real price API, top activity HUD on generate, chart
watermarks, red/green flash on tick changes.

## Files

- `components/auth/TerminalPriceTicker.tsx` — add `variant` prop (or split shared
  `TerminalQuoteStrip` + thin wrappers)
- `components/ui/terminal-ambient-background.tsx` — optional glow breathe for
  `generate`
- `app/globals.css` — `terminal-glow-breathe`, slower ticker animation utility
  if needed (e.g. `.animate-terminal-ticker-slow`)
- `app/generate/page.tsx` — mount generate ticker + ensure content `pb-*` clears
  fixed bottom strip
- `components/generate/GenerateExperience.tsx` — bottom padding if ticker is
  viewport-fixed

## Rules

- **Peripheral only** — motion and quotes stay at page edges; never behind textarea
  or code output
- **Emerald-only** accent on ambient layers (no blue/rose)
- **Auth vs generate:** auth = lobby (ticker + HUD + stronger glow); generate =
  desk (ticker only, quieter)
- CSS-first; client ticker jitter stays low-frequency
- `prefers-reduced-motion`: no scroll animation (static duplicated strip or
  single row); no glow breathe

## Do not

- Fake “traders online” or “last generated Xs ago” on `/generate` (trust risk)
- Bright full-width red/green flash on price changes
- Multiple competing motion layers (pick ticker + at most one ambient breathe)

## Check When Done

- Squint test: strategy field + Generate button win; ticker readable only on
  intent
- `/generate` has bottom market strip; auth unchanged (still has HUD + ticker)
- No layout overlap — last card/refine section clears fixed ticker on mobile
- Reduced-motion: ticker static, glow static, build passes
- `context/progress-tracker.md` updated — UI/12 **Done**
