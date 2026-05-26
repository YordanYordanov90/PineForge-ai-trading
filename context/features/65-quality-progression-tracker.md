# 65 — Quality Progression Tracker

## Goal

A lightweight personal dashboard showing how a user's strategies have improved
over time — built entirely from data the app already collects.

---

## Problem

Users generate and refine strategies over weeks but have no way to see whether
they are improving. There is no feedback loop beyond individual Health Scores.
A progression view creates an intrinsic motivation loop: "my average score
went from 6.2 to 7.8 this month."

---

## Solution

A dedicated `/progress` page (or a modal panel accessible from the generator
header) that aggregates existing data — Health Scores stored in script metadata,
refinement version counts, and Forge memory — into a structured quality
overview.

No new AI calls. No new external data. Pure aggregation over what is already
in the database.

---

## Dashboard Sections

### 1. Health Score Trend

- Average Health Score per week for the last 8 weeks (line chart using
  `recharts` or lightweight-charts — prefer lightweight-charts for terminal
  aesthetic consistency)
- Total scripts generated this month vs last month
- Highest Health Score ever achieved (with a link to that script)

Data source: `scripts.metadata.healthScore` (already stored when a user runs
Health Score on a script).

### 2. Common Risk Themes

Aggregates all Health Score `risks` strings from the user's history and
surfaces the top 3 recurring themes:

```
Most common risks in your strategies:
1. Missing volume filter (found in 8 of 14 scored strategies)
2. No secondary confirmation signal (5 of 14)
3. Fixed stop-loss without ATR adjustment (4 of 14)
```

Uses simple keyword grouping (not AI — a static set of ~20 known risk theme
patterns from the Health Score prompt vocabulary).

### 3. Refinement Depth

- Average number of refinement versions per script (measures iteration habit)
- Scripts with highest version count (with links)
- "Deep refiners" badge if average version > 3

Data source: `scripts.version` + `scripts.parent_id` lineage chain.

### 4. Forge Memory Insight

Pulls from the user's `agent_memory` profile and surfaces 2–3 plain-English
observations:

```
Based on your Forge conversations:
• You've shifted toward multi-indicator strategies over the last month
• Your preferred timeframe has moved from 15m to 1h
• You've been focusing more on crypto markets recently
```

Data source: `agent_memory` table — already populated by spec `56`.

### 5. Activity Heatmap (optional, v2)

GitHub-style contribution grid: one cell per day, shaded by number of
generations/refinements. Visual identity strongly matches terminal aesthetic
with **neon (`#c8ff00`)** cells stepped by opacity (e.g. `bg-neon-500/15`,
`/30`, `/55`, `/80`) over a `bg-zinc-900` (dark) / `bg-zinc-100` (light) base.
No emerald.

---

## Data Aggregation

New DB helper `lib/db/progress-stats.ts`:

```ts
async function getProgressStats(userId: number): Promise<ProgressStats>
```

Runs 3–4 targeted queries:
1. Health scores by week: `SELECT metadata->>'healthScore', created_at FROM scripts WHERE user_id = ? ORDER BY created_at`
2. Version depths: `SELECT version, parent_id FROM scripts WHERE user_id = ?`
3. Agent memory: `SELECT * FROM agent_memory WHERE user_id = ?`

All queries scope by `userId` first. No cross-user aggregation.

---

## Route

`GET /api/progress` — authenticated data route, returns `ProgressStats`:

```ts
type ProgressStats = {
  weeklyHealthScores: { week: string; avg: number; count: number }[]
  topRiskThemes: { theme: string; count: number }[]
  avgRefinementDepth: number
  mostRefinedScripts: { id: number; title: string; version: number }[]
  memoryInsights: string[]
  totalScripts: number
  totalScoredScripts: number
}
```

---

## Page

`app/progress/page.tsx` — RSC that loads `ProgressStats` server-side and
passes to the client component `ProgressDashboard`.

Protected: requires Clerk session. Unsigned users see the landing page.

---

## Entitlement

- Free users: Health Score Trend + Common Risk Themes (the two highest-value
  sections)
- Pro users: full dashboard including Refinement Depth, Forge Memory Insight,
  and future Activity Heatmap

---

## Out of Scope (This Spec)

- Real-time progress updates (polling or WebSocket)
- Comparative benchmarks against other users
- Exporting the progress report
- Activity Heatmap (deferred to v2)

---

## Affected Files

New:
- `app/progress/page.tsx`
- `components/progress/ProgressDashboard.tsx`
- `components/progress/HealthScoreTrendChart.tsx`
- `components/progress/RiskThemesPanel.tsx`
- `components/progress/RefinementDepthPanel.tsx`
- `components/progress/MemoryInsightsPanel.tsx`
- `lib/db/progress-stats.ts`
- `app/api/progress/route.ts`
- `lib/progress/risk-theme-patterns.ts` — static keyword pattern set

Modified:
- `proxy.ts` — no change (protected implicitly via route handler)
- `components/generate/GenerateExperience.tsx` — optional "View Progress" link
  in header

---

## Success Criteria

- `/progress` loads without error for a user with ≥3 scripts
- Health Score Trend chart renders correctly (or empty state if no scored scripts)
- Risk Themes correctly aggregate from stored Health Score metadata
- Forge Memory Insight surfaces non-empty observations if memory exists
- Free vs Pro sections gated correctly
- `npm run build` passes
