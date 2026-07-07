# PineForge Deep Overview

## What This Document Is

This is a detailed learning guide for the current PineForge codebase. It is
meant to help you understand:

- what the app is for
- who it is built for
- how the user flow works
- how the frontend and backend are structured
- how data moves through the system
- why certain technical and product decisions were made

This document is intentionally limited to the parts that are already built or
actively wired into the current app. It reflects the completed Phase 5 (high-
/medium-value workflow features), Phase 6 (Forge Agent with memory, tools,
guardrails, and research handoff), and Phase 7 (Templates Library, Assumptions,
DNA fingerprints, Comparison Reports, Variants, Quality Tracker, Snapshot Export,
Contextual Tips, and full Keyboard Power User Mode) surface.

---

## 1. Product Summary

PineForge is an AI-powered Pine Script v5 generator for TradingView users. The
core idea is simple:

1. A trader describes a strategy in plain English.
2. PineForge turns that description into Pine Script.
3. The user can refine it, analyze it, organize it, and export it.

The product is not positioned as a general chatbot. It is built more like a
specialized strategy compiler for retail traders. That decision drives nearly
everything else in the codebase:

- the UI is focused on one main workflow instead of open-ended chat
- prompts are structured around Pine Script generation only
- output is optimized for copy/paste into TradingView
- supporting tools are tightly related to strategy quality and workflow

The app’s tagline captures that positioning well:

> Describe it. PineForge writes it. You trade it.

---

## 2. What Problem The App Solves

TradingView traders often have strategy ideas but get blocked by one or more of
these problems:

- they know the trading logic but not Pine Script syntax
- they can write some code, but Pine debugging is slow and tedious
- they want alerts, stop-loss, and take-profit logic without wiring it manually
- they want to iterate quickly instead of rewriting scripts from scratch
- they want one place to save, tag, group, and revisit scripts

PineForge solves that by reducing the workflow to a guided sequence:

- describe the idea
- optionally add structured constraints
- generate the script
- refine it
- inspect it with extra AI tools
- save and organize it
- move it into TradingView

This makes the product more of a workflow tool than a single AI endpoint.

---

## 3. Who The App Is For

The app is built for retail traders who already use TradingView and want to:

- prototype strategies quickly
- improve existing Pine scripts
- add structured risk logic
- get reusable output for alerts and testing
- build a personal library of strategy ideas

It is not built for:

- live trade execution
- broker connectivity
- market prediction
- portfolio management
- institutional quant research
- general-purpose AI chat

That boundary is important. The product is narrow by design, which helps the UI
stay focused, the prompts stay reliable, and the Forge Agent stays scoped to
strategy workflow instead of general trading chat.

---

## 4. What Exists In The App Today

The current project includes these major areas:

- marketing landing page at `/`
- authenticated app shell under the `(app)` route group with shared `AppNavbar`
- authenticated generator workspace at `/generate`
- authenticated Forge Agent workspace at `/forge`
- curated Strategy Templates Library at `/templates` (plus detail pages)
- Comparison Reports workspace at `/reports`
- Quality Progression dashboard at `/progress`
- AI generation, refine, improve-prompt, and explain routes
- supporting AI analysis routes: health-score, alert-templates, backtesting-summary, generate-variants, forge/research-summary
- script explanation output tabs (Script / Breakdown with Assumptions / Health / Backtest / Alerts / Compare)
- full set of Phase 5 workflow tools (Health Score, Alert Templates, Backtesting Summary, TradingView handoff, Markdown + Snapshot export)
- persistent per-user script history with stars, tags, collections, search, and lineage
- unified `useScriptHistory` hook (localStorage for signed-out, Neon/Drizzle for signed-in with seamless migration import)
- TradingView clipboard + Pine Editor handoff (Ctrl/Cmd+T + palette)
- markdown export (Notion/Obsidian) + Pro-only self-contained HTML snapshot export
- authenticated Forge Agent with:
  - conversational tool calling over existing PineForge features
  - persistent conversations (general + research `type`)
  - long-term user memory (profile extraction)
  - guardrails
  - contextual tips
  - research → generate handoff pipeline (with script attach in Forge)
- Strategy DNA fingerprints (procedural 32×32 SVG badges in history)
- Quick variants generation (risk-tight / signal-quality / indicator-swap)
- Comparison reports (multi-select + AI analysis + coverage map + /reports surface)
- Keyboard Power User Mode (tab numbers, j/k history nav, full shortcut surface + status bar)

---

## 5. The Core User Journey

The most important flow in PineForge is:

1. The user lands on the marketing page and understands the product value.
2. They move to `/generate`.
3. They describe a trading strategy in natural language.
4. They optionally add structure:
   market, timeframe, direction, indicators, risk-reward.
5. They choose a model and provide account balance.
6. They generate a Pine Script.
7. The result streams live into the output panel.
8. They copy it, download it, or open TradingView and paste it there.
9. They optionally refine the script or run supporting tools.
10. Their work is saved to history and can later be searched and organized.

This is why the generator page is the real center of the app. The landing page,
auth shell, and supporting tools all exist to feed this workflow.

---

## 6. Product Philosophy Behind The Design

Several product decisions repeat throughout the codebase:

### 6.1 It is a workflow tool, not a toy demo

This is why the app includes:

- persistent history
- refinement instead of one-shot generation only
- health scoring and backtest guidance
- organization tools like tags and collections

The goal is daily usefulness, not a one-time wow moment.

### 6.2 It prefers constrained inputs over vague prompting

The app collects:

- account balance
- market
- timeframe
- direction
- indicator preferences
- risk-reward ratio

This reduces ambiguity and improves consistency in the generated script.

### 6.3 It values output usability over raw model creativity

This is why:

- generation uses strict prompt structure
- API routes validate input before model calls
- the UI emphasizes copy-ready output
- streaming is used to improve perceived speed

### 6.4 It keeps AI scoped and guardrailed

PineForge uses AI in bounded ways:

- generate Pine Script
- refine Pine Script
- explain the script
- score strategy quality
- produce alert templates
- produce a backtesting checklist

It does not aim to answer arbitrary trading questions.

### 6.5 It expands through orchestration, not by becoming a general agent

Phase 6 adds Forge, but Forge follows the same product philosophy as the rest
of PineForge:

- it orchestrates existing PineForge tools instead of replacing the core app
- it remembers user strategy preferences and conversation context
- it refuses live market data, trade execution, and financial advice
- it stays focused on helping users generate, analyze, refine, and organize
  Pine Script workflows

---

## 7. Tech Stack And Why It Was Chosen

## 7.1 Framework: Next.js 16 App Router

Why it fits:

- combines server and client rendering in one codebase
- makes route handlers straightforward for AI endpoints
- supports clean separation between landing page, auth, and workspace
- works well with Vercel deployment

Why App Router matters here:

- server components are used by default where possible
- client components are used only where interactivity is needed
- route handlers under `app/api/` keep backend logic colocated with the app

## 7.2 React 19

React handles the highly interactive generator workspace:

- live streaming output
- command palette
- history drawer
- output tabs
- controlled form state
- refinement flow

This app has a lot of local UI state, so React is the right fit.

## 7.3 TypeScript Strict Mode

This project relies heavily on contracts between:

- client and API routes
- API routes and AI responses
- DB rows and UI models

Strict typing reduces drift and makes feature work safer, especially with many
small utility modules and hooks.

## 7.4 Tailwind CSS v4 + shadcn/ui

Why this pairing works:

- PineForge uses a custom visual system, not a default template
- Tailwind keeps styling colocated with components
- shadcn/ui provides reliable primitives like Sheet, Dialog, and Command
- design tokens live centrally in `globals.css` and UI context docs

The project intentionally avoids a generic SaaS look. The terminal/trading desk
identity is part of the product value.

## 7.5 Vercel AI SDK + xAI Grok

Why it fits:

- streaming support is a first-class requirement
- the SDK keeps route logic relatively small
- model swapping and output utilities are easier to manage centrally

