# 47 — Collections UI

Build the client UI for managing and assigning collections. This spec owns
frontend behavior only.

## Prerequisites

- `45-collections-crud-route.md` is complete
- `46-script-collection-assignment-route.md` is complete

## Goal

Let users create collections and place scripts into them without leaving the
history workflow.

## Scope

- collection picker for a script
- create/rename/delete collection controls
- optional history filter by collection

## Files

- `components/strategy/ScriptHistory.tsx`
- dedicated collection-management component if needed
- `hooks/useScriptHistory.ts` or a dedicated collections hook

## Rules

- keep interactions compact
- do not build a full file-explorer UI in this step
- preserve mobile usability

## Check When Done

- users can manage collections
- users can assign scripts to collections
- collection state updates without reload
