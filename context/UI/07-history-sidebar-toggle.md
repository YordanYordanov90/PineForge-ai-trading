# 07 — History Sidebar Toggle

Improve script history ergonomics for power users. This spec owns history
collapse state and shortcut behavior only.

## Goal

Give users a faster way to reclaim output space while keeping History easy to
reopen.

## Scope

- collapsible history sidebar state for larger screens
- persisted collapsed state in localStorage
- `H` keyboard shortcut with typing guards
- command palette entry to toggle history

## Files

- `components/generate/GenerateExperience.tsx`
- `components/strategy/StrategyForm.tsx`
- `components/strategy/GeneratorCommandMenu.tsx`

## Rules

- Keep the mobile Sheet behavior intact
- Do not interfere with typing inside inputs/textareas
- Use a dedicated localStorage key for persistence

## Check When Done

- Desktop users can collapse and reopen History quickly
- `H` only works when typing focus guards allow it
- State persists across reloads where intended
