# 04 — Health Next Step Refine

Connect Health Score next steps to the refine workflow. This spec owns the
diagnosis-to-action bridge only.

## Goal

Let users act on Health Score recommendations in one click without auto-running
refinement.

## Scope

For each Health Score next-step item:

- show a small `Refine` action
- prefill the refine textarea with that suggestion
- scroll/focus the refine section
- do not auto-submit

## Files

- `components/strategy/HealthScorePanel.tsx`
- `components/strategy/RefineChat.tsx`
- `components/strategy/StrategyForm.tsx`
- `components/strategy/StrategyOutputCard.tsx`

## Rules

- Use a `prefillInstruction` / nonce pattern or equivalent deterministic trigger
- Keep next-step text editable by the user before submit
- Do not change Health Score generation logic in this step

## Check When Done

- Each next step can prefill the refine input
- Focus/scroll lands the user in the refine area
- No auto-submit happens
