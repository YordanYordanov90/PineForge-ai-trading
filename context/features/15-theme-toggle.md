# 15 — Theme Toggle (Dark / Light)

## Status

Done (v1 — phased shell + diagonal transition).

## Goal

Let users switch between dark (default terminal) and light shells with a smooth
top-left → bottom-right diagonal wipe. Preference persists in `localStorage`.

## Implementation

| Piece | Location |
|-------|----------|
| Provider | `components/theme-provider.tsx` — `next-themes`, `attribute="class"`, `storageKey="pineforge-theme"`, `disableTransitionOnChange` |
| Diagonal wipe | `lib/theme/theme-transition.ts` — WAAPI `clip-path` overlay, `prefers-reduced-motion` → instant flip |
| Toggle UI | `components/mode-toggle.tsx` — shadcn `Button` + Sun/Moon, `ActionTooltip` |
| Shell utilities | `app/globals.css` — `.pf-page`, `.pf-nav`, `.pf-nav-muted`, `.pf-heading`, `.pf-muted`, `.pf-badge` |
| Clerk | `clerkAppearanceDark` / `clerkAppearanceLight`, `hooks/useClerkAppearance.ts`, `ThemedClerkSignIn` / `ThemedClerkSignUp` |

## Placement

- Landing navbar (`LandingNavbar`)
- Generate header (`GenerateExperience`)
- Auth layout header (`app/(auth)/layout.tsx`)

## Phased follow-up (not v1)

- Strategy cards, output terminal chrome, shiki surface — still hardcoded zinc/emerald
- Sonner toast light tokens (`components/ui/sonner.tsx`)
- Command palette + auth terminal HUD light variants
- Landing hero / feature grid full light polish

## Check when done

- [x] Toggle on `/`, `/generate`, auth routes
- [x] Diagonal wipe TL→BR (reduced motion: instant)
- [x] Theme persists on refresh
- [x] Clerk sign-in / UserButton readable in both themes
- [x] `npm run build` passes