The AI integration is not just “call model, return string.” It is wrapped with
input validation, entitlement checks, concurrency control, and error shaping.

## 7.6 Clerk

Why auth matters here:

- saved strategies become more valuable over time
- tags, collections, and starred scripts need per-user ownership
- model access and usage limits depend on user plan

Clerk reduces the amount of custom auth logic the app has to maintain.

## 7.7 Neon Postgres + Drizzle ORM

Why database-backed storage was added:

- localStorage worked for early phases
- real users need persistent cross-device history
- tags, collections, and account-level organization need relational storage

Why Drizzle:

- typed schema and query helpers
- migration-driven workflow
- good fit with strict TypeScript

## 7.8 Upstash Redis

AI routes cost money and are attractive abuse targets. Upstash handles:

- per-IP rate limits
- per-user plan-based quotas
- protection against repeated scripted abuse

This is a practical security and cost-control decision, not just an optimization.

---

## 8. High-Level Architecture

At a high level, PineForge is split into five layers:

### 8.1 Presentation Layer

This is the UI the user sees:

- landing page components
- auth components
- generator page components
- history drawer
- output tabs and action bars

Main folders:

- `app/`
- `components/`
- `hooks/`

### 8.2 Application Logic Layer

This contains reusable app-specific logic:

- form state
- output actions
- history management
- export assembly
- tags normalization
- TradingView handoff helpers

Main folders:

- `hooks/`
- `lib/scripts/`
- `lib/export/`
- `lib/collections/`
- `lib/config/`

### 8.3 API / Boundary Layer

This is where external input is validated and shaped:

- request validation
- auth enforcement
- rate limiting
- plan checks
- safe envelopes for JSON responses

Main folders:

- `app/api/`
- `lib/api/`
- `lib/auth/`
- `lib/rate-limit/`

### 8.4 Infrastructure / Persistence Layer

This handles data storage and identity resolution:

- Clerk user session lookup
- Neon database access
- Drizzle schema
- row mappers

Main folders:

- `drizzle/`
- `lib/db/`

This layered structure is deliberate. It keeps UI code from absorbing too much
backend logic and keeps request validation close to the actual boundary.

### 8.5 Agent Orchestration Layer

Forge adds a dedicated orchestration layer on top of the generator-era
architecture:

- agent system prompt construction
- tool definitions and execution
- conversation persistence
- memory extraction and recall
- guardrails around agent behavior and tool use

Main folders:

- `app/forge/`
- `components/forge/`
- `lib/agent/`

---

## 9. Route Structure

## 9.1 App Routes

- `/`
  Marketing landing page (public)
- `/generate`
  Core generator workspace (auth-gated via `(app)` group)
- `/forge`
  Forge Agent conversational workspace (auth-gated)
- `/templates`
  Curated Pine Script v5 templates library + per-template detail pages (auth-gated)
- `/reports`
  Strategy comparison reports list + detail viewer (auth-gated)
- `/progress`
  Personal Quality Progression dashboard (Health Score trends, risk themes, insights) (auth-gated)
- `/sign-in`
  Clerk sign-in page
- `/sign-up`
  Clerk sign-up page

Authenticated surfaces (`/generate`, `/forge`, `/templates`, `/reports`, `/progress`) share a common `AppNavbar` (Generator / Forge / Templates / Reports nav) via the `app/(app)/layout.tsx` route group. Landing and auth keep their own chrome.

## 9.2 Core AI Routes

- `/api/generate`
  Generate Pine Script from a strategy description (with variants support via shared logic)
- `/api/refine-script`
  Refine an existing script based on instructions (full replacement)
- `/api/improve-prompt`
  Rewrite a weak prompt into a stronger structured prompt
- `/api/explain-script`
  Produce breakdown/checklist + Assumptions extraction from a script
- `/api/health-score`
  Score the generated strategy (1–10 + verdict + actionable notes; persisted to script metadata when run)
- `/api/alert-templates`
  Produce webhook-ready alert message templates (3Commas, Alertatron, WunderTrading, Custom)
- `/api/backtesting-summary`
  Produce a structured testing checklist (recommended timeframes/markets, equity curve checks, failure modes, test plan)
- `/api/generate-variants`
  Quick-generate 1–3 strategy variants (risk-tight / signal-quality / indicator-swap) with lineage
- `/api/forge`
  Run the Forge Agent as a streaming tool-calling conversation (general + research modes)
- `/api/forge/research-summary`
  Structured research synthesis for the Research → Generate handoff pipeline
- `/api/forge/conversations*`
  Forge conversation CRUD (list/create/rename/delete) + message history
- `/api/progress`
  Personal stats aggregation for the Quality Progression dashboard

## 9.3 Data Routes

- `/api/scripts`
  List scripts, create script (from generation/refinement/variants)
- `/api/scripts/search`
  Search/filter user scripts (free-text, tags, starred, collection)
- `/api/scripts/[scriptId]`
  Update (title) or delete a specific script
- `/api/scripts/[scriptId]/star`
  Toggle starred / pinned state (protects from FIFO eviction)
- `/api/scripts/[scriptId]/tags`
  Update normalized tags (server re-normalization + length caps)
- `/api/scripts/[scriptId]/collection`
  Assign or clear collection membership
- `/api/collections`
  List or create collections
- `/api/collections/[collectionId]`
  Rename or delete a collection (auto-unassigns scripts on delete)
- `/api/comparison-reports`
  List or create AI-generated comparison reports (2–3 scripts)
- `/api/comparison-reports/[reportId]`
  Retrieve or delete a specific report
- `/api/forge/conversations`
  List or create Forge conversations (optionally seeded with `scriptId`)
- `/api/forge/conversations/[conversationId]`
  Rename, update script attachment, or delete a Forge conversation
- `/api/forge/conversations/[conversationId]/messages`
  Load persisted Forge conversation messages
- `/api/users/sync`
  Ensure DB user row exists for the current Clerk user (idempotent, called on first signed-in actions)
- `/api/progress`
  (Data-protected) personal progression stats (in addition to the AI-flavored aggregation route)

This split reflects a core architectural choice: AI routes and CRUD routes are
treated differently because they have different risks and cost profiles.
`protectAiRoute` (plan + quotas + IP + concurrency) vs `protectDataRoute` (auth + lighter throttling).

---

## 10. Codebase Map

## 10.1 `app/`

This holds route-level UI and route handlers.

- `app/(auth)/`
  auth pages and shell (terminal-styled sign-in/up)
- `app/(app)/`
  shared authenticated layout (`AppNavbar` + `UserPlanProvider` scope) wrapping:
  - `app/(app)/generate/` — generator + error/loading/not-found boundaries
  - `app/(app)/forge/` — Forge + loading
  - `app/(app)/templates/` — library + `[templateId]` detail pages
  - `app/(app)/reports/` — comparison reports list + detail
  - `app/(app)/progress/` — quality progression dashboard
- `app/api/`
  All API routes (see 9.2 / 9.3)
- `app/` root-level marketing (`page.tsx`), global error/not-found/loading

## 10.2 `components/`

This is mostly presentational UI split by product area.

- `components/landing/`
  marketing page sections (hero, features, examples, pricing teaser, FAQ, ticker)
- `components/auth/`
  auth visuals, `AuthFormShell`, trust row
- `components/strategy/`
  generator, output card, tabs (Script/Breakdown/Health/Backtest/Alerts/Compare), history drawer, refine chat, panels for each tool, fingerprint, variant strip
- `components/forge/`
  Forge chat experience, sidebar (conversations + reports link + new research), composer, tool-call cards, `ForgeTipCard`, research script banner/picker, empty states
- `components/templates/`
  template cards, detail view, "Use as base" prefill
- `components/reports/`
  `ComparisonReportCard`, `CoverageMap`, list + detail surfaces
- `components/progress/`
  dashboard panels, `HealthScoreTrendChart`, gating
- `components/generate/`
  `GenerateExperience` orchestrator (the authenticated generator chrome)
