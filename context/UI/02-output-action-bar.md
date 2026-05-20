# 02 — Output Action Bar

Extract and polish the post-generation action row at the top of the output
experience. This spec owns output actions layout only.

## Goal

Make the post-generation workflow faster by grouping the main export actions in
one compact row.

## Scope

Show a compact action bar when a settled script exists:

- Copy
- Download `.pine`
- Open in TradingView
- Webhook JSON entry point if export already exists elsewhere

## Files

- `components/strategy/StrategyOutputCard.tsx`

Optional extraction:

- `components/strategy/OutputActionBar.tsx`

## Rules

- Reuse existing handlers; do not duplicate business logic
- Keep actions disabled when there is no script or when the current behavior already disables them
- Use icon-first buttons with accessible labels/tooltips
- Do not mix unrelated tab controls into this row

## Check When Done

- Main output actions are grouped together
- Existing behaviors still work through the same callbacks
- No duplicate webhook/export logic is introduced
