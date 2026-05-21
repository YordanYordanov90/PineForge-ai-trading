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

## Scope

### In Scope

- Pine Script v5 generation and refinement
- Client-side history via localStorage (Phase 1–3)
- Phase 4: Clerk auth + Neon Postgres + Drizzle ORM + Upstash rate limiting + per-user history migration
- Phase 5: High & Medium value workflow features (TradingView deep link, Health Score, Alert Templates, Backtest Plans, Starred scripts, Tags, Collections, Notion export)

### Out of Scope

- Live trading execution or broker integration
- Backtesting engine
- TradingView live chart integration
- Team collaboration features
- General-purpose AI chat
- Pine Script IDE or version-controlled notebook

## Success Criteria

1. Average generation time under 15 seconds
2. Streaming visibly begins within 2 seconds of clicking Generate
3. Landing → generator conversion above 35%
4. Average generations per user per week above 8
5. D7 retention above 40%
6. Users describing the tool as "professional" and "time-saving"
