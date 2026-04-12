# GrokTS — Product Requirements Document

**Version**: 1.3
**Date**: April 2026
**Status**: Active development
**Author**: Yordan Yordanov

---

## Project Overview

`GrokTS` is a premium AI-powered Pine Script generator built for active traders who use TradingView daily. At its core it turns a plain-English strategy description and an account balance into a complete, production-ready Pine Script v5 indicator — with three-tier buy alerts, automatic Stop-Loss and Take-Profit lines, and risk sizing based on the user's actual account. The product is positioned as a "strategy compiler" for traders: less about general AI chat, more about removing the hours of manual Pine Script writing and debugging between having a trading idea and seeing it on a chart.

In simple terms: `GrokTS` lets traders describe what they want, lets Grok write the code, and gets them trading it within 15 seconds.

---

## Product Name

`GrokTS` (Grok Trading Strategy)

---

## Product Summary

`GrokTS` is an AI-assisted Pine Script generator for retail traders. It gives traders a fast, focused workspace to describe a strategy, configure key parameters, stream a production-ready Pine Script v5 in real time, and immediately copy or download it into TradingView. The experience is built around speed, trust signals (syntax validation, generation stats), and iterative refinement so traders can evolve a strategy without starting from scratch each time.

---

## Problem Statement

Traders with strong market intuition but limited coding ability waste hours writing, debugging, and iterating Pine Script manually. The gap between "I have a strategy idea" and "I have a working TradingView indicator" is too wide. Existing AI tools are generic chat interfaces that require heavy prompt engineering and still produce inconsistent Pine Script output. `GrokTS` closes that gap with a purpose-built generator that speaks trader language, enforces Pine Script v5 structure, and handles risk sizing automatically.

---

## Target Users

- Retail day traders and swing traders (stocks and crypto)
- TradingView users who know their strategy but cannot code
- Pine Script beginners who want a faster starting point
- Active traders who iterate on strategies frequently

**Persona — "Alex"**
- 28-year-old retail trader, $15k–$50k account
- Uses TradingView daily, comfortable with indicators but not Pine Script
- Wants to go from idea to chart in under a minute
- Will return every time he wants to test a new variation

---

## Jobs To Be Done

- "When I have a strategy idea, I want to turn it into working Pine Script without learning to code."
- "When I come back to refine my strategy, I want to iterate on the existing script, not start over."
- "When the script is generated, I want to trust it is valid before I paste it into TradingView."
- "When I generate multiple strategies, I want to find and reload previous ones without re-describing everything."

---

## Core Value Proposition

The fastest path from trading idea to working TradingView indicator — with three-tier alerts, automatic SL/TP, and risk sizing built in by default.

**Tagline**: "Describe it. Grok writes it. You trade it."

---

## Live Product Structure

| Route | Page | Status |
|---|---|---|
| `/` | Marketing landing page | ✅ Done |
| `/generate` | Generator tool | ✅ Done |
| `/strategy/[slug]` | Public share page | Phase 4 |

---

## Current State (April 2026)

The core generator is working well:

- Modern dark trading-terminal design with glassmorphic cards and emerald accents
- Quick strategy templates (pill buttons — 8 presets)
- Model selector: Reasoning / Fast / Grok-4
- Live streaming output with skeleton loading state and "Streaming" badge
- Syntax highlighting via `shiki` (applied post-stream)
- Generation stats (time elapsed + estimated tokens)
- Copy to clipboard with sonner toast
- Landing page with hero, feature grid, how-it-works section, and CTA

---

## MVP Scope

- User lands on marketing page and understands the value
- User navigates to `/generate`
- User selects a template or writes a custom strategy description
- User enters account balance and selects a model
- User clicks Generate — Pine Script streams live
- After generation: user sees validator badge, stats, Copy and Download buttons
- User can refine the script via follow-up chat without regenerating from scratch
- User can save scripts to a local history and reload them later