- `components/error/`
  custom terminal-style error screens (`TerminalErrorScreen`)
- `components/ui/`
  shadcn-generated primitives (never hand-edited)
- `AppNavbar.tsx`, `mode-toggle.tsx`, `theme-provider.tsx`

## 10.3 `hooks/`

Hooks are used heavily to prevent the generator (and Forge) pages from becoming giant
stateful components. Major families:

- Core generator: `useScriptHistory` (unified local/API switcher), `useStrategyFormInputs`, `useScriptGeneration`, `useStrategyGenerationCore` / `useStrategyGenerationSession`, `useStrategyLineageSync`, `useStrategyOutputResets`
- Analysis tools: `useHealthScore`, `useAlertTemplates`, `useBacktestSummary`, `useComparisonReports`
- Forge: `useForgeConversations`
- Shared: `usePromptImprover`, `useCollections`, `useClerkAppearance`, `useShortcutLabel`, `usePrefersReducedMotion`, `useErrorLogger`
- Strategy-specific subfolder: `hooks/strategy/*` for the narrower pieces (inputs, lineage, resets, etc.)

## 10.4 `lib/`

This is the reusable systems layer.

- `lib/ai/`
  prompts (generation, refine, health, alerts, backtest, variants, research, comparison, memory extraction, etc.), shiki highlighting, env guards, `parse-assumptions.ts`
- `lib/api/`
  Zod schemas + validation, response envelopes (`apiSuccess`/`apiError`), boundary guards (`protectAiRoute`, `protectDataRoute`), ownership resolvers, error message helpers
- `lib/auth/`
  Clerk session helpers, appearance, model entitlement (`resolveModelForPlan`, `getVariantCountForPlan`, `canExportSnapshot`), `require-clerk-session`
- `lib/agent/`
  Forge system prompt builder, `guardrails.ts` (canonical `FORGE_GUARDRAILS`), tool contracts + runners (`lib/agent/tools/`, `tool-runners.ts`, `build-forge-tools.ts`), memory extraction, conversation persistence helpers, tips (`tips.ts`), UI message adapters
- `lib/db/`
  neon-http + pooled clients, all row mappers (`rowToSavedScript`, `rowToSavedCollection`, `rowToAgent*`), script/collection/agent/progress helpers, search, list, ownership primitives
- `lib/scripts/`
  history helpers (cap, partition by starred, filter), lineage, fingerprint (DNA SVG), tags normalization (single source of truth), TradingView handoff, local vs API stores, comparison report helpers
- `lib/export/`
  `StrategyExportSource` + builders, markdown serializer, snapshot HTML assembler + styles + download utils; `actions/export-snapshot.ts` Server Action
- `lib/rate-limit/`
  Upstash Redis limiters + concurrency stream lock
- `lib/providers/`
  `UserPlanProvider` / `useUserPlan`
- `lib/config/`
  constants (MAX lengths, model list, caps, reset keys), prompt suggestions
- `lib/research/`
  research handoff reader (`read-research-handoff`)
- `lib/collections/`, `lib/forge/`, `lib/prompt/`, `lib/progress/`, `lib/theme/`, `lib/types/`, `lib/ui/`, `lib/utils.ts`, `lib/brand.ts`

## 10.5 `actions/`

Server Actions (currently `export-snapshot.ts` for the Pro-only self-contained HTML export with auth + entitlement enforcement).

## 10.6 `drizzle/`

Database schema (`drizzle/schema.ts`) and versioned migrations (0000–0005+ applied to Neon) live here. Use `drizzle-kit generate` + `drizzle-kit migrate` (unpooled URL for migrate). Never `push` in prod.

This separation makes the project easier to study because each folder has a
clear job instead of mixing data, UI, and side effects together.

---

## 11. The Generator Page: The Real Heart Of The Product

The most important page is `/generate` (inside the `(app)` authenticated group).

Its top-level server route is `app/(app)/generate/page.tsx`. That file:

- is protected by the group layout + `proxy.ts`
- checks the current Clerk session
- looks up the user’s plan from the database (`users.plan`)
- passes `initialPlan` into the client workspace via `UserPlanProvider`
- renders the ambient terminal-style background + ticker

The client orchestrator `components/generate/GenerateExperience.tsx` then owns the shared authenticated generator chrome (history toggle, plan context, user sync on first action, command palette wiring) and renders `StrategyForm`. Output tabs now include Script, Breakdown (with Assumptions block), Health, Backtest, Alerts, and Compare (lineage diff). Phase 7 additions (variants strip, snapshot export button, DNA fingerprints in history, full keyboard surface) are wired here.

The main client workspace is `components/generate/GenerateExperience.tsx`.
That component:

- wraps the page with `UserPlanProvider`
- renders the page header and controls
- shows the theme toggle
- shows script history
- syncs the signed-in user into the DB through `/api/users/sync`
- renders the main `StrategyForm`

The most important client composition is inside
`components/strategy/StrategyForm.tsx`.

That component brings together:

- input state
- generation session state
- history management
- lineage/compare state
- command palette actions
- input card and output card

This split is one of the better architectural choices in the project. Without
it, the generator page would become extremely hard to reason about.

---

## 12. How Input Works

The input side is designed to gather both free-form intent and structured
constraints.

### 12.1 Free-form input

The user writes a natural-language strategy description. This is the core idea
the model works from.

### 12.2 Structured inputs

The app also supports:

- market
- timeframe
- direction
- indicator preferences
- risk-reward ratio
- account balance

These inputs matter because they reduce ambiguity. For example:

- timeframe changes signal cadence
- market changes assumptions about behavior
- direction affects long/short logic
- indicators constrain likely implementation patterns
- account balance allows risk sizing logic

### 12.3 Prompt improvement

The “Improve My Prompt” behavior exists because many users describe strategies
in incomplete or messy ways. Instead of expecting users to become prompt
engineers, PineForge restructures the prompt for them.

That is a very intentional UX decision:

- the app absorbs the prompt-engineering burden
- the user stays focused on trading logic

---

## 13. How Script Generation Works

The main generation route is `app/api/generate/route.ts`.

The sequence is:

1. protect the route with auth, quota, and IP checks
2. parse request JSON
3. validate with Zod
4. check whether the requested model is allowed for the user’s plan
5. acquire a stream concurrency lock
6. verify the xAI API key exists
7. build a prompt from user input plus structured context
8. stream the result with `streamText`
9. release the lock when streaming finishes

This flow contains several important design decisions.

### 13.1 Validation before AI

The app never sends raw request bodies directly to the model. This is a
security and reliability choice. It prevents malformed or excessive input from
reaching the expensive AI boundary.

### 13.2 Structured context block

Instead of relying on the model to infer everything from the raw prompt, the
route explicitly appends normalized context like market, timeframe, and
indicators. That improves determinism.

### 13.3 Streaming output

Streaming is used because:

- users see progress quickly
- perceived latency drops
- the output panel feels active instead of frozen

This matters a lot for AI UX. Even when total generation time is not tiny,
visible progress improves trust.

### 13.4 Concurrency lock

Only one active stream per user is allowed. This helps with:

- double-submit accidents
- wasted tokens
- race conditions in UI state

That is both a UX and cost-control decision.

---

## 14. How Script Refinement Works

Refinement is handled by `app/api/refine-script/route.ts`.

The route is intentionally very similar to the main generation route:

- same protection pattern
- same entitlement checks
- same stream lock behavior
- same model family

The big difference is the prompt shape:

- instead of starting from scratch
- it sends the current script plus a user instruction
- and asks for a full updated replacement script

This is a strong product decision. Returning the full script instead of a patch
keeps the rest of the UI simpler:

- history saves a complete artifact
- compare view has stable inputs
- copy/download always work on a full script

---

## 15. How Explanation, Health, Alerts, Backtest, Assumptions, Variants, And Reports Fit

These supporting tools (plus Phase 7 depth features) turn PineForge from a
simple generator into a complete daily strategy workflow product.

