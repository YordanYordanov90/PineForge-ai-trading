# GrokTS — Project Overview

## Overview

GrokTS (Grok Trading Strategy) is a premium AI-powered Pine Script v5 generator
built for retail traders who use TradingView daily. It turns a plain-English
strategy description and an account balance into a complete, production-ready
Pine Script — with three-tier buy alerts, automatic Stop-Loss and Take-Profit
lines, and risk sizing based on the user's actual account. It is positioned as
a "strategy compiler" for traders: less about general AI chat, more about
removing the hours of manual Pine Script writing and debugging between having
a trading idea and seeing it on a chart.

**Tagline**: "Describe it. Grok writes it. You trade it."

## Goals

1. Let traders go from strategy idea to working TradingView indicator in under 15 seconds
2. Produce consistent, valid Pine Script v5 output without requiring prompt engineering
3. Support iterative refinement so traders evolve strategies without starting from scratch
4. Phase 4: monetize via a SaaS layer (Clerk auth, free/pro tiers, Neon Postgres history)

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

## Scope

### In Scope
- Pine Script v5 generation and refinement
- Client-side history via localStorage
- Phase 4: Clerk auth, Neon Postgres history, Upstash rate limiting, public sharing

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
