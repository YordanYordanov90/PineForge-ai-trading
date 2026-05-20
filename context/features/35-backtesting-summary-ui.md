# 35 — Backtesting Summary UI

Build the UI for the Strategy Backtesting Summary Generator on `/generate`. This
spec owns rendering, tab wiring, and user interaction only. Do not implement
schemas, prompt logic, route code, or hook internals in this step.

## Prerequisites

- `34-backtesting-summary-state-hook.md` is complete

## Goal

Let the user generate and review a structured Markdown-style backtesting
checklist without leaving the output experience.

## Placement

Add a new output tab:

- `Backtest`

Recommended trigger:

- primary action in the empty state: `Generate Backtesting Summary`

The tab should appear only when a script exists.

## UI States

Support:

- **Empty** — no summary generated yet
- **Loading** — request in progress
- **Success** — checklist rendered
- **Error** — sanitized error with retry action

## Content Rendering

Render:

- summary title
- sectioned checklist content for:
  - recommended timeframes
  - recommended markets
  - equity curve checks
  - failure modes
  - backtesting plan

Use structured rendering first. The `markdown` field may be offered for copy or
download later, but the default UI should be readable as native sections rather
than as one large raw Markdown blob.

## Suggested Files

- `components/strategy/BacktestingSummaryPanel.tsx`
- optional small section component if reuse keeps the panel simpler

## Interaction Rules

- disable generation trigger while loading
- prevent running when no script exists
- keep other output tabs usable while this request runs
- retry should reuse the current script context without regeneration
- clear displayed summary when the active script changes

## Visual Direction

Use existing PineForge output patterns:

- zinc surfaces
- emerald accent for primary actions
- muted labels for section headings/subtext
- no hardcoded hex values

The panel should read like an operational checklist, not a chat answer or blog
post.

## Accessibility

- tab label must remain concise: `Backtest`
- loading and error states should be announced clearly
- use semantic headings and lists
- buttons need visible focus states

## DB Boundary

No database schema or persistence changes are part of this UI step.

## Scope Limits

- no inline editing of the checklist
- no export feature in this step
- no command palette additions unless a future spec asks for them
- no changes to unrelated tabs

## Check When Done

- Backtest tab appears when a script exists
- user can generate a backtesting summary without leaving `/generate`
- empty/loading/error/success states all render cleanly
- checklist content is easy to scan
- summary clears when the active script changes
- styling matches existing PineForge UI tokens and patterns
- `npm run build` passes