## 15.1 Script explanation + Assumptions (Breakdown tab)

The app includes breakdown/checklist-style explanation outputs (via
`/api/explain-script`) so users can understand what the generated code is doing.
Post-spec 60 the Breakdown tab also renders a dedicated **Assumptions** block
(parsed at generation time and stored in `ScriptMetadata.assumptions`).

This helps:

- less technical traders
- users validating logic before using the script
- users learning Pine Script by reading generated code
- surfacing "this strategy assumes X" so later Health Scores and the user
  have shared context on why something may have failed

## 15.2 Health score

The health score feature (`/api/health-score`) gives a 1–10 assessment with:

- verdict (Promising / Needs Work / High Risk)
- summary
- strengths
- risks
- next steps (actionable refine suggestions)

Results can be persisted to the script's `metadata.healthScore` (enables the
Quality Progression dashboard). Next-step "Refine" buttons prefill the Refine
Chat. Health Scores are also available as a Forge tool.

## 15.3 Alert templates

Generated strategy scripts are often only part of the workflow. Traders also
need webhook-ready messages for automation platforms (`/api/alert-templates`).

PineForge generates structured alert template bundles for 3Commas, Alertatron,
WunderTrading, and a Custom provider. Each includes `messageJson`, human
description, and placeholder notes. Results feed the markdown exporter and
Forge.

## 15.4 Backtesting summary

This feature (`/api/backtesting-summary`) produces a structured markdown
checklist for testing the strategy (recommended timeframes/markets, equity
curve checks, common failure modes, explicit test plan). Purely structural
guidance — no performance claims. Results are reusable in exports and Forge.

## 15.5 Quick variants (Phase 7)

After generation, "Generate 3 variants" (or fewer for free users) produces
lineage-linked scripts along three axes (risk-tight, signal-quality,
indicator-swap). Powered by `/api/generate-variants`. Variant axis is recorded
in metadata. UI shows a collapsible `VariantStrip`.

## 15.6 Comparison reports (Phase 7)

Users multi-select 2–3 scripts in history (or via Forge) → POST to
`/api/comparison-reports` → structured report with entry logic diff, risk
profile, market suitability, and a Coverage Map (which regimes each strategy
handles best). Lives at `/reports`; also reachable from Forge sidebar. Reports
are first-class persisted artifacts.

## 15.7 DNA fingerprints (Phase 7)

Every history entry (and template) shows a deterministic 32×32 procedural SVG
badge (`StrategyFingerprint` + `buildFingerprintSvg`) encoding market,
indicators, direction, and version. Pure client-side, no AI, highly scannable.

Together, these features (plus export, Forge orchestration, templates library,
and keyboard power-user mode) deepen the product around the core script and make
PineForge a serious daily driver rather than a one-shot generator.

---

## 16. How Persistence Works

PineForge uses a split persistence model (local vs account-backed) but presents
a single surface: `hooks/useScriptHistory.ts` (the switching layer).

## 16.1 Local storage mode (signed-out)

Unsigned users use localStorage-backed history (max 50 FIFO).

Internal pieces:

- `hooks/strategy/useLocalScriptHistory.ts`
- `lib/scripts/local-history-store.ts`

Characteristics:

- browser-only
- quick, no auth required
- good for first-time exploration

## 16.2 Account-backed mode (signed-in)

Signed-in users read/write via the Neon + Drizzle API surface.

Internal pieces:

- `hooks/strategy/useApiScriptHistory.ts`
- `/api/scripts*` + search/star/tags/collection routes
- `lib/scripts/api-history-store.ts`
- DB helpers in `lib/db/` (`listScriptsForUser`, `searchScriptsForUser`, etc.)

Characteristics:

- cross-device persistence
- stars protect entries from the 50-entry cap
- full tags + collections + search
- one-time localStorage → account import toast on first sign-in

## 16.3 Why both modes exist

This is a smart product onboarding decision.

Anonymous users can try the product without friction.
Serious users can later sign in and keep their work permanently.

That gives PineForge:

- lower friction at first use
- better long-term retention for committed users

## 16.3 The unified hook

`useScriptHistory()` inspects Clerk auth and delegates to the right store.
All consumers (`StrategyForm`, `ScriptHistory`, Forge, reports, progress, etc.)
call the same methods: `entries`, `addEntry`, `renameEntry`, `deleteEntry`,
`toggleStarEntry`, `setTagsEntry`, `setCollectionEntry`, `refreshEntries`, etc.
Optimistic cache updates + `capScriptHistory` keep starred entries while trimming
only unstarred ones. This abstraction is why the rest of the UI never branches
on auth for history shape.

## 16.4 Why both modes exist

Anonymous-first + account-later is a deliberate onboarding decision. It lowers
friction for trial while giving serious users durable, searchable, cross-device
strategy libraries. The migration path (import on sign-in) plus the unified hook
makes the transition feel seamless.

---

## 17. History, Versioning, And Lineage

Generated and refined scripts are treated as saved artifacts.

Important concepts:

- each saved script is an entry
- refinements create new versions
- versions can reference a parent
- history can be loaded back into the generator

This matters because the product assumes iteration is normal.

Instead of treating generation as disposable output, PineForge treats scripts as
progressively improved strategy assets.

That is why the app also includes:

- compare view
- reload from history
- rename
- delete
- starred pinning

The user is building a strategy library, not just producing one-off snippets.

---

## 18. Tags, Stars, And Collections

These features turn saved scripts into something users can actually manage at
scale.

## 18.1 Starred scripts

Starred scripts help users keep important strategies visible. In database mode,
starred entries are protected from the old local FIFO-style limit behavior.

Why this exists:

- some strategies are reference strategies
- some are active experiments
- some need to survive heavy usage and history churn

## 18.2 Tags

Tags are normalized, lowercased, deduplicated, and length-limited.

Why normalization matters:

- prevents messy user-entered variants
- improves search consistency
- avoids bloated or inconsistent metadata

This is a small but strong product-quality decision.

## 18.3 Collections

Collections let users group scripts into larger buckets such as:

- BTC strategies
- scalping ideas
- testing
- live candidates

Why collections matter:

- tags are flexible but loose
- collections provide stronger structure

Together, stars, tags, and collections make PineForge much more usable as a
serious working library.

---

## 19. Search And Filtering

Search is implemented through a dedicated route:

- `/api/scripts/search`

This route supports filtering by:

- free-text query
- tags
- starred state
- collection

Important design choices:

- search always scopes by user first
- query length is capped
- tags are normalized before being used
- wildcard characters are escaped before `ILIKE` matching

This is one of the places where product and security decisions meet. Search is
useful, but it also needs boundaries to avoid abuse and incorrect matching.

---

## 20. Database Model

The current model (after all Phase 4–7 migrations) contains these tables:

- `users`
- `scripts` (core artifact + rich `metadata` jsonb)
- `collections`
- `agent_conversations` (Forge threads, including research `type`)
- `agent_memory` (per-user long-term profile)
- `comparison_reports` (AI-generated 2–3 script analyses)

## 20.1 `users`

Stores:

- Clerk ID (unique)
- email
- plan (`free` | `pro`)
- generationsUsed (legacy counter)
- creation time

This table links authentication identity to app-specific user state (plan drives entitlement in `protectAiRoute` and `model-entitlement`).

## 20.2 `scripts`

Stores:

- user ownership (FK + indexes)
- title, content (the Pine Script)
- version + parentId (lineage for refinements and variants)
- isStarred (boolean; starred rows survive history caps)
- tags (jsonb string[])
- metadata (jsonb `ScriptMetadata`): 
  - prompt, balance, market, timeframe, direction, indicators, rr
  - assumptions (StrategyAssumptions from spec 60)
  - variantAxis (for quick-variant entries)
  - healthScore (full persisted `HealthScoreResult` when user runs the analysis)
- collectionId (nullable FK)
- model, accountBalance
- timestamps + indexes on (user_id, created_at desc), (user_id, is_starred), (user_id, collection_id)

