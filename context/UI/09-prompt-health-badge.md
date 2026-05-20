# 09 — Prompt Health Badge

Add a lightweight client-side prompt quality signal near the strategy input.
This spec owns heuristic prompt guidance only.

## Goal

Help users notice weak prompts before they hit Generate, without blocking normal
use or requiring an API call.

## Scope

- client-only heuristic badge with red / yellow / green states
- heuristic based on prompt length and presence of common strategy details
- placement near the current character-count area

## Files

- `components/strategy/StrategyInputsCard.tsx`
- optional `lib/prompt/prompt-health.ts`

## Rules

- Do not block generation unless the existing hard limits already block it
- Keep heuristics simple and explainable
- No backend or AI call in this step

## Check When Done

- Badge updates live as the prompt changes
- Users can understand the signal quickly
- Existing character-count behavior remains intact
