# Product Requirements Document (PRD)
**Grok Trading Strategy Generator**

**Version**: 1.1
**Date**: April 2026
**Status**: Active

---

## 1. Product Overview

A sleek, AI-powered web application that lets traders describe a trading strategy in plain English and instantly receive a complete, production-ready Pine Script v5 indicator with:
- Three-tier buy alerts (Getting Ready · Average · Strong)
- Automatic dynamic Stop-Loss & Take-Profit lines
- Risk management sized from account balance

**Tagline**: "Describe it. Grok writes it. You trade it."

**Live structure**:
- `/` — Marketing landing page (done)
- `/app` — Generator tool

---

## 2. Problem Statement

Traders waste hours manually writing and debugging Pine Script. They also suffer from emotional bias and inconsistent strategy execution. This tool removes friction and bias by turning natural language + account size into clean, ready-to-use TradingView scripts.

---

## 3. Target Users & Personas

- **Primary**: Day traders & swing traders (stocks & crypto)
- **Secondary**: Pine Script beginners and strategy developers

**Persona — "Alex"**
- 28-year-old retail trader, $15k–$50k account
- Uses TradingView daily
- Wants fast iteration without coding
- Came from the landing page, clicked "Start Generating"

---

## 4. Business Goals & Success Metrics

| Metric | Target |
|---|---|
| Average generations per user per week | > 8 |
| D7 retention | > 40% |
| NPS | ≥ 70 |
| Average generation time | < 15 seconds |
| Landing page → App conversion | > 35% |

---

## 5. Core Features (MVP + Roadmap)

### Phase 1 — Core Generator ✅ Done
- Free-text strategy prompt + account balance
- Model selection (Reasoning / Fast / Grok-4)
- Streaming Pine Script output (live Grok generation)
- Copy button
- Landing page with hero, feature grid, how-it-works, CTA

### Phase 2 — Premium Experience (Next)
- Prompt Templates gallery (8–10 presets)
- Structured inputs: Market, Timeframe, Direction, Indicators, R:R slider
- "Improve My Prompt" AI rewrite button
- Syntax highlighting with `shiki` (post-stream only)
- Download as `.pine` file
- Generation stats (time + estimated tokens)
- Live character count with color warnings

### Phase 3 — History & Iteration
- Strategy history with localStorage persistence
- Slide-in drawer UI (shadcn `Sheet`)
- Refine / follow-up chat (conversational iteration)
- Multi-tab output: Pine Script · Strategy Breakdown · Setup Checklist
- Script validator / linter badge
- Dark / Light theme toggle (`next-themes`)

### Phase 4 — SaaS Layer (Future)
- Clerk authentication
- Free tier: 3 generations/day
- Upstash rate limiting
- Neon Postgres + Drizzle persistent history (replaces localStorage)
- Public script sharing + gallery (`/strategy/[slug]`)
- TradingView webhook JSON builder

---

## 6. Error States (Required UX)

These must be handled visually — not just console errors:

| Error | Display |
|---|---|
| API timeout / Grok unavailable | Toast: "Generation timed out. Please try again." |
| Prompt too long (>1500 chars) | Inline: red char counter + disabled Generate button |
| Invalid balance input | Inline field error below balance input |
| Stream interrupted mid-way | Toast: "Stream interrupted. Partial script shown." + Stop button disappears |
| Rate limit hit (Phase 4) | Full inline banner: "Daily limit reached. Upgrade for unlimited." |
| Clipboard API unavailable | Toast: "Copy failed — please select and copy manually." |

---

## 7. Non-Goals (Out of Scope for v1–v3)

- Live chart integration
- Automated trading execution
- Backtesting engine
- Mobile-native app

---

## 8. Acceptance Criteria

- User can generate a valid Pine Script v5 in < 20 seconds
- Script contains exactly three named alerts + dynamic SL/TP lines
- Risk % is sized from account balance input
- Syntax highlighting renders correctly after stream completes (not during)
- History persists across browser sessions (Phase 3)
- Landing page → generator navigation works without full reload

---

*This document is the single source of truth for product decisions.*
