# 50 — Export Actions UI

Build the UI for exporting strategy notes to Notion / Obsidian-friendly
Markdown. This spec owns client actions only.

## Prerequisites

- `48-export-breakdown-source-contract.md` is complete
- `49-export-markdown-serializer.md` is complete

## Goal

Let users export a clean Markdown note from the generator without adding a heavy
integration surface.

## Scope

- export action placement in the output workflow
- copy markdown action
- download `.md` action
- concise explanatory text that this output is Notion / Obsidian-ready

## Files

- output action area or a related export surface in `/generate`
- client helper for file download if needed

## Rules

- no OAuth or direct Notion write in this step
- no backend route unless client-only download proves insufficient
- keep the UI narrow and task-focused

## Check When Done

- users can copy or download the markdown export
- exported content comes from the shared serializer
- export UX stays lightweight