`rowToSavedScript()` + `savedScriptSchema` (Zod) ensure a stable client shape including legacy localStorage entries. This is the primary business object.

## 20.3 `collections`

Stores per-user named buckets (simple name + createdAt). Scripts reference them via FK. Delete path unassigns referencing scripts first (idempotent UPDATE then DELETE, no cross-user leakage).

## 20.4 `agent_conversations` + `agent_memory` (Phase 6)

- `agent_conversations`: per-thread `messages` as jsonb `AgentMessage[]`, optional `scriptId` seed, `type` (`general` | `research`), title auto-generated on first turn. Hard cap 200 messages / conversation; 50 conversations / user (FIFO on create).
- `agent_memory`: one row per user (unique index), `profile` as `AgentUserProfile` jsonb (markets, timeframes, indicators, riskTolerance, strategyPatterns, averageHealthScore, insights, seenTips, totalStrategiesGenerated, lastExtractedAt). Injected into every Forge system prompt; updated by background extraction.

## 20.5 `comparison_reports` (Phase 7)

Stores AI-generated structured comparison (summary, entry logic, risk, market fit, coverage map, overlap, recommendation) for 2–3 scripts. `scriptIds` array + `report` jsonb. Script bodies are re-hydrated at render time from `scripts` (never duplicated).

## 20.6 Why rich metadata lives in scripts

The jsonb `metadata` column (plus assumptions, healthScore, variantAxis) stores generation context and derived analyses without new tables or migrations for most Phase 5–7 features. This enables:

- perfect round-tripping of structured inputs on history load
- Assumptions block in Breakdown without schema change
- Quality Progression trends and risk aggregation from persisted Health Scores
- variant lineage without polluting the main script shape
- export sources that are reconstructible from a single row + optional live tool results

All mappers are pure and centralised in `lib/db/`.

---

## 21. Data Contracts And API Shape

Most JSON routes use a standard envelope:

- success state
- data payload
- error field

This standardization helps because the client can parse API responses
consistently without special-casing every route.

Streaming routes are the one exception:

- successful generation-like routes stream plain text
- failures still return JSON error envelopes

That split makes sense because the product needs streaming for the happy path
but still wants consistent structured error handling when something goes wrong.

---

## 22. State Architecture

The generator workspace has a lot of moving pieces, but the state is not stored
randomly. Each major piece lives in a specific place because that place matches
its lifetime and responsibility.

## 22.1 Server-owned route state

`app/generate/page.tsx` owns the first piece of route state:

- current Clerk user presence
- initial user plan from the database

This state lives in the server component because:

- it depends on server-only auth and DB access
- the plan should be resolved before the client workspace renders
- it avoids an extra client fetch just to know which model tier is allowed

The server page passes `initialPlan` into
`components/generate/GenerateExperience.tsx`, which then provides it through
`UserPlanProvider`.

## 22.2 Shared plan state

`lib/providers/UserPlanContext.tsx` owns the current plan for the `/generate`
subtree.

This state lives in context because multiple client components need it:

- `StrategyForm` needs it when loading saved history
- `ModelSelector` uses it to lock premium models in the UI
- any future client-only control in the workspace can read it without prop
  drilling

It does **not** live in a hook local to the form because plan is not merely
form state. It is workspace-wide entitlement state.

## 22.3 Input state

`hooks/strategy/useStrategyFormInputs.ts` owns the user-editable generation
inputs:

- `strategy`
- `balance`
- `selectedModel`
- `activePreset`
- `structuredInputs`
- `isImproving`

This state lives in its own hook because it all changes together around the
input side of the experience. The hook also owns the helpers that transform
input intent into action:

- `getGenerationPayload()`
- preset selection
- textarea edits
- prompt improvement trigger
- starter-suggestion clicks

This state does not live in `StrategyInputsCard` because the output side,
history loading, and generation flow also need to read or mutate it.

## 22.4 Generation session state

`hooks/useScriptGeneration.ts` owns the low-level streaming session state:

- `generatedScript`
- `generationError`
- `isGenerating`
- `isRefining`
- `genStartTime`
- `genElapsed`
- `abortRef`

This is the state closest to the network request itself. It lives here because
it is specifically about the lifecycle of generate/refine fetches:

- request starts
- chunks arrive
- request aborts
- request finishes
- generation/refinement errors surface

`hooks/strategy/useStrategyGenerationCore.ts` then wraps that lower-level hook
with product-specific logic:

- whether the user *can* generate
- when to reset panels
- when to save generated output to history
- when to mark compare baselines
- how refinement versions are created

This split is important. The low-level hook owns request mechanics; the higher
hook owns PineForge workflow behavior.

## 22.5 Workspace UI session state

`hooks/strategy/useStrategyGenerationSession.ts` owns session-level UI state
that belongs to the whole generator workspace:

- command palette open/closed state
- webhook panel open state
- webhook URL field
- output container ref
- computed idle/streaming flags

This state lives above both cards because it coordinates behavior across the
input and output halves of the page.

## 22.6 Output tool state

`hooks/strategy/useStrategyOutputResets.ts` owns:

- active output tab
- panel reset keys for explain
- panel reset keys for health score
- panel reset keys for backtest summary
- panel reset keys for alert templates

These values live here because they are not part of the generated script
itself. They are coordination state for downstream output tools. Reset keys let
the app invalidate derived panels whenever a new generation, refinement, or
history load changes the script underneath them.

This is why they are not stored inside the individual panels. A panel cannot
reliably decide on its own when the underlying script has changed in a way that
should clear old results.

## 22.7 Lineage and comparison state

`hooks/strategy/useStrategyLineageSync.ts` owns the state that gives a script
session continuity over time:

- current lineage ref
- `lineageState`
- `historyLineageReady`
- `scriptCompareBaseline`
- session history name
- export title
- export createdAt

This state lives outside the history hooks because it is not persistence. It is
session interpretation of persistence:

- what counts as the root script
- what the next version number should be
- which script to compare against
- what title/export metadata should follow the current session

That is why lineage is separate from both `useScriptHistory` and
`useScriptGeneration`.

## 22.8 History state

`hooks/useScriptHistory.ts` is the switching layer. It decides whether the
active source of truth is:

- `useLocalScriptHistory()` for unsigned users
- `useApiScriptHistory()` for signed-in users

The actual entry array and mutation methods then come from the active store:

- `entries`
- `addEntry`
- `renameEntry`
- `deleteEntry`
- `toggleStarEntry`
- `setTagsEntry`
- `setCollectionEntry`

This abstraction exists so the rest of the UI does not care where history is
stored. `StrategyForm` and `ScriptHistory` can work against one common shape.

## 22.9 Why history is split into local and API hooks

`useLocalScriptHistory()` owns browser-only persistence concerns:

- read/write localStorage
- keep max 50 entries
- update local state synchronously

`useApiScriptHistory()` owns account-backed concerns:

- fetch initial history from `/api/scripts`
- mirror optimistic updates into client cache
- show toast errors on failed mutations
- import local entries into the account on first signed-in use

If both modes lived in one hook body, the branching would become much harder to
reason about. The split keeps each storage mode honest.

## 22.10 Component-local state

Some state intentionally remains local to leaf components or utility hooks.

Examples:

- copy feedback in `useStrategyOutputActions`
- prompt improver loading state in `usePromptImprover`
- search/filter UI state in history-specific hooks
- per-panel fetch state in `useHealthScore`, `useAlertTemplates`, and
  `useBacktestSummary`

This state stays local because it is narrow in scope and does not need to be
shared across the entire generator session.

The general rule across the codebase is:

- server component for server-derived route state
- context for workspace-wide shared entitlement state
- dedicated hook for cross-component session state
- leaf hook or component state for narrow, local interaction state

---

## 23. Error Handling Architecture

PineForge handles errors in layers. Each layer has a different job:

