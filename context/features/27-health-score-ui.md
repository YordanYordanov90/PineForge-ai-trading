# 27 — Strategy Health Score UI

Build the Strategy Health Score user interface on `/generate`. This step owns
components, loading/error states, user triggers, and local UI state only. Do not
add backend logic here beyond calling the finished API contract.

## Prerequisites

- `25-health-score-overview.md` is complete
- `26-health-score-backend.md` is complete
- Existing output card / tab patterns are in place

## Goal

Let the user request a Health Score from the current generated script and review
the result in a compact, high-signal UI that matches PineForge's dark terminal
design system.

## Placement

Add Health Score within the existing generator output experience.

Recommended shape:

- Add a new output tab: `Health`
- Add a trigger button in the output header or inside the Health tab empty state:
  `Run Health Score`

Preferred behavior:

- The `Health` tab appears only when a script exists
- The user can run analysis from the tab empty state
- Once results exist, the tab shows the score card and notes

## States

Support these states cleanly:

- **Empty** — no health score run yet
- **Loading** — request in progress
- **Success** — score and notes visible
- **Error** — sanitized error text with retry action

When a new script is generated or a refinement replaces the current script:

- clear previous Health Score state
- return the Health tab to empty state

## UI Content

Render:

- large numeric score (`1` to `10`)
- short verdict label beside or below the score
- one concise summary block
- `Strengths` list
- `Risks` list
- `Next Steps` list

The layout should feel like a trading diagnostic panel, not a chat transcript.

## Component Guidance

Keep responsibilities split:

- hook for API call + state
- presentational panel for result rendering
- lightweight trigger button component only if reuse helps

Possible file targets:

- `components/strategy/HealthScorePanel.tsx`
- `hooks/useHealthScore.ts`
- tab wiring in the existing output experience component

Follow existing patterns for:

- Sonner toast only where already appropriate
- inline loading and inline error in the panel
- `lucide-react` icons
- Tailwind tokens from `context/ui-context.md`

## Visual Direction

Use existing dark surfaces and emerald accent tokens:

- card surface: zinc panel treatment already used in generator
- score: emerald-forward when present
- risks: use warning/error token language already established
- no hardcoded hex values

The score should be visually prominent, but the notes should remain easy to scan.

## Interaction Rules

- Disable the trigger while analysis is running
- Prevent running when no script exists
- Keep the rest of the output UI usable during analysis
- Retry should reuse the current script context without requiring regeneration

## Accessibility

- Tab label must remain concise: `Health`
- Loading state must announce progress in a readable way
- Lists need semantic markup
- Buttons need clear disabled states and visible focus styles

## Scope Limits

- No redesign of the whole output card
- No persistence across reloads in this step
- No automatic score refresh
- No charts, gauges, or animated meter UI
- No changes to unrelated tabs

## Check When Done

- Health tab appears when a script exists
- User can run Health Score without leaving `/generate`
- Loading, error, and success states all render correctly
- Score clears when the current script changes
- Styling matches existing PineForge UI tokens and patterns
- `npm run build` passes
