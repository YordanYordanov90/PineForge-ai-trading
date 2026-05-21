# 43 — Tags + Search UI

Build the client UI for tags and search. This spec owns frontend interaction
only.

## Prerequisites

- `41-tags-mutation-route.md` is complete
- `42-history-search-route.md` is complete

## Goal

Let users label scripts and quickly filter history by text and tags.

## Scope

- tag editor on script history items or detail surface
- search input for history
- clickable tag filters
- empty/no-results state

## Files

- `components/strategy/ScriptHistory.tsx`
- `hooks/useScriptHistory.ts` or a dedicated search hook if needed

## Rules

- keep search responsive and lightweight
- preserve current history actions
- avoid turning history into a large management screen in this step

## Check When Done

- users can add/remove tags
- users can filter history by text and tags
- no-results state is clear and recoverable