- middleware decides redirect vs pass-through
- route guards turn auth and rate-limit failures into safe responses
- route handlers validate and shape domain errors
- streaming routes keep success as a text stream and failure as JSON
- client hooks interpret those failures into inline UI or toasts

## 23.1 Middleware and route access errors

`proxy.ts` uses Clerk middleware for route protection.

Important behavior:

- `/generate` is protected with `auth.protect()`
- `/api/*` is intentionally treated as public at the middleware layer

That second choice is very important. It prevents fetch requests from getting an
HTML redirect page when the real caller needs a JSON error. API routes then do
their own session enforcement inside the handler layer.

So middleware does **not** try to shape API error bodies. It only decides
whether browser navigation should be redirected into Clerk auth.

## 23.2 Canonical JSON error shape

For non-streaming JSON responses, the standard envelope from
`lib/api/envelope.ts` is:

```json
{ "success": false, "data": null, "error": "User-safe message" }
```

Successful JSON responses use:

```json
{ "success": true, "data": { ... }, "error": null }
```

This is the main contract used by:

- CRUD routes
- route guards
- client fetch helpers
- error-message extraction on the client

## 23.3 Auth and rate-limit guard errors

`requireClerkSession()` in `lib/auth/require-clerk-session.ts` returns:

- `401 Unauthorized` with `error: "Unauthorized"` when there is no Clerk user

`protectAiRoute()` and `protectDataRoute()` then build on top of that:

- AI routes add auth + rate limit + plan lookup
- data routes add auth + data-route rate limit

When rate limiting fails, the guards return:

- `429 Too Many Requests`
- a user-safe error string
- `Retry-After` when available

For AI routes, the message is plan-aware:

- free-tier quota reached
- pro daily limit reached
- short IP burst limit reached

## 23.4 Route-handler validation errors

Route handlers generally follow the same pattern:

1. protect the route
2. parse request JSON
3. validate with Zod
4. return `apiInvalidRequest()` on failure

That means invalid bodies usually become:

- `400 Bad Request`
- `error: "Invalid request."`

Some narrow validation errors are more specific:

- invalid dynamic ids become `400` with messages like `Invalid script id`

The app intentionally does not expose raw Zod issue dumps to users in route
responses.

## 23.5 Ownership and lookup errors

The ownership helpers in `lib/api/resolve-owned-script-route.ts` and similar
collection helpers centralize common failure paths:

- invalid route id → `400`
- missing DB user row → `404`
- accessing another user’s script/collection → `403 Forbidden`

This matters because it keeps ownership checks consistent across:

- rename
- delete
- star
- tag updates
- collection assignment

## 23.6 Streaming route error behavior

Streaming routes such as:

- `/api/generate`
- `/api/refine-script`

have two response modes:

- success: plain text stream
- failure: JSON error envelope

Inside these routes:

- entitlement failures return `403`
- concurrent stream conflicts return `409`
- invalid input returns `400`
- missing auth returns `401`
- quota failures return `429`
- unexpected internal failures return `500`

One especially important detail is the stream lock:

- if a user already has an active stream, `acquireStreamLock()` causes a
  `409 Conflict`
- the client then shows a targeted message instead of a vague generic failure

## 23.7 Client-side error parsing

The client uses `messageFromApiErrorJson()` to extract the safest useful error
message from API responses.

That helper prefers:

- `error` string from the standard envelope
- a validation fallback message
- a generic fallback message

This is why the UI can stay simple. Individual hooks do not need to understand
every possible server payload shape.

## 23.8 How errors are surfaced in the client

The client intentionally uses different UI surfaces for different error types.

`useScriptGeneration()` handles generate/refine errors like this:

- `429` on generate:
  stored in `generationError` so the output area can show a persistent inline
  limit message and upgrade CTA
- `403`, `409`, and most other request failures:
  shown as Sonner toasts
- aborts:
  shown as non-error informational messages like `Generation stopped.`
- unexpected fetch/runtime failures:
  shown as generic error toasts

For refinement specifically:

- on failure or abort, the hook restores the previous script into
  `generatedScript`

That is a good example of error handling being product-aware, not just
technical.

For account-backed history operations:

- `useApiScriptHistory()` and `lib/scripts/api-history-store.ts` show toast
  errors for failed fetches or mutations
- failed save/patch/delete operations do not silently corrupt local client state

For route-level rendering failures:

- `app/error.tsx`
- `app/global-error.tsx`
- `app/generate/error.tsx`

provide terminal-style error screens instead of raw framework defaults.

## 23.9 What the important HTTP status codes mean in PineForge

- `400 Bad Request`
  The caller sent invalid input or an invalid route id.
- `401 Unauthorized`
  The request needs a Clerk session and none was present.
- `403 Forbidden`
  The caller is authenticated but not allowed to do this.
  In this app that usually means model entitlement failure or cross-user access.
- `404 Not Found`
  The authenticated Clerk user does not yet have the expected DB user row, or a
  user-scoped resource lookup could not be resolved in a required precondition.
- `409 Conflict`
  Another generation/refinement stream is already active for this user.
- `429 Too Many Requests`
  A rate limit was exceeded. On AI routes this can mean IP burst or daily plan
  quota. On data routes it means the authenticated CRUD limit was exceeded.
- `500 Internal Server Error`
  The server hit an unexpected failure after validation and authorization.

One subtle but important behavior in the client save flow is that `postApiScript`
interprets a `404` from `/api/scripts` as “the Clerk user may not be synced into
the DB yet,” calls `/api/users/sync`, and retries once. So in PineForge, `404`
is sometimes used as a missing-account-precondition signal, not just a classic
missing-route signal.

---

## 24. Data Flow

The most useful way to understand PineForge is to follow the actual request
lifecycles. Below are the three most important flows in the app.

## 24.1 Script generation flow

### User action

1. The user fills in the strategy form.
2. `useStrategyFormInputs()` owns the current input values.
3. The Generate button or keyboard shortcut calls
   `useStrategyGenerationCore().handleGenerate()`.

### Client session setup

4. `handleGenerate()` checks `canGenerate`.
5. It switches the output tab to `script`.
6. It resets downstream panel keys through `resetPanelKeys()`.
7. It clears lineage session state with `resetLineageForGenerate()`.
8. It clears active preset state and closes the webhook panel.
9. It calls `generate()` from `useScriptGeneration()` with
   `inputs.getGenerationPayload()`.

### Request dispatch

10. `useScriptGeneration()` clears the previous script and previous generation
    error.
11. It marks `isGenerating = true`, stores timing state, and creates an
    `AbortController`.
12. It POSTs to `/api/generate` with:
    prompt, balance, model, and structured inputs.

### Server route processing

13. `/api/generate` calls `protectAiRoute(req)`.
14. `protectAiRoute()` calls `requireClerkSession()`.
15. If authenticated, it calls `checkRateLimit(userId)`.
16. `checkRateLimit()` applies:
    IP limiter first, then free/pro user quota based on the `users.plan` row.
17. The route parses the JSON body and validates it with the extended
    `generateSchema`.
18. `resolveModelForPlan()` verifies the chosen model is allowed for the plan.
19. `acquireStreamLock()` ensures this user is not already streaming another
    generation/refinement request.
20. The route builds a context block from market, timeframe, direction,
    indicators, and risk-reward.
21. It calls `streamText()` with the Pine generation system prompt and returns
    `toTextStreamResponse()`.

### Streaming back to the client

22. `useScriptGeneration()` receives the response.
23. If the response is not OK, it parses the JSON error and surfaces it.
24. If the response has a body stream, it reads chunks with
    `ReadableStreamDefaultReader`.
25. Each chunk:
    appends to local `finalScript`
    updates `generatedScript` state
    triggers `onChunk()`
26. `onChunk()` in `useStrategyGenerationCore()` scrolls the output area to the
    bottom on the next animation frame.

### Save and final UI update

27. When streaming finishes, `useScriptGeneration()` computes elapsed time and
    enters its `finally` block.
28. If the request was not aborted and the final script is non-empty, it calls
    `onGenerationComplete(finalScript, payload)`.
