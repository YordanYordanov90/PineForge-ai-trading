# 05 — Motion Feedback

Add restrained motion polish to key generator moments. This spec owns CSS-level
micro-interactions only.

## Goal

Make the app feel more responsive without introducing heavy animation or new
dependencies.

## Scope

- pressed-state feedback on primary buttons
- subtle emphasis on ready-to-generate state where appropriate
- one-shot success pulse when generation finishes successfully
- reduced-motion support

## Files

- `app/globals.css`
- `components/strategy/StrategyInputsCard.tsx`
- `components/strategy/StrategyOutputCard.tsx`

## Rules

- Prefer CSS-only implementation
- Respect `prefers-reduced-motion`
- Keep effects subtle and consistent with PineForge's terminal aesthetic
- Do not add celebratory/confetti-style motion

## Check When Done

- Button press feedback feels immediate
- Successful generation gives brief visual confirmation
- Reduced-motion users do not get distracting animation
