# 30 — Alert Message Templates UI

Build the Alert Message Templates user interface on `/generate`. This step owns
components, loading/error states, copy interactions, and local UI state only.
Do not add backend logic here beyond calling the finished API contract.

## Prerequisites

- `28-alert-templates-overview.md` is complete
- `29-alert-templates-backend.md` is complete
- Existing output tab or panel patterns are in place

## Goal

Let the user generate and review provider-specific webhook JSON templates
without leaving the output experience.

## Placement

Add Alert Message Templates inside the existing output workflow.

Recommended shape:

- add a new output tab: `Alerts`
- show a primary trigger in the tab empty state: `Generate Alert Templates`

Preferred behavior:

- the `Alerts` tab appears only when a script exists
- the user runs generation manually from the empty state
- once results exist, provider templates render as selectable sections or stacked cards

## States

Support these states:

- **Empty** — no templates generated yet
- **Loading** — generation in progress
- **Success** — provider templates visible
- **Error** — sanitized error with retry action

When a new script is generated or a refinement replaces the current script:

- clear prior alert template state
- return the tab to empty state

## UI Content

For each provider, render:

- provider name
- short description
- formatted JSON code block
- copy button
- notes list
- placeholders list

The UI should feel operational and copy-first, not chatty.

## Component Guidance

Keep concerns separated:

- hook for API call + state
- presentational panel for result rendering
- provider template card/list component if needed

Possible file targets:

- `components/strategy/AlertTemplatesPanel.tsx`
- `components/strategy/AlertTemplateCard.tsx`
- `hooks/useAlertTemplates.ts`

Follow existing patterns for:

- code-style display surfaces already used in output areas
- Sonner copy feedback
- inline loading and inline error
- `lucide-react` icons
- Tailwind tokens from `context/ui-context.md`

## Interaction Rules

- Disable generate trigger while request is in flight
- Prevent running when no script exists
- Allow copying one provider template at a time
- Retry should reuse the current script context without regeneration
- Keep other output tabs usable while alert templates are loading

## Visual Direction

Use the existing PineForge dark terminal look:

- zinc panel surfaces
- emerald accent for primary actions and active selection
- code block treatment consistent with Pine output styling
- no hardcoded hex values

If provider switching is added, use restrained segmented or tab-like controls,
not large decorative cards.

## Accessibility

- Tab label must remain concise: `Alerts`
- Copy buttons need accessible labels per provider
- JSON blocks should remain readable and selectable
- Loading and error states should be announced clearly
- Lists for notes and placeholders should use semantic markup

## Scope Limits

- No broker logo work required in v1
- No inline JSON editing in this step
- No provider credential forms
- No persistence across reloads
- No changes to unrelated output tabs

## Check When Done

- Alerts tab appears when a script exists
- User can generate provider templates without leaving `/generate`
- Each provider template can be copied individually
- Loading, error, and success states render correctly
- Template state clears when the current script changes
- Styling matches PineForge UI tokens and existing output patterns
- `npm run build` passes