29. `useStrategyGenerationCore()` builds a `SavedScript` with
    `buildSavedScriptFromGeneration()`.
30. It calls `addEntry()` from `useScriptHistory()`.
31. Depending on auth state:
    unsigned path → `useLocalScriptHistory()` writes to localStorage
    signed-in path → `useApiScriptHistory()` POSTs to `/api/scripts`
32. When the save succeeds, `recordGenerationSaved(saved)` updates lineage
    state, compare baseline, export title, export createdAt, and session
    history name.
33. The output card now shows the finished script, validation badge, stats, and
    related tool panels in a clean reset state.

## 24.2 Script refinement flow

### User action

1. The user opens Refine Chat and submits an instruction.
2. `StrategyOutputCard` passes that instruction into
   `useStrategyGenerationCore().handleRefine()`.

### Client session setup

3. `handleRefine()` first asks `useStrategyLineageSync()` for the current
   lineage ref.
4. If no lineage exists, the app shows a toast because it cannot safely link
   the refinement to a root script.
5. It captures the current `generatedScript` as `previousScript`.
6. It switches the output tab back to `script`.
7. It resets output-derived panels and closes the webhook panel.
8. It calls `refine()` from `useScriptGeneration()` with:
   current script, instruction, selected model.

### Request dispatch

9. `useScriptGeneration()` clears the visible script, marks
   `isRefining = true`, stores timing state, and creates an abort controller.
10. It POSTs to `/api/refine-script`.

### Server route processing

11. `/api/refine-script` repeats the same protection sequence as generate:
    auth, rate limit, validation, entitlement, stream lock, env check.
12. The route builds a refine-specific user prompt that includes:
    current script + user instruction.
13. It calls `streamText()` and returns a text stream response.

### Streaming back to the client

14. The client reads chunks exactly like generation.
15. `generatedScript` is rebuilt chunk by chunk from the new refined output.
16. If the request fails before success, the hook restores `previousScript`.
17. If the user aborts refinement, the hook also restores `previousScript`.

### Save and final UI update

18. After a successful full stream, `useScriptGeneration()` calls
    `onRefineComplete(finalScript)`.
19. `useStrategyGenerationCore()` asks `useStrategyLineageSync()` for:
    root id and last version.
20. It builds a new `SavedScript` with
    `buildSavedScriptFromRefinement()`, incrementing the version and preserving
    the lineage root as `parentId`.
21. It calls `addEntry()` through `useScriptHistory()`.
22. On success, `recordRefinementSaved()` updates:
    lineage version
    compare baseline
    refine panel reset key
23. The output card now shows the new full script, and compare mode can use the
    old baseline to show differences against the prior version.

## 24.3 History save flow

History save is important enough to understand on its own because it has two
real storage paths.

### Step A: save request is created in the generator session

1. A generation or refinement completes successfully.
2. `useStrategyGenerationCore()` converts the result into a `SavedScript`
   object.
3. It calls `addEntry()` from `useScriptHistory()`.

### Step B: `useScriptHistory()` chooses the active store

4. `useScriptHistory()` checks Clerk client state through `useUser()`.
5. If the user is signed out, it delegates to `useLocalScriptHistory()`.
6. If the user is signed in and loaded, it delegates to `useApiScriptHistory()`.

### Step C1: unsigned save path

7. `useLocalScriptHistory().addEntry()` reads current local history.
8. It prepends the new entry.
9. It trims to `MAX_HISTORY_ENTRIES`.
10. It writes the updated array back through `writeLocalHistory()`.
11. The local subscription updates all consumers of the history snapshot.

This path is synchronous and lightweight because there is no server dependency.

### Step C2: signed-in save path

12. `useApiScriptHistory().addEntry()` calls `postApiScript(entry)`.
13. `postApiScript()` maps the client `SavedScript` into the API payload shape
    with `savedScriptToCreatePayload()`.
14. It POSTs that payload to `/api/scripts`.

### Server route processing for signed-in save

15. `/api/scripts` calls `protectDataRoute()`.
16. `protectDataRoute()` enforces Clerk session and data-route rate limits.
17. The route calls `ensureDbUserForClerkId()` to guarantee the DB user exists.
18. It parses the request body and validates it with `createScriptSchema`.
19. It inserts into the `scripts` table and returns:
    `{ success: true, data: { script: rowToSavedScript(created) }, error: null }`

### Special retry behavior

20. If `/api/scripts` returns `404`, `postApiScript()` assumes the account may
    need syncing.
21. It calls `/api/users/sync`.
22. If sync succeeds, it retries the save request once.

This is one of the more practical codebase-specific touches. It smooths over
timing gaps between Clerk auth state and DB user provisioning.

### Final client cache update

23. When the signed-in save succeeds, `useApiScriptHistory().addEntry()`
    inserts the returned saved row into the in-memory API history snapshot with
    `setApiEntries()`.
24. `capScriptHistory()` keeps the client cache within the app’s history rules
    while preserving starred-entry behavior.
25. Any subscribed history UI, including the history drawer, re-renders from
    that updated shared snapshot.

### Why the save flow is designed this way

The save flow intentionally converts generated text into a durable first-class
artifact before the rest of the session depends on it. That is why lineage,
compare state, and export metadata are updated only after the save step returns
success.

The app is effectively saying:

- generation output is interesting
- saved generation output is the real product object

That is a subtle but very important architectural idea in PineForge.

---

## 25. Auth, Plans, And Entitlements

Authentication is not just used to gate access. It also drives product
capabilities.

### 25.1 Signed-out behavior

Signed-out users can access public areas and local-only flows.

### 25.2 Signed-in behavior

Signed-in users get:

- account-backed history
- per-user storage
- plan-aware model access
- data routes protected by ownership

### 25.3 Plan-aware models

The app intentionally shows all model options in the UI, but premium ones are
locked for free users.

Why this UX choice works:

- users can see the product ladder
- they understand premium capability exists
- the server still remains the final source of truth

That last part is critical: client locks help UX, but server-side entitlement
checks enforce security.

---

## 26. Rate Limiting And Cost Control

AI applications are expensive to run and easy to abuse. PineForge addresses
that directly.

There are two major protection styles:

## 26.1 AI route protection

Used for expensive generation-style routes.

Includes:

- auth-aware plan resolution
- per-user quotas
- per-IP burst limits

## 26.2 Data route protection

Used for CRUD-style routes.

Includes:

- authenticated access
- request throttling suited for data operations

This distinction is very intentional. Not every route should be treated the same
way. Generation is expensive; script renaming is not.

---

## 27. Security Posture

Security expectations are visible throughout the project context and codebase.

Key patterns already in place:

- Zod validation on external inputs
- sanitized error responses
- no raw secret exposure to client components
- route ownership checks for user data
- server-side model entitlement checks
- request throttling on AI and data paths
- stream concurrency control

## 27.1 Why validation is such a big deal here

This app deals with three sensitive boundaries:

- browser input
- AI model input/output
- database writes

Without strong validation and normalized contracts, bugs and abuse would be much
more likely.

## 27.2 Why “never trust raw LLM output” matters

Some routes use structured AI results, not just free-form text. Those results
are validated again after generation before the app treats them as trustworthy.

That reduces:

- malformed JSON issues
- broken UI assumptions
- accidental downstream errors

---

## 28. UI Design System And Why It Looks Like This

PineForge uses a dark trading-terminal design language with zinc surfaces and
emerald accents.

This is not purely aesthetic. It supports product positioning:

- feels closer to a trading desk than a generic AI playground
- matches the mental model of charting and terminals
- reinforces the “professional tool” feel

Key visual decisions:

- dark-first theme
- ambient terminal textures
- monospace code output
- expressive heading font
- emerald-highlighted code and actions
- sticky utility UI around outputs

The UI is designed to make the generated script feel like a serious artifact,
not disposable text.

---

## 29. Why The App Uses So Many Small Hooks

At first glance, the number of hooks may look high. It is actually a deliberate
maintainability strategy.

