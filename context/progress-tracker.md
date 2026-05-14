# Progress Tracker

Update this file after every meaningful implementation change.

---

## What Has Been Done So Far

GrokTS is built as a Next.js 16 App Router application with Tailwind CSS v4,
shadcn/ui, and xAI Grok via the Vercel AI SDK. Work to date delivers the full
core generator experience: marketing landing page, live streaming Pine Script
generation, syntax highlighting, script validation, history, and refinement.

**Phase 1 — Core Polish (Complete)**
The landing page at `/` includes a sticky navbar with emerald scroll progress
bar, hero section with terminal mock, feature grid, how-it-works section, code
preview, and CTA. The generator at `/generate` has a two-column layout
(lg:grid-cols-[1fr_1.05fr]), 8 template pills, strategy textarea, model selector
(Reasoning / Fast / Grok-4), Advanced Options collapsible (timeframe, market,
direction, indicators, R:R slider), balance input, and Generate button. The
output card streams live with skeleton rows, a "Streaming" badge during
generation, validator badge post-stream (green / amber), generation stats
(time + token estimate), and Download `.pine` + Copy buttons. The
`/api/generate` route validates all input with Zod before any LLM call and
returns a sanitized error on failure. The `/api/improve-prompt` route rewrites
raw descriptions into structured prompts.

**Phase 2 — Daily Driver Features (Complete)**
Script History is implemented as a localStorage-backed shadcn Sheet drawer
(max 50 FIFO entries) with load, rename, and delete actions. Refine Chat sits
below the output card and POSTs to `/api/refine-script`, streaming a full
replacement script with versioning (version = lastVersion + 1, parentId = root).
Multi-tab output (Script / Breakdown / Checklist) is live. TradingView Webhook
JSON export is implemented.

**Phase 3 — Polish & Trust (partial)**
Live character count with warning/danger thresholds on the strategy textarea
(`StrategyInputsCard`). **Keyboard shortcuts:** document-level **Ctrl/Cmd+Enter**
runs generate when the command palette is closed; **Ctrl/Cmd+K** toggles the
command palette (`GeneratorCommandMenu` + shadcn `CommandDialog`). Palette
actions: generate, improve prompt, open history, stop, copy, download, output
tabs, focus strategy field, go to landing. Script History Sheet `open` state is
controlled from `GenerateExperience` so the palette can open the drawer.

**Current Security State**
Zod validation and sanitized errors are in place on all API routes. CSP header
added in `next.config.ts`. SEC-001 (no IP rate limiting on AI routes) is the
only open HIGH issue — planned for Phase 3/4.

---

## Current Phase

Phase 3 — Polish & Trust (in progress)

## Current Goal

Continue Phase 3 polish items (theme toggle, comparison, etc.).

## Completed

- Phase 1 — Core Polish ✅
- Phase 2 — Daily Driver Features ✅
- `13-char-count.md` — Live character count with color thresholds (inputs card) ✅
- `14-keyboard-shortcuts.md` — Ctrl/Cmd+Enter generate, Ctrl/Cmd+K command palette ✅

## In Progress

- None.

## Next Up

- `15-theme-toggle.md` — Dark / light toggle via next-themes
- `16-strategy-comparison.md` — Side-by-side diff view
- SEC-001 fix — IP rate limiting on `/api/generate`, `/api/refine-script`, `/api/explain-script`

## Open Questions

- Phase 3: Is strategy comparison (diff view) worth the complexity before Phase 4 auth lands?
- SEC-001: Middleware-level IP throttle now, or wait and do it properly with Upstash in Phase 4?
- COPY-001: Align remaining landing copy with current Grok branding (hero uses Grok-4)

## Architecture Decisions

- **shiki post-stream only**: shiki is a static highlighter — never applied during streaming
  to avoid layout shift. Applied once when `isGenerating` transitions to false.
- **localStorage before Postgres**: History in localStorage for Phase 1–3. Migrates to
  Neon Postgres + Drizzle in Phase 4 when Clerk auth lands. localStorage access always
  wrapped in try/catch.
- **Zod on every route**: All API inputs validated with Zod before any LLM call.
  generateSchema, refineScriptSchema, improvePromptSchema, explainScriptSchema all live
  in `lib/validation.ts`.
- **Sanitized errors only**: Raw LLM errors and stack traces never reach the client.
  All routes return user-friendly messages.
- **CSP header**: Added in `next.config.ts` as first security layer.
- **Command palette**: `/generate` only; global `keydown` on `window` in
  `StrategyForm` for Ctrl/Cmd+K (toggle) and Ctrl/Cmd+Enter (generate when
  palette closed). Uses `cmdk` via shadcn `CommandDialog`.

## Session Notes

- Build passes after Phase 3 shortcuts (command palette) implementation
- Audit report (report.md) has 1 HIGH (SEC-001) and 4 MEDIUM open items
- A11Y-001: ModelSelector needs radiogroup semantics
- A11Y-002: LandingCodePreview decorative Copy div needs fix
- NEXT-001: Root `app/error.tsx` and `app/loading.tsx` present (tracker was stale)
- COPY-001: Align remaining landing copy with current Grok branding (hero uses Grok-4)
