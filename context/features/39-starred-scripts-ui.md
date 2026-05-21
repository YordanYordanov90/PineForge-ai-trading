# 39 — Starred Scripts UI

Build the UI affordance for starring scripts. This spec owns client controls and
history presentation only.

## Prerequisites

- `37-starred-scripts-mutation-route.md` is complete
- `38-starred-scripts-history-query.md` is complete

## Goal

Let users star and unstar important scripts from history without leaving the
generator workflow.

## Scope

- star toggle button in history items
- visual distinction for starred scripts
- optional grouped or filtered starred section if it stays narrow enough

## Files

- `components/strategy/ScriptHistory.tsx`
- `hooks/useScriptHistory.ts`

## Rules

- use icon-based star affordance with clear pressed state
- preserve existing rename/delete interactions
- avoid large history redesign in this step

## Check When Done

- users can star/unstar scripts from history
- starred state updates without full-page reload
- visual treatment is clear but restrained
