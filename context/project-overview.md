# PineForge — Project Overview

## Overview

PineForge is a premium AI-powered Pine Script v5 generator
built for retail traders who use TradingView daily. It turns a plain-English
strategy description and an account balance into a complete, production-ready
Pine Script — with three-tier buy alerts, automatic Stop-Loss and Take-Profit
lines, and risk sizing based on the user's actual account. It is positioned as
a "strategy compiler" for traders: less about general AI chat, more about
removing the hours of manual Pine Script writing and debugging between having
a trading idea and seeing it on a chart.

**Tagline**: "Describe it. PineForge writes it. You trade it."

## Goals

1. Let traders go from strategy idea to working TradingView indicator in under 15 seconds
2. Produce consistent, valid Pine Script v5 output without requiring prompt engineering
3. Support iterative refinement so traders evolve strategies without starting from scratch
4. Phase 4: Build proper foundation (Clerk auth + Neon Postgres + Drizzle ORM + rate limiting)
5. Phase 5: Add high-value workflow features that turn PineForge into a complete daily driver for active traders (TradingView deep link, Health Score, Alert Templates, Backtest Plans, Starred scripts, Tags, Collections, Notion export)
6. Phase 6: Forge Agent — an AI strategy workflow agent with tool calling, persistent memory, and orchestration over existing PineForge features, accessible on a dedicated `/forge` page

## Core User Flow

1. User lands on `/` — understands the value from the hero section
2. User clicks **Start Generating** → arrives at `/generate`
3. User clicks a template pill or writes a custom strategy description
4. User optionally opens Advanced Options (timeframe, market, direction, indicators, R:R)
5. User enters account balance and selects a Grok model
6. User clicks **Generate Pine Script** — right panel streams live output
7. Stream ends → shiki highlights the script, validator badge appears, stats shown
8. User clicks **Copy** or **Download `.pine`** → pastes into TradingView Pine Editor
9. Optionally: user refines the script via Refine Chat below the output
10. Script auto-saves to History — reloadable in future sessions

## Features

### Core Generation

- AI Pine Script v5 generation via xAI Grok + Vercel AI SDK (streaming)
- Three Grok model options: Reasoning / Fast / Grok-4
- Three-tier named alert conditions built into every generated script
- Automatic SL/TP lines and risk sizing from account balance

### Input Tools

- 8 strategy template pills (fills textarea, still editable)
- Advanced Options collapsible: timeframe, market, direction, indicators, R:R slider
- "Improve My Prompt" button — rewrites raw description into structured prompt

### Output Tools

- Live streaming with skeleton loading state and "Streaming" badge
- shiki syntax highlighting applied post-stream (emerald-300 on near-black)
- Client-side Pine Script v5 validator badge (green / amber)
- Generation stats: time elapsed + estimated token count
- Copy to clipboard + Download as `.pine`

### Iteration & History

- Refine Chat: conversational follow-up, streams full replacement script
- Script History: localStorage drawer (shadcn Sheet), max 50 entries
- Versioning: each refinement saves as new version linked to original

### Landing Page

- Marketing page at `/` with hero, feature grid, how-it-works, code preview, CTA

## Phase 5 — Value Expansion Features (High & Medium Value)

These features will be implemented in Phase 5, after the auth + database foundation (Phase 4).

### High Value (Ship Early — Even Before Full Auth)

- **TradingView Auto-Import / Deep Link** — One-click button to open the generated script directly in TradingView Pine Editor (or copy the special URL scheme). Removes the last manual friction.
- **Strategy Health Score** — After generation, run a quick AI analysis and give a 1–10 "Health Score" with specific actionable notes (e.g. "Missing volume filter — high false signal risk in low liquidity").
- **Alert Message Templates** — Generate ready-to-use webhook JSON for popular brokers (3Commas, Alertatron, WunderTrading, etc.) alongside the Pine Script.
- **Strategy Backtesting Summary Generator** — Button that produces a structured Markdown checklist: recommended timeframes, markets, what to look for in equity curve, common failure modes for this strategy type.

### Medium Value (Better After Auth + DB)

