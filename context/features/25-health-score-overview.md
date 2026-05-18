# 25 — Strategy Health Score Overview

Add a post-generation **Strategy Health Score** to PineForge. The feature gives
traders a fast AI review of the generated Pine Script and the original strategy
intent so they can spot weak logic before testing in TradingView.

## Goal

After a script is generated or refined, the user can request a 1–10 score plus
short, actionable notes that answer a simple question:

> "How structurally sound is this strategy idea before I spend time backtesting it?"

This is a guidance tool, not a profitability claim and not a replacement for
real backtesting.

## User Value

- Reduces false confidence from "valid code" that still has weak trading logic
- Gives immediate next steps instead of generic AI commentary
- Makes PineForge feel like a trading workflow assistant, not only a script generator

## Output Shape

The Health Score result must always include:

- **Score** — integer from 1 to 10
- **Verdict** — short label such as `Fragile`, `Needs Work`, `Promising`, `Strong`
- **Summary** — 1 concise paragraph
- **Strengths** — 2 to 4 bullet points
- **Risks** — 2 to 4 bullet points
- **Next Steps** — 2 to 4 concrete actions the user can take next

## Scoring Intent

The score reflects structural trading quality, not predicted returns. The model
should consider:

- clarity of entry and exit rules
- presence or absence of risk controls
- likelihood of overfitting from too many conditions
- missing market context filters
- alert quality and execution readiness
- whether the script logic appears testable and interpretable

The score must **not** imply:

- expected win rate
- expected profitability
- financial advice
- certainty about live trading results

## Trigger Rules

- Available only when a script exists
- Works after both initial generation and refinement
- Manual trigger only in this feature unit; no automatic background scoring
- New generation or refine should clear any stale prior score until the user runs
  the analysis again

## UX Principles

- Keep the result compact and scannable
- Show the numeric score as the main signal
- Keep notes actionable and trader-oriented
- Do not bury the user in long-form explanation
- Treat failed analysis as recoverable, with a retry path

## Scope Limits

- No persistence in this first version
- No database schema changes
- No scoring trend history
- No auto-run after generation
- No broker/export integrations in this feature
- No changes to the Pine Script generation prompt itself

## Dependencies

- Existing generated script output
- Existing authenticated AI route protection pattern
- Existing output tab/card layout patterns on `/generate`

## Check When Done

- User can request a Health Score after generate/refine
- Result always contains score, verdict, summary, strengths, risks, next steps
- Score is clearly framed as analysis guidance, not performance prediction
- Stale score state clears when the current script changes
- Error state is understandable and retryable
