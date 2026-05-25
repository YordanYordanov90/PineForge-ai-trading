# 61 — Research → Generate Pipeline

## Goal

Elevate Forge's existing web-search capability into a first-class **Research**
workflow with a direct handoff into the generator — so users can research a
strategy concept in Forge and then generate it in `/generate` without losing
the context they built.

---

## Problem

Forge already has web-search as a tool, but it is buried inside general
conversations. There is no dedicated entry point that signals "start here if
you want to research before you build." More importantly, there is no handoff:
users who research in Forge must manually re-type the insights they gathered
when they switch to `/generate`.

---

## Solution

1. A new **conversation type** `research` in Forge — visually distinct, with a
   system prompt that emphasises strategy research over workflow orchestration
2. A **"Generate from Research"** action at the end of a research thread that
   pre-fills `/generate` with a structured prompt derived from the conversation
3. Research threads are still persisted as normal `agent_conversations` rows —
   just with `type: 'research'` distinguishing them in the sidebar

---

## Conversation Type: `research`

### DB change

Add `type: 'general' | 'research'` column to `agent_conversations` table via
a new Drizzle migration. Default: `'general'` (backward compatible).

### System prompt variant

When `type === 'research'`, a research-specific system prompt variant replaces
the default Forge system prompt. The research prompt:

- Emphasises: indicator deep-dives, strategy pattern comparisons, Pine Script
  technique research, historical strategy performance patterns
- De-emphasises: direct script generation (user should do that in `/generate`)
- Instructs Forge to synthesise a "Research Summary" at natural conclusion
  points, with sections: Concept, Key Indicators, Recommended Market/Timeframe,
  Risk Considerations, Suggested Implementation Approach
- Still enforces the full guardrail set from spec `58`

---

## "Generate from Research" Action

Appears as a persistent action button in the research conversation footer once
at least 2 Forge turns have occurred.

### Flow

1. User clicks "Generate from Research"
2. Client calls `POST /api/forge/research-summary` with the `conversationId`
3. Route calls the model with a short summarisation prompt over the conversation
   messages and returns a structured payload:
   ```ts
   type ResearchSummaryPayload = {
     description: string       // pre-fills strategy textarea
     market: string | null
     timeframe: string | null
     direction: 'Long' | 'Short' | 'Both' | null
     indicators: string[]
     researchNotes: string     // stored in script metadata for traceability
   }
   ```
4. Client navigates to `/generate` with these values serialised as query params
   (or via sessionStorage to avoid URL length limits)
5. Generator detects the incoming research payload and pre-fills inputs +
   shows a dismissable banner: "Pre-filled from Forge research"

### Guardrails on the summarisation route

- `protectAiRoute` — same as all AI routes
- Input: only the `conversationId`; messages are loaded server-side from DB
  (user cannot inject arbitrary messages)
- Output: validated with Zod `researchSummaryPayloadSchema` before returning

---

## Sidebar UI Changes

Research conversations get:
- A `FlaskConical` icon instead of the default `MessageSquare` icon
- A `RESEARCH` badge in the conversation list
- "New Research" CTA alongside the existing "New Conversation" button in the
  Forge sidebar

---

## Pre-fill Handoff in `/generate`

New util `lib/research/read-research-handoff.ts`:
- Reads from sessionStorage key `pineforge_research_handoff`
- Returns `ResearchSummaryPayload | null`
- Called once on `GenerateExperience` mount; clears sessionStorage after read

`StrategyInputsCard` checks for a handoff on mount and:
- Pre-fills the strategy textarea with `description`
- Sets structured inputs (market, timeframe, direction, indicators)
- Shows a dismissable amber banner: "Pre-filled from Forge research — edit as needed"

---

## Out of Scope (This Spec)

- Saving the research summary as a standalone artifact
- Linking research conversations to generated scripts in the DB (traceability
  via `script.metadata.researchConversationId` is sufficient for now)
- Search filtering research vs general conversations (can follow later)

---

## Affected Files

New:
- `app/api/forge/research-summary/route.ts`
- `lib/research/read-research-handoff.ts`
- `lib/ai/prompts/forge-research.ts` — research variant system prompt

Modified:
- `drizzle/schema.ts` — `type` column on `agent_conversations`
- `app/api/forge/conversations/route.ts` — accept `type` on create
- `lib/agent/system-prompt.ts` — branch on `conversationType`
- `components/forge/ForgeSidebar.tsx` — research icon + badge + "New Research" CTA
- `components/forge/ForgeComposer.tsx` — "Generate from Research" action button
- `components/generate/GenerateExperience.tsx` — read research handoff on mount
- `components/strategy/StrategyInputsCard.tsx` — research pre-fill banner

---

## Success Criteria

- User can start a "Research" conversation from the Forge sidebar
- Forge uses the research-optimised system prompt for these threads
- "Generate from Research" produces a structured payload and navigates to `/generate`
- `/generate` pre-fills all available fields from the research payload
- Pre-fill banner is dismissable and does not re-appear on reload
- DB migration applies cleanly; existing conversations default to `'general'`
- `npm run build` passes