- **Pinned / Starred Scripts** — Users can star important strategies so they never get evicted from the 50-entry history limit. Per-user, survives across devices.
- **Strategy Tags + Search** — Users can tag scripts (e.g. "crypto", "scalping", "15m", "live") and search/filter their entire history.
- **Strategy Collections / Folders** — Group scripts into named collections ("BTC Strategies", "Testing", "Live Trading"). Requires user accounts.
- **Export to Notion / Obsidian** — One-click export of the Breakdown tab as clean Markdown file (with metadata). Serious traders who journal their strategies will love this.

Implementation planning for the medium-value set is intentionally split into
small feature specs under `context/features/` so schema/data reuse, routes,
state, and UI can ship in narrow units.

## Phase 6 — Forge Agent

A dedicated AI strategy workflow agent on `/forge` that ties together every
PineForge feature into one conversational surface. Forge is a **strategy
workflow agent**, not a trading advisor — it helps users build, analyze, and
organize Pine Script strategies faster by orchestrating existing PineForge
capabilities through natural conversation.

### Core Capabilities

- **Tool calling** — the agent calls existing PineForge backend features as tools
  (Health Score, Backtesting Summary, Alert Templates, script search, script
  refinement) and presents results inline in the conversation
- **Persistent memory** — short-term (per-conversation thread) and long-term
  (cross-session user profile: preferred markets, timeframes, indicator patterns,
  strategy history insights)
- **Strategy research** — web search scoped to trading strategy and indicator
  research (not market data, not price predictions, not buy/sell advice)
- **Orchestration** — chains multiple tools in a single conversation turn
  (e.g. generate → health score → backtest summary → alert templates)
- **Guardrails** — clear refusal patterns for out-of-scope requests (financial
  advice, live market data, trade execution); output validation on tool results

### Not Included

- Live market data or price feeds
- Trade execution or broker connections
- Buy/sell recommendations or portfolio tracking
- Telegram / email notifications
- Proactive or unprompted agent suggestions

Feature specs live in `context/features/51–58`.

## Phase 7 — Depth & Polish

Phase 7 deepens the existing workflow surface without adding external dependencies,
new data sources, or scope violations. Every item stays within PineForge's core
identity: a focused strategy workflow tool for TradingView traders.

### Priority 1 — Strategy Templates Library (`59`)

A curated `/templates` page (or section within `/generate`) shipping 20–50
hand-crafted Pine Script templates organised by trading style, market, and
complexity. Not user-generated — quality-controlled by the product.

- One-click "Use as base" loads a template into the generator for customisation
- Each template ships with a pre-computed Health Score, Backtest Summary, and
  Alert Templates so users see the full output before they even edit anything
- Tags: `beginner`, `trend`, `mean-reversion`, `breakout`, `scalping`, `swing`,
  `multi-timeframe`
- Free users get a subset; Pro users get the full library (upgrade lever)
- SEO opportunity: public template detail pages rank for Pine Script strategy terms
- Natural evolution of the 8 existing template pills — same concept at full depth

### Priority 2 — Strategy Assumptions Block (`60`)

Every generated script gains an explicit **Assumptions** section in the Breakdown
tab. The generation prompt is extended to produce: "This strategy assumes: trending
market, liquid asset, no major news events, spread < X pips."

- Health Score references assumptions when flagging risks
- Reduces the #1 user complaint ("why did this fail?") by surfacing expected conditions
- Trivial implementation: a prompt addition + a new named section in the breakdown

### Priority 3 — Research → Generate Pipeline (`61`)

Make Forge's existing web-search tool a first-class "Research" workflow with a
direct handoff into the generator.

- New conversation type `research` (distinct icon + label in the sidebar)
- Forge synthesises the research thread into a structured generation prompt
- "Generate from this research" button pre-fills `/generate` with: description,
  recommended indicators, timeframe, market — all derived from the research
- Creates a 2-step workflow: research → generate (increases session depth)
- Research threads are already saved as conversations; this gives them a new role

### Priority 4 — Strategy DNA Fingerprint (`62`)

Every script in history gets a small procedural visual fingerprint — a deterministic
SVG badge encoding its characteristics: indicators used, timeframe, direction,
complexity, risk profile.

- Displayed beside each script entry in the history drawer
- Generated client-side from script metadata (no AI, no new API calls)
- Makes long history lists visually scannable without reading titles
- Nobody else does this — memorable differentiator aligned with terminal identity

