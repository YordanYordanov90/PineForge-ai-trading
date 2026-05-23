# 51 — Forge Agent Overview

Product-level specification for the Forge Agent. No implementation detail —
specs `52`–`58` own the technical breakdown.

## Identity

**Name**: Forge (or ForgeAI in copy where disambiguation is needed).

Forge is PineForge's built-in **strategy workflow agent**. It helps power
users build, analyze, and organize Pine Script strategies faster by
orchestrating existing PineForge features through natural conversation.

Forge is **not**:
- A general-purpose chatbot
- A trading advisor
- A market data terminal
- A portfolio manager

Forge knows about Pine Script strategies and the user's history inside
PineForge. That is its world.

## User Value

1. **Orchestration** — instead of manually running Health Score, then
   Backtesting Summary, then Alert Templates one by one, the user asks
   Forge to chain them in a single conversation turn
2. **Memory** — Forge remembers what strategies the user has built, what
   scored well, what patterns they repeat, and uses that context to make
   better suggestions over time
3. **Strategy research** — before the user types a strategy description,
   Forge can help refine the idea through conversation, pulling from
   indicator knowledge and the user's history
4. **Cross-feature awareness** — Forge connects the dots between Health
   Score risks, Backtesting Summary suggestions, and the user's tagged
   and collected scripts in ways the individual features cannot

## Target User

Power users who generate 10+ strategies per week and want to get the most
out of PineForge. Not the default experience for new users — the generator
at `/generate` remains the primary entry point.

## Where It Lives

Dedicated page at `/forge` (Option B from the design discussion). Reasons:

- Full screen for conversation, tool results, and conversation history
- Clean separation from the generator (which stays fast and focused)
- Easy to showcase as a standalone feature
- Room for future capabilities without crowding `/generate`

Refine Chat on `/generate` stays as-is. It serves a different moment —
quick script tweaks, not deep strategy conversations.

## Entry Points

1. **Navbar**: "Forge" link in the main navigation (auth-required)
2. **Generator**: "Discuss with Forge" button on `/generate` after a
   script is generated — navigates to `/forge?scriptId=<id>`, and the
   agent loads that script as initial context
3. **Direct URL**: `/forge` loads with no initial context (new conversation)

## Core Capabilities

### 1. Strategy Research Assistance

Help the user develop a strategy idea before generation:
- "I want to build a scalping strategy for BTC on 5m — what indicators work?"
- Reference the user's previous strategies and their Health Scores
- Suggest improvements based on common weaknesses in the user's history

### 2. Tool-Based Feature Orchestration

Call existing PineForge backend features as tools during conversation:
- Run Health Score on a script and discuss the results
- Generate Backtesting Summary and walk through the checklist
- Create Alert Templates for a specific provider
- Search the user's script history by tags, collections, or text
- Refine a script based on conversation context

### 3. Persistent Memory

- **Short-term**: the conversation thread persists across page reloads
  within the same session
- **Long-term**: extracted user profile (preferred markets, timeframes,
  indicator patterns, risk tolerance) is injected into every conversation
  so Forge personalizes over time

### 4. Strategy Knowledge (Web Search)

Scoped web search for trading strategy and indicator research:
- "What is a VWAP anchored to session open?"
- "Common RSI divergence patterns for crypto"
- "Volume profile strategies for futures"

**Not** for: current prices, market news, sentiment analysis, or
buy/sell signals.

## Example Conversations

### New User — First Strategy

```
User: I want to build a scalping strategy for BTC on the 5m chart
Forge: What indicators are you thinking about? Common choices for 5m BTC
       scalping are EMA crossovers, RSI with tight thresholds, or VWAP bounce.
User: RSI + EMA cross sounds good
Forge: Got it. I'll set up a strategy with RSI(14) overbought/oversold zones
       and a 9/21 EMA crossover for entries. Want me to generate it?
User: Yes
Forge: [calls generate tool → script appears]
       Here's your script. Want me to run a Health Score?
User: Yeah
Forge: [calls health_score tool]
       Score: 6/10. Two risks flagged — no volume filter (high false signal
       risk in low liquidity) and no session filter (5m BTC behaves differently
       in Asian vs US sessions). Want me to refine the script to add a volume
       condition?
```

### Returning User — Memory in Action

```
User: I want to try something new
Forge: Looking at your history — you've done 8 momentum strategies this month,
       all RSI-based. Your highest Health Score (8/10) was the one with volume
       profile added. Want to try a mean-reversion approach for variety, or
       stick with momentum but explore different indicators like Stochastic RSI
       or CCI?
```

### Orchestration Chain

```
User: Generate a MACD crossover strategy for ETH 15m, then run everything on it
Forge: [calls generate tool]
       Script generated. Running the full analysis chain...
       [calls health_score tool]
       Health Score: 7/10 — solid entry logic, missing trailing stop.
       [calls backtest_summary tool]
       Backtesting plan ready — recommends testing on ETH/USDT and ETH/BTC,
       15m and 1h timeframes, watch for whipsaw in ranging markets.
       [calls alert_templates tool]
       Alert templates generated for 3Commas, Alertatron, and WunderTrading.
       Want me to refine the script to add a trailing stop before you export?
```

## What Forge Will Not Do

These are hard boundaries, not soft suggestions. The agent must refuse
clearly and redirect to something it can do.

| Request | Response Pattern |
|---------|-----------------|
| "Should I buy BTC right now?" | "I can help you build and analyze strategies, but I can't advise on trades. Want me to search your history for BTC strategies?" |
| "What's the current price of ETH?" | "I don't track live market data. I can help you build a strategy for ETH though — what timeframe are you thinking?" |
| "Will this strategy be profitable?" | "I can't predict profitability. But I can run a Health Score to check structural quality and a Backtesting Summary to give you a test plan." |
| "Connect to my Binance account" | "PineForge generates scripts for TradingView — I can't connect to brokers. Want me to generate alert templates for your preferred automation platform?" |

## Billing Consideration

The agent is a signed-in feature (auth-required). Billing model is TBD —
the current implementation does not gate on plan tier. Each tool call that
hits an AI route (health-score, backtest-summary, alert-templates, refine)
counts against the user's existing daily AI quota. The conversation itself
(the `streamText` call) is a separate token cost but shares the same rate
limiting infrastructure.

## Scope Limits for This Spec

- No implementation detail — specs `52`–`58` own the technical breakdown
- No Telegram/email notifications
- No proactive/unprompted agent suggestions
- No live market data integration
- No portfolio tracking
- Refine Chat on `/generate` is unchanged
