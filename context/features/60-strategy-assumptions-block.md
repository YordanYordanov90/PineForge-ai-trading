# 60 — Strategy Assumptions Block

## Goal

Every generated strategy includes an explicit **Assumptions** section in the
Breakdown tab, listing the market conditions and operational requirements the
strategy relies on to function as intended.

---

## Problem

AI-generated strategies are often used in wrong conditions because nothing
explicitly states what conditions the strategy assumes. Users blame the tool
when the real issue is context mismatch (trending vs ranging, illiquid asset,
high-spread environment, etc.).

---

## Solution

Extend the generation prompt to instruct the model to produce a structured
assumptions block as part of its output. Expose this block as a dedicated
named section in the Breakdown tab alongside the existing Checklist and
Breakdown sections.

---

## Prompt Change

Add to the Pine Script generation system prompt:

```
After the Pine Script code, output a section delimited by:
=== ASSUMPTIONS ===
[content]
=== END ASSUMPTIONS ===

The assumptions section must list, in plain English bullet points:
- Market regime the strategy is designed for (trending / ranging / breakout)
- Suitable asset types (e.g. liquid large-cap, crypto, forex majors)
- Timeframe sensitivity notes
- Spread / commission sensitivity (tight / any)
- Any external condition that is NOT encoded in the script logic
```

The parser strips and stores this block separately from the Pine Script output
so assumptions never appear in the copy/download artifact.

---

## Output Shape

```ts
type StrategyAssumptions = {
  items: string[]   // each bullet point from the assumptions block
  raw: string       // the raw trimmed text between delimiters
}
```

---

## Parser

New pure function `parseAssumptionsBlock(rawOutput: string)` in
`lib/ai/parse-assumptions.ts`:

- Extracts content between `=== ASSUMPTIONS ===` and `=== END ASSUMPTIONS ===`
- Parses bullet points (lines starting with `-` or `•`)
- Returns `StrategyAssumptions | null` (null if block absent or empty)
- Strips the block from the returned Pine Script string

---

## UI

A new named section in the Breakdown tab (rendered between the existing
Breakdown content and the Checklist):

- Header: `Assumptions` with a `AlertCircle` icon
- Bullet list of assumption items
- Amber tint (same styling as "Common Failure Modes" in the Backtest panel)
- Empty state if assumptions are not present (older scripts without the block)
- No separate tab — this lives within the existing Breakdown tab

---

## Health Score Integration

The Health Score prompt is extended to reference assumptions:

```
If the script includes an Assumptions block, cross-reference strategy risks
against the stated assumptions. Flag if the strategy logic contradicts its
own assumptions (e.g. assumes trending market but uses RSI in ranging mode).
```

---

## Backward Compatibility

Scripts generated before this spec have no assumptions block. The UI shows a
neutral empty state ("No assumptions recorded — regenerate to get an analysis")
without error.

---

## Out of Scope (This Spec)

- User-editable assumptions
- Assumptions stored in the DB (stored in script `metadata` jsonb is sufficient
  for retrieval if needed later)
- Backtest Summary referencing assumptions (a natural follow-up)

---

## Affected Files

New:
- `lib/ai/parse-assumptions.ts` — `parseAssumptionsBlock()`

Modified:
- `lib/ai/prompts/generate.ts` — extend system prompt with assumptions block instruction
- `app/api/generate/route.ts` — call `parseAssumptionsBlock`, pass clean script to
  stream, attach assumptions to response metadata
- `lib/types/index.ts` — add `assumptions: StrategyAssumptions | null` to `SavedScript`
- `drizzle/schema.ts` — store assumptions in `scripts.metadata` jsonb (no migration
  needed; jsonb is already nullable/flexible)
- `components/strategy/BreakdownTab.tsx` — render `AssumptionsSection`
- `components/strategy/AssumptionsSection.tsx` — new component
- `lib/ai/prompts/health-score.ts` — cross-reference assumptions in scoring prompt

---

## Success Criteria

- New generations include an assumptions block
- Block is stripped from the Pine Script copy/download artifact
- Assumptions section renders in the Breakdown tab
- Health Score references assumptions in risk analysis
- Old scripts without a block show a neutral empty state
- `npm run build` passes
