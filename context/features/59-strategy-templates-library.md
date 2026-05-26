# 59 — Strategy Templates Library

## Goal

Ship a curated library of 20–50 high-quality Pine Script templates that serve
as starting points for users — replacing the 8 static template pills with a
full, browsable `/templates` page and a richer in-generator experience.

---

## Problem

The current 8 template pills are useful but shallow. New users face a blank
textarea with no sense of what "good" looks like. Experienced users outgrow
the pills quickly. There is no place to explore strategy patterns before
committing to generation.

---

## Solution

A product-curated templates library:

- `/templates` page: browsable grid with filtering by style, market, timeframe,
  and difficulty
- Each template is a complete, reviewed Pine Script with full metadata
- Pre-computed output: Health Score, Backtest Summary, and Alert Templates
  already generated and stored alongside the template
- One-click "Use as base" loads the template into `/generate` (pre-fills
  description, structured inputs, and script) for customisation
- Free users get a curated subset (≤10); Pro users get the full library

---

## Template Schema

Each template record contains:

```ts
type StrategyTemplate = {
  id: string                  // slug, e.g. "ema-crossover-trend"
  title: string
  description: string         // plain-English explanation
  tags: string[]              // e.g. ["trend", "ema", "beginner"]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  market: string              // e.g. "Crypto", "Forex", "Any"
  timeframe: string           // e.g. "15m", "1h", "Daily"
  direction: 'Long' | 'Short' | 'Both'
  script: string              // full Pine Script v5
  prompt: string              // the description text to pre-fill
  structuredInputs: StructuredInputs
  healthScore: HealthScoreResult | null
  backtestSummary: BacktestSummaryResult | null
  alertTemplates: AlertTemplatesResult | null
  isPro: boolean
}
```

---

## Data Strategy

Templates are **static data** — not stored in the database per user. Options:

1. **JSON file in the repo** (`lib/templates/templates.json`) — simple, no DB
   migrations, content ships with the build. Best for v1.
2. **Drizzle `templates` table** — enables admin CMS, usage analytics,
   per-template ratings later. Best for v2.

Start with option 1. The schema above is stable enough that migrating to a DB
table later is a single migration step.

---

## Routes

- `GET /templates` — public page, server-rendered, full browsable grid
- `/generate?templateId=ema-crossover-trend` — query param pre-loads a
  template into the generator without a new API route

---

## UI Breakdown

### `/templates` page

- Sticky filter bar: All / Trend / Mean-Reversion / Breakout / Scalping /
  Swing / Multi-Timeframe
- Difficulty filter: All / Beginner / Intermediate / Advanced
- Template cards: title, difficulty badge, market + timeframe chips, brief
  description, Health Score badge, "Use as base" CTA
- Pro badge on locked templates for free users (upgrade CTA on click)
- Follows terminal design language: zinc surfaces, **neon accent (`#c8ff00`)**
  on the primary CTA only. Metadata badges (difficulty, Health Score, market,
  timeframe, direction, Pro) use the **Muted Metadata Badge** pattern from
  `context/ui-context.md` — they are **not** color-coded by value
  (no green-for-beginner / red-for-advanced, no green-for-high-score). Use the
  shared `.pf-improve-prompt-btn` utility for the "Use as base" CTA so light
  and dark modes stay in parity.

### In-generator: template preview

When loaded via `?templateId`, the generator shows:
- A dismissable banner: "Loaded from template: [Title]"
- Script pre-loaded into the output panel (ready to refine)
- Structured inputs pre-filled (market, timeframe, direction, indicators)
- Prompt pre-filled in the textarea

---

## Entitlement Rules

- Free: access to templates tagged `isPro: false` (first 10 in curated order)
- Pro: full library
- Server enforces: `?templateId` for a Pro template from a free user returns
  a 403 and shows an upgrade prompt

---

## Out of Scope (This Spec)

- User-submitted templates
- Community ratings or comments
- Template versioning
- "Featured template of the week" rotation (can be a later editorial addition)

---

## Affected Files

New:
- `app/templates/page.tsx` — RSC, server-rendered
- `app/templates/[templateId]/page.tsx` — individual template detail
- `components/templates/TemplateGrid.tsx`
- `components/templates/TemplateCard.tsx`
- `components/templates/TemplateFilterBar.tsx`
- `lib/templates/templates.ts` — typed static data + lookup helpers
- `lib/templates/template-data.json` — raw template records

Modified:
- `app/api/generate/route.ts` — accept optional `templateId` to resolve
  structured inputs server-side
- `components/strategy/StrategyInputsCard.tsx` — banner when template is active
- `lib/auth/model-entitlement.ts` — extend for template entitlement check
- `next.config.ts` — no changes expected

---

## Success Criteria

- 20+ templates ship in v1
- Each template has Health Score + Backtest Summary pre-computed
- "Use as base" → generator flow works end-to-end
- Free / Pro entitlement enforced server-side
- `npm run build` passes
