# 63 — Strategy Comparison Reports

## Goal

Let users select 2–3 scripts from their library and ask Forge to produce a
structured **Comparison Report** — analysing trade-offs, market fit,
complementarity, and overlap between the strategies.

---

## Problem

Users accumulate a strategy library but have no structured way to reason about
how their strategies relate to each other. They re-generate similar scripts
without realising it, or run two strategies on the same asset without knowing
they share the same entry conditions.

---

## Solution

A new Forge conversation type `comparison` that:

1. Accepts 2–3 script IDs as the conversation seed
2. Forge loads the full scripts and metadata server-side (user cannot inject
   arbitrary content)
3. Produces a structured Comparison Report artifact
4. Saves the report as a new artifact type alongside scripts

---

## Comparison Report Schema

```ts
type ComparisonReport = {
  id: string
  userId: string
  title: string
  scriptIds: number[]           // 2–3 script IDs compared
  createdAt: Date

  // Report sections
  summary: string               // 2–3 sentence plain-English verdict
  entryLogicComparison: string  // how entry conditions differ
  riskProfileComparison: string // SL/TP approach, risk sizing differences
  marketConditionFit: {
    scriptId: number
    scriptTitle: string
    bestFor: string             // e.g. "Strong trending markets"
    avoidIn: string             // e.g. "Choppy, low-volume sessions"
  }[]
  coverageMap: {
    trendy: number | null       // scriptId best suited for trending
    ranging: number | null      // scriptId best suited for ranging
    breakout: number | null     // scriptId best suited for breakout
  }
  overlapAssessment: 'high' | 'medium' | 'low'
  overlapNotes: string
  recommendation: string        // which to use when, or how to combine
}
```

---

## DB Change

New table `comparison_reports`:

```sql
CREATE TABLE comparison_reports (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  script_ids  INTEGER[] NOT NULL,
  report      JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Migration: `0004_comparison_reports.sql`.

---

## Routes

- `POST /api/comparison-reports` — authenticated, accepts `{ scriptIds: number[] }`,
  calls Forge model, saves and returns the report
- `GET /api/comparison-reports` — lists user's reports (title, scriptIds, createdAt)
- `DELETE /api/comparison-reports/[reportId]` — ownership-checked delete

---

## Report Generation

`POST /api/comparison-reports`:

1. `protectAiRoute` — auth + rate limit + plan
2. Validate `{ scriptIds }` — must be 2 or 3, all positive integers
3. Load scripts from DB (`getScriptsByIds(userId, scriptIds)`) — ownership
   enforced; missing or foreign scripts → 400
4. Build a structured comparison prompt with both/all scripts included verbatim
5. `generateObject` against `comparisonReportLlmSchema` (Zod)
6. Re-validate output with strict `comparisonReportSchema`
7. Insert into `comparison_reports`, return the saved record

Input token budget: limit each script to 2000 characters for the comparison
call (truncate with a `// [truncated]` comment). Full scripts would exceed
context for 3-way comparisons.

---

## UI Entry Point

### From history drawer

New "Compare" action on script entries when ≥2 scripts are checked
(multi-select mode):

- Checkbox mode: user checks 2–3 entries → "Compare Selected" appears in
  the drawer footer
- Clicking opens the Comparison Report flow (Forge page or inline modal TBD)

### From Forge

"Start a comparison" intent phrase in the empty state + Forge can offer to
compare two scripts mentioned by name in a general conversation.

---

## Report Display

A dedicated `/reports` page or a "Reports" section within the Forge sidebar:

- Report header: 2–3 fingerprint badges (from spec `62`) + report title
- Sections rendered with the same structured-markdown style used in Backtest
  Summary panels
- Coverage Map: a simple 3-cell visual row (Trending / Ranging / Breakout)
  with the winning script's fingerprint in each cell
- Overlap badge uses the semantic state tokens from `context/ui-context.md`:
  - Low overlap (diversified, positive) → neon (`text-neon-400` + `border-neon-500/40` + `bg-neon-500/10`)
  - Medium overlap (warning) → amber (`text-amber-400` + `border-amber-500/30` + `bg-amber-500/10`)
  - High overlap (negative) → rose (`text-rose-400` + `border-rose-500/40` + `bg-rose-500/10`)
- "Refine a strategy" CTA from the recommendation section

---

## Guardrails

- Comparison prompt includes the standard `FORGE_GUARDRAILS` block
- No market price data in the comparison — structural/logic analysis only
- Output validation with strict Zod schema before DB write

---

## Out of Scope (This Spec)

- Comparing more than 3 scripts
- Automated periodic comparison suggestions
- Sharing reports externally (can be added to Snapshot Export in spec `66`)

---

## Affected Files

New:
- `app/api/comparison-reports/route.ts`
- `app/api/comparison-reports/[reportId]/route.ts`
- `app/reports/page.tsx`
- `components/reports/ComparisonReportCard.tsx`
- `components/reports/CoverageMap.tsx`
- `lib/db/comparison-reports.ts`
- `lib/ai/prompts/comparison-report.ts`
- `drizzle/migrations/0004_comparison_reports.sql`

Modified:
- `drizzle/schema.ts` — new `comparisonReports` table definition
- `components/strategy/ScriptHistory.tsx` — multi-select + Compare action
- `components/forge/ForgeSidebar.tsx` — Reports section link

---

## Success Criteria

- User can select 2 or 3 scripts from history and trigger a comparison
- Report is generated, validated, and saved to DB
- Report renders with all structured sections
- Coverage Map and overlap badge display correctly
- Ownership enforced: user cannot compare other users' scripts
- `npm run build` passes