The generator page needs to handle:

- form inputs
- streaming state
- copy/download actions
- prompt improvement
- refinement
- history persistence
- comparison
- output tabs
- keyboard shortcuts
- reset behavior across tools

If all of that lived in one component, the code would become very hard to
change safely. The hook split keeps concerns smaller and easier to test or
reason about.

This aligns with the project’s coding rule of one module, one job.

---

## 30. Export System Purpose

The export system turns a strategy session (or loaded history entry) into
reusable, archivable artifacts.

Two surfaces exist:

- **Markdown export** (Notion / Obsidian ready) — `StrategyExportSource` +
  `assembleStrategyExportMarkdown`. Assembles title, metadata bullets,
  original prompt (blockquote), Breakdown (verbatim), fenced Pine Script,
  plus optional Health Score / Alert Templates / Backtesting Summary sections
  when those analyses have already been run in the session. Pure, deterministic,
  no new AI calls. Client-side copy + `.md` download.

- **Pro-only Snapshot export** (self-contained `.html`) — `actions/export-snapshot.ts`
  (Server Action with plan check) + `strategy-snapshot-html.ts` + styles.
  Produces a beautiful, offline, print-friendly single file containing:
  syntax-highlighted script, assumptions, health card, alerts (collapsible JSON),
  backtest sections, lineage diff (when present), QR back-link. Uses exact
  terminal neon tokens and a tiny embedded Pine tokenizer. Fully deterministic.

Why this matters:

- many serious traders journal strategies in Notion/Obsidian or want a
  portable record for review/print
- generated + analyzed output becomes far more valuable when it can be
  archived cleanly outside the app
- snapshot is a premium differentiator (free users see a lock + upgrade toast)

The intent is consistent with the rest of the app: PineForge supports the full
strategy workflow (generate → analyze → organize → export), not just the first
generation.

---

## 31. Why Certain Product Decisions Were Made

Below are some of the most important decisions and the reasoning behind them.

## 31.1 Full script replacement on refine

Why:

- easier saving
- easier compare view
- easier user mental model

Tradeoff:

- more tokens than patch-based editing

Why the tradeoff is worth it:

- much simpler product behavior

## 31.2 Anonymous first, account later

Why:

- lowers onboarding friction
- lets users try value before committing

Tradeoff:

- dual storage model adds complexity

Why the tradeoff is worth it:

- better activation path for new users

## 31.3 Strongly scoped AI instead of open chat

Why:

- higher output consistency
- clearer user expectations
- easier product messaging
- easier guardrails

Tradeoff:

- less flexibility

Why the tradeoff is worth it:

- PineForge wins by depth in one workflow, not breadth everywhere

## 31.4 Specialized support tools around generation

Why health, alerts, and backtest summaries exist:

- generation alone is not a full trader workflow
- adjacent tools increase retention and practical value

## 31.5 Terminal-style design language

Why:

- aligns with trader expectations
- differentiates from bland AI SaaS design
- makes output feel technical and trustworthy

---

## 32. What Makes This App More Than A Simple AI Wrapper

A lot of AI products are just:

- text box
- prompt
- model call
- plain output

PineForge is more than that because it adds:

- structured inputs
- history and persistence
- refinement versioning
- plan gating
- rate limiting
- strategy analysis tools
- search, tags, stars, and collections
- TradingView workflow support
- export support

That means the project’s real value is in orchestration and workflow design, not
just in calling a model.

---

## 33. How To Read The Codebase In A Smart Order

If you want to learn the project efficiently, this is a good reading order:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/code-standards.md`
4. `context/ui-context.md`
5. `app/(app)/generate/page.tsx` (or `app/(app)/layout.tsx` for the shared shell)
6. `components/generate/GenerateExperience.tsx`
7. `components/strategy/StrategyForm.tsx`
8. `hooks/useScriptHistory.ts` (the unified switcher)
9. `app/api/generate/route.ts`
10. `app/api/refine-script/route.ts`
11. `lib/api/validation.ts`
12. `drizzle/schema.ts`
13. `lib/scripts/` (lineage, tags, fingerprint, history helpers)
14. `lib/export/` (source contract, markdown, snapshot HTML)
15. `lib/db/` (mappers + query helpers for everything)

For the analysis tools:

16. `hooks/useHealthScore.ts` + `app/api/health-score/route.ts` (pattern repeats for alerts / backtest)

For Phase 7 depth:

17. `app/(app)/templates/` + `lib/templates/` (library + preload)
18. `app/(app)/reports/` + comparison report routes + `CoverageMap`
19. `app/(app)/progress/` + `lib/progress/` + persisted healthScore usage
20. `lib/scripts/fingerprint.ts` + `StrategyFingerprint` (DNA badges)

If you want to study Forge after the generator:

21. `app/(app)/forge/page.tsx`
22. `components/forge/ForgeExperience.tsx` + `ForgeChat.tsx`
23. `app/api/forge/route.ts` (the streaming brain + onFinish orchestration)
24. `lib/agent/` (system-prompt, guardrails, tools/*, tool-runners, memory-extraction, tips, persist-turn)
25. `app/api/forge/conversations/` + `lib/db/agent-conversations.ts` + `lib/db/agent-memory.ts`

That path lets you understand the app in the same order a user experiences it:

- product concept
- architecture + standards
- main authenticated shell + generator
- state + persistence contracts
- API boundaries and AI routes
- workflow depth (templates / reports / progress / variants / fingerprints / export)
- Forge conversational orchestration on top of everything else

---

## 34. Current Maturity Snapshot

What PineForge already does well:

- clear, narrow product positioning ("strategy compiler" for TradingView traders)
- complete end-to-end generator + analysis + organization + export workflow
- polished terminal/trading-desk UX with strong keyboard power-user support
- robust persistence (local → account seamless, stars protect important work)
- rich organization (tags, collections, search, DNA fingerprints)
- deep Phase 5–7 tooling (Health, Alerts, Backtest, Assumptions, Variants,
  Comparison Reports, Quality Tracker, Snapshot Export, Research→Generate)
- full Forge Agent (tool orchestration, memory, guardrails, contextual tips,
  research handoff, script attachment)
- strong security posture (Zod everywhere, ownership checks, plan entitlement,
  rate limits + stream locks, sanitized errors only, no raw LLM output trusted)
- excellent separation of concerns (small hooks, pure mappers, contract-driven
  tools, narrow routes)

What is still evolving (tracked in `context/fixes.md` and future work):

- weighted per-route AI quotas and audit logging
- Stripe billing + automatic plan enforcement (currently manual `users.plan`)
- `/pricing` page and marketing alignment with real limits
- server-side 50-entry caps on script writes (client already caps)
- deeper observability for production abuse / cost monitoring

All core Phases 1–7 (through spec 68) are complete and the build is clean.

---

## 35. Final Mental Model

The best way to think about PineForge is:

**PineForge is a focused AI strategy workflow application for TradingView
traders.**

It is built around one primary promise:

> turn a trading idea into a usable Pine Script workflow quickly

Everything else in the app supports that promise:

- the landing page sells the value
- the generator executes the core loop (describe → generate → analyze → refine)
- `/templates` gives high-quality starting points with pre-computed analyses
- health / alerts / backtest / assumptions / variants deepen understanding
- comparison reports and the `/reports` + `/progress` surfaces add reflection
- Forge orchestrates the entire surface conversationally (with memory + tips)
- research handoff + "Generate from research" creates a research→code loop
- history + stars + tags + collections + DNA fingerprints preserve the library
- TradingView handoff + markdown + Pro snapshot export make output portable
- plan gating, rate limits, ownership, and guardrails keep it safe and sustainable

That is why the architecture, UI tokens, database model (rich metadata jsonb +
agent tables), API split (AI vs data routes), and hook boundaries all feel
coordinated. The app is deliberately narrow: it does one valuable workflow for
retail TradingView traders extremely well instead of trying to be a general
trading chatbot or execution platform.