### Priority 5 — Strategy Comparison Reports (`63`)

User selects 2–3 scripts from their library → Forge produces a structured
comparison report.

- Covers: entry logic differences, risk profile, market condition suitability,
  timeframe alignment, and a "Coverage Map" (which conditions each strategy handles)
- Output: a new artifact type (`report`) saved alongside scripts
- v2 adds "Portfolio thinking": do these strategies overlap or complement each other?
- Leverages existing Forge memory, tool infrastructure, and collections

### Priority 6 — Strategy Variants Quick-Generate (`64`)

After generation, an optional "Generate 3 variants" action produces:

- Variant A: tighter stops, faster signals
- Variant B: wider stops, fewer false signals
- Variant C: alternative indicator for the same concept (e.g. EMA → VWAP)

Each variant saves as a separate script with lineage back to the original.
Free users get 1 variant; Pro users get all 3 (upgrade lever).

### Priority 7 — Quality Progression Tracker (`65`)

A lightweight personal dashboard showing how a user's strategies improve over time.

- Average Health Score trend (weekly)
- Most common risk themes from past Health Scores
- Refinement iteration counts per script
- Forge memory insight: "You've shifted from simple EMA to multi-indicator
  approaches over the last month"
- Pure aggregation over existing data — no new infrastructure

### Priority 8 — Strategy Snapshot Export (`66`)

A premium export producing a self-contained, beautifully formatted HTML file
containing the full strategy record:

- Syntax-highlighted Pine Script
- Health Score card
- Backtest Summary
- Alert Templates
- Generation metadata
- Comparison diff (if refined)
- QR code back-linking to PineForge

Pro-only feature. Built on top of the existing markdown serialiser (spec `49`).

### Priority 9 — Contextual "Did You Know" Tips in Forge (`67`)

After tool results surface inside Forge, contextually relevant Pine Script tips
appear — triggered by tool output, never proactively.

- After Health Score flags "no volume filter": tip fires suggesting the fix
- After RSI strategy generates: tip mentions a common RSI calibration for the
  selected timeframe
- Memory prevents repeating tips the user has already seen
- Stays strictly reactive (no proactive suggestions), consistent with guardrails

### Priority 10 — Keyboard Power User Mode (`68`)

Extends the existing Ctrl+K / Ctrl+Enter / Ctrl+T shortcut system into a
fully keyboard-navigable experience matching the terminal identity.

- Numbered output tab shortcuts (1=Script, 2=Breakdown, 3=Health, etc.)
- Vim-style history navigation (j/k to move, Enter to load, d to delete)
- Tab-indexed flow through all generator inputs
- Contextual status-bar hints showing available shortcuts for the current panel

---

## Scope

### In Scope

- Pine Script v5 generation and refinement
- Client-side history via localStorage (Phase 1–3)
- Phase 4: Clerk auth + Neon Postgres + Drizzle ORM + Upstash rate limiting + per-user history migration
- Phase 5: High & Medium value workflow features (TradingView deep link, Health Score, Alert Templates, Backtest Plans, Starred scripts, Tags, Collections, Notion export)
- Phase 6: Forge Agent — AI strategy workflow agent with tool calling, memory, and orchestration (dedicated `/forge` page)
- Phase 7: Depth & polish — Templates Library, Assumptions Block, Research→Generate, DNA Fingerprint, Comparison Reports, Variants, Quality Tracker, Snapshot Export, Contextual Tips, Keyboard Power Mode

### Out of Scope

- Live trading execution or broker integration
- Backtesting engine
- TradingView live chart integration
- Team collaboration or community features
- General-purpose AI chat (the Forge Agent is a **scoped strategy workflow agent** with defined tools and guardrails)
- Pine Script IDE or version-controlled notebook
- Daily/scheduled proactive reports or unprompted agent suggestions
- Live market data or price feeds

## Success Criteria

1. Average generation time under 15 seconds
2. Streaming visibly begins within 2 seconds of clicking Generate
3. Landing → generator conversion above 35%
4. Average generations per user per week above 8
5. D7 retention above 40%
6. Users describing the tool as "professional" and "time-saving"