---

## Primary User Flow

1. User lands on `/` and sees the hero: "Describe it. Grok writes it. You trade it."
2. User clicks **Start Generating** → arrives at `/generate`
3. User clicks a template pill (e.g. "EMA Crossover") or types their own strategy
4. User optionally opens Advanced Options: sets Timeframe, Market, Direction, Indicators, R:R
5. User enters account balance and selects model
6. User clicks **Generate Pine Script** — left panel locks, right panel starts streaming
7. Skeleton rows appear, then code streams in live with emerald syntax color
8. Stream ends → shiki highlights the complete script, validator badge appears, stats show inline
9. User clicks **Copy** or **Download `.pine`**
10. User pastes into TradingView → Pine Editor → Add to chart
11. Optionally: user types a refinement in the Refine Chat below ("Add trailing stop after 1R")
12. Optionally: script auto-saves to History — user can reload it in a future session

---

## Key Features

### 1. AI Pine Script Generation

The core feature. Powered by xAI Grok via the Vercel AI SDK with streaming. The system prompt is strictly scoped to Pine Script v5 output only. Three Grok model options give users control over quality vs. speed.

### 2. Strategy Templates

Eight clickable preset pills above the textarea: 5m Momentum Breakout, RSI Divergence Reversal, VWAP Bounce Scalper, Opening Range Breakout, EMA Crossover Trend Follow, Gap-and-Go Day Trade, Bollinger Band Squeeze, Pre-Market High Break. Fills the textarea — user can still edit freely.

### 3. Structured Inputs (Advanced Options)

Collapsible panel with Timeframe, Market type, Direction, Indicators multi-select, and R:R slider. Values are appended to the Grok prompt automatically, improving output precision without requiring the user to write structured prompts manually.

### 4. Script Validator Badge

After stream ends, client-side heuristics check for `//@version=5`, `indicator()` or `strategy()`, matching parentheses counts, and at least one `alertcondition(` or `alert(` call (aligned with generated scripts that use `alert()` for tiered alerts). Shows a green "Valid Pine Script v5 ✓" badge or an amber warning in the output card header.

### 5. Refine Chat

A conversational follow-up panel that appears below the output card after first generation. Users type refinements ("Switch to strategy()", "Add short signals too") and the script is improved in a new streaming pass. Each refinement is saved as a versioned entry linked to the original.

### 6. Strategy History

Persisted in localStorage (Phase 2), later in Neon Postgres (Phase 4). Auto-saves every completed generation with prompt, balance, model, structured inputs, and script. Accessible via a slide-in shadcn `Sheet` drawer. Supports reload, rename, and delete.

### 7. Download as `.pine`

One-click download of the generated script as a `.pine` file with a timestamped filename. No extra dependencies — `Blob` + `URL.createObjectURL` with cleanup on click.

### 8. Syntax Highlighting

`shiki` applied after the stream ends (never during, as shiki is a static highlighter). Output renders in emerald-300 on a near-black background matching the terminal aesthetic.

### 9. "Improve My Prompt" Button

Calls `/api/improve-prompt` to rewrite the user's raw strategy description into a structured, detailed prompt before the main generation. One click to better output without manual prompt engineering.

---

## What The Product Is Not

- Not a live trading execution system
- Not a backtesting engine
- Not a TradingView replacement or live chart integration
- Not a team collaboration tool
- Not a general-purpose AI chat interface
- Not a Pine Script IDE or version-controlled notebook

---

## Functional Requirements

- Users must be able to describe a strategy and receive a valid Pine Script v5 output within 20 seconds
- The generated script must contain exactly three named alert tiers and dynamic SL/TP lines
- Risk sizing must be calculated from the account balance input
- The system must validate Pine Script structure client-side after generation
- Users must be able to copy the script to clipboard and download it as a `.pine` file
- Users must be able to refine a generated script conversationally
- Users must be able to save scripts to history and reload them in future sessions
- All API inputs must be validated server-side with Zod before any LLM call

