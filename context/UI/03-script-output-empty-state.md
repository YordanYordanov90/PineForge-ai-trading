# 03 — Script Output Empty State

Upgrade the idle state of the Script output panel. This spec owns the empty
state only.

## Goal

Reduce the "blank page" moment before first generation and guide users toward a
good first prompt.

## Scope

Replace the minimal idle state with:

- terminal-themed empty state copy
- 3 to 4 clickable prompt suggestion chips
- `onSuggestionClick` wiring that fills the strategy textarea and focuses it

## Files

- `components/strategy/ScriptOutput.tsx`
- `components/strategy/StrategyForm.tsx`
- optional `lib/config/prompt-suggestions.ts`

## Rules

- Suggestion chips must be buttons
- Reuse the existing prompt-template visual language where it fits
- No AI-generated suggestions in this step
- No backend work in this step

## Check When Done

- Idle state feels intentional instead of empty
- Clicking a suggestion fills the strategy input
- Focus returns to the input cleanly
