# 64 — Strategy Variants Quick-Generate

## Goal

After a successful generation, offer a **"Generate Variants"** action that
produces 2–3 distinct variations of the same core strategy — each tuned
differently — in a single workflow step.

---

## Problem

Traders always want to test variations. The current workflow requires manually
rephrasing the prompt or using Refine Chat with explicit instructions. This is
friction that prevents systematic strategy exploration.

---

## Solution

A new output action "Generate Variants" that fires 2–3 parallel generation
requests, each with a modified prompt that targets a specific variation axis.
Results appear as a compact variant strip below the main output, each loadable
into the full generator for further refinement.

---

## Variant Axes

Three pre-defined axes — each produces one variant:

| Variant | Axis | What changes |
|---------|------|--------------|
| A | Risk profile | Tighter stops (0.5× current R:R), faster signals (shorter MA periods) |
| B | Signal quality | Wider stops (1.5× current R:R), fewer signals (longer MA periods, added filter) |
| C | Indicator swap | Alternative indicator for the same concept (EMA → VWAP, RSI → Stochastic, MACD → CCI) |

---

## Entitlement

- Free users: Variant A only (1 variant)
- Pro users: Variants A, B, and C (3 variants)

Server enforces: the variant generation route resolves the plan before
deciding how many variants to fire.

---

## Route

`POST /api/generate-variants`

Request:
```ts
{
  prompt: string
  script: string          // the original generated script
  model: GrokModelId
  balance: string | null
  structuredInputs: StructuredInputs
}
```

Response:
```ts
{
  success: true
  data: {
    variants: {
      axis: 'risk-tight' | 'signal-quality' | 'indicator-swap'
      label: string       // e.g. "Tighter Risk"
      script: string
      prompt: string      // the modified prompt used
    }[]
  }
}
```

The route fires 2–3 `generateText` calls in parallel (`Promise.all`) using
`Promise.allSettled` so one failure does not block the others. Failed variants
are excluded from the response; a partial result is valid.

This route does **not** stream — variants are shorter and the wait is acceptable
for the UX (spinner + "Generating 3 variants...").

---

## Prompt Strategy per Variant

Each variant call adds a modifier block to the original prompt:

**Variant A — Risk Tight:**
```
[Original prompt + structured inputs]

VARIANT MODIFIER: Adjust this strategy for tighter risk management.
Reduce all stop-loss distances by approximately 40%. Use faster-period
versions of any moving averages (reduce all periods by 30%). Keep the
core entry logic identical.
```

**Variant B — Signal Quality:**
```
[Original prompt + structured inputs]

VARIANT MODIFIER: Adjust this strategy for higher signal quality with
fewer, more reliable entries. Widen stop-loss distances by approximately
50%. Add a secondary confirmation filter (volume spike, trend filter, or
longer-period MA) to reduce false signals. Keep the core entry logic identical.
```

**Variant C — Indicator Swap:**
```
[Original prompt + structured inputs]

VARIANT MODIFIER: Replace the primary momentum/trend indicator with a
comparable alternative. If using EMA/SMA → use VWAP or Hull MA instead.
If using RSI → use Stochastic RSI instead. If using MACD → use CCI or
Williams %R instead. Keep the same logical structure; only swap the
indicator family.
```

---

## UI

A collapsible **Variants** strip below the main output card, appearing only
after "Generate Variants" is clicked:

- Shows a `Layers` icon + "3 Variants" label when collapsed
- Expanded: 3 compact cards in a horizontal row (or vertical on mobile)
- Each card: variant label, a short 3-line Pine Script preview, "Load" button
- "Load" copies the variant into the main generator output, creating a new
  history entry with lineage set to the original script
- Pro lock overlay on Variant B and C for free users

---

## History Integration

Each loaded variant is saved as a new `SavedScript` with:
- `parentId`: the original script's DB id
- `version`: `parent.version + 1`
- `metadata.variantAxis`: `'risk-tight' | 'signal-quality' | 'indicator-swap'`
- Title auto-set: `[original title] — [Variant Label]`

---

## Rate Limiting

Variant generation counts as 1 AI action per variant against the user's daily
quota (same as a standard generation). The route deducts from the quota before
firing the parallel calls. Free users (1 variant) = 1 deduction; Pro users
(3 variants) = 3 deductions.

---

## Out of Scope (This Spec)

- Streaming variants
- User-defined variant axes
- Auto-variant on generation (always opt-in)
- Comparing variants directly (use spec `63`)

---

## Affected Files

New:
- `app/api/generate-variants/route.ts`
- `components/strategy/VariantStrip.tsx`
- `components/strategy/VariantCard.tsx`
- `lib/ai/prompts/variants.ts` — variant modifier blocks

Modified:
- `components/strategy/StrategyOutputCard.tsx` — "Generate Variants" action
- `hooks/strategy/useStrategyGenerationSession.ts` — variant strip open state
- `lib/auth/model-entitlement.ts` — variant count by plan

---

## Success Criteria

- "Generate Variants" appears after a successful generation
- Free users see 1 variant; Pro users see 3
- Each variant is a valid Pine Script
- "Load" saves the variant as a new history entry with lineage
- One failed variant does not block the others
- Rate limiting deducts correctly per variant
- `npm run build` passes