## Non-Functional Requirements

- Average generation time under 15 seconds
- Streaming must begin visibly within 2 seconds of clicking Generate
- API keys must never be exposed to the client
- Raw LLM errors must never be surfaced to the user — all errors sanitized
- The UI must be fully responsive and usable on mobile
- Syntax highlighting must not cause a flash or layout shift when applied post-stream
- localStorage access must always be wrapped in try/catch

---

## Error States (All Must Be Handled Visually)

| Error | UI Treatment |
|---|---|
| API timeout / Grok unavailable | Rose banner in output card + sonner toast |
| Prompt too long (>1500 chars) | Red char counter + disabled Generate button |
| Invalid balance input | Red inline message below balance field |
| Stream interrupted mid-way | Partial script shown + amber "Stream interrupted" badge in output header |
| Rate limit hit (Phase 4) | Full-width banner above form with upgrade CTA |
| Clipboard API unavailable | Sonner toast only — "Copy failed, please select manually" |

---

## Phased Roadmap

### Phase 1 — Finish Premium Polish ✅ Complete

| Task | Priority | Status |
|---|---|---|
| Download as `.pine` button | ★★★★★ | ✅ Done |
| Validator badge in output header | ★★★★★ | ✅ Done |
| Structured Inputs + Improve My Prompt | ★★★★★ | ✅ Done |
| Move generation stats into output card header | ★★★★ | ✅ Done |
| Strengthen streaming glass effect | ★★★ | ✅ Done |

### Phase 2 — Daily Driver Features ⬜ Upcoming

| Task | Priority | Status |
|---|---|---|
| Script History (localStorage + Sheet drawer) | ★★★★★ | ⬜ Pending |
| Refine Chat (conversational iteration) | ★★★★★ | ⬜ Pending |
| Multi-tab output (Script + Breakdown + Checklist) | ★★★★ | ⬜ Pending |
| TradingView Webhook JSON export | ★★★★ | ⬜ Pending |

### Phase 3 — Polish & Trust ⬜ Future

- Dark / Light theme toggle (`next-themes`)
- Keyboard shortcuts (`Ctrl+Enter` generate, `Ctrl+K` command palette)
- Live character count with color thresholds
- Strategy comparison (side-by-side diff view)

### Phase 4 — SaaS Layer ⬜ Future

- Clerk authentication
- Free tier: 3 generations/day — Pro: unlimited
- Upstash rate limiting per user
- Neon Postgres + Drizzle (replaces localStorage history)
- Public script sharing + gallery (`/strategy/[slug]`)
- TradingView webhook builder UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK + @ai-sdk/xai (Grok) |
| Validation | Zod |
| Syntax highlight | shiki (post-stream) |
| Notifications | sonner |
| Auth (Phase 4) | Clerk |
| Database (Phase 4) | Neon Postgres + Drizzle ORM |
| Rate limiting (Phase 4) | Upstash Redis |

---

## Security Requirements

- All API keys in `.env.local` — never in source code, never committed to git
- `.env.example` with placeholder values committed to repo
- Zod validation on every API route before any LLM call
- Max prompt: 1500 characters enforced both client-side and server-side
- Sanitized error messages only — no raw LLM or stack errors to client
- `Content-Security-Policy` header in `next.config.ts`
- Rate limiting per IP (Phase 1 optional, Phase 4 required via Upstash)

---

## Success Metrics

| Metric | Target |
|---|---|
| Average generation time | < 15 seconds |
| Landing page → generator conversion | > 35% |
| Average generations per user per week | > 8 |
| D7 retention | > 40% |
| Traders returning 3+ times per week | Core retention signal |
| NPS | ≥ 70 |
| Users describing the tool as "professional" and "time-saving" | Qualitative target |

---

*This document is the single source of truth for product decisions on GrokTS.*
