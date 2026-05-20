# 06 — Sticky Output Tabs

Improve navigation across long output by making the output tab bar sticky. This
spec owns output tab navigation only.

## Goal

Keep the Script / Breakdown / Checklist / Health / Alerts / Compare navigation
available while scrolling longer output.

## Scope

- sticky output tabs container
- small Lucide icons for each tab
- layout adjustments needed for sticky behavior inside the output card

## Files

- `components/strategy/StrategyOutputCard.tsx`

## Rules

- Use restrained icons only
- Keep current tab names concise
- Do not redesign unrelated output content in this step

## Check When Done

- Tabs remain accessible while scrolling
- Icons improve scanability without clutter
- Sticky positioning does not break mobile layout
