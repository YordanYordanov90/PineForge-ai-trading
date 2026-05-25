# 67 — Contextual Tips in Forge

## Goal

After Forge tool calls surface results inside a conversation, contextually
relevant Pine Script tips appear inline — triggered by the tool output,
never proactively.

---

## Problem

Forge gives users powerful workflow tools but doesn't help them learn from
the results. A Health Score flagging "no volume filter" is actionable, but
many users don't know *how* to apply that fix. Contextual tips bridge the
gap between diagnosis and knowledge — without turning Forge into a
general tutorial.

---

## Rules (Strict)

- Tips are triggered **only by tool results** — never on message send, never
  on conversation start, never on a timer
- A tip is shown **at most once per conversation**
- A tip is shown **at most once globally per user** (tracked in `agent_memory`)
- Tips never make market predictions, price references, or financial judgements
- Tips are purely educational: "here is a Pine Script pattern that addresses
  this type of issue"
- Each tip includes a "Refine with this tip" CTA that prefills Refine Chat
  (same pattern as spec `04-health-next-step-refine`)

---

## Tip Triggers and Content

| Trigger | Condition | Tip |
|---------|-----------|-----|
| Health Score result | Risk contains "volume" | Volume filter tip: `volume > ta.sma(volume, 20)` guard pattern |
| Health Score result | Risk contains "ATR" or "fixed stop" | ATR-based dynamic stop tip: `ta.atr(14)` for stop sizing |
| Health Score result | Risk contains "confirmation" | Secondary signal tip: adding a trend filter like `close > ta.ema(close, 200)` |
| Health Score result | Score < 5 | General "refinement often improves this" tip pointing to Refine Chat |
| Backtest Summary result | Section contains "false signal" | Choppiness Index filter tip |
| Alert Templates result | Always (first time only) | TradingView alert setup tip — how to connect alerts to the generated webhook JSON |

---

## Tip Schema

```ts
type ForgeTip = {
  id: string                   // e.g. "volume-filter", "atr-stop"
  triggerTool: ForgeToolName
  conditionFn: (toolResult: unknown) => boolean
  title: string
  body: string                 // plain English explanation
  codeSnippet?: string         // Pine Script example (short, ≤10 lines)
  refineSuggestion?: string    // pre-fills Refine Chat if user clicks CTA
}
```

---

## Memory Integration

After a tip is shown, its `id` is written to `agent_memory` under a new
`seenTips: string[]` field. This prevents the same tip from appearing again
across all future conversations.

`agent_memory` is already a JSONB field — no schema migration needed, just
an additional key in the stored object.

---

## Rendering

Tips render as a compact, distinctly styled inline card inside the Forge
conversation — below the relevant tool-call result card:

- Left border: amber (info/educational, not error)
- Header: `Lightbulb` icon + "Tip" label
- Title + body text
- Optional code snippet in a small monospace block
- "Refine with this" link-style CTA (not a full button — subtle)
- "Dismiss" (×) removes for the current session and marks as seen in memory

---

## Implementation in `/api/forge`

In the `onFinish` hook (already used for memory extraction in spec `56`):

1. Check if any tool calls in this turn produced results that match tip triggers
2. If so, pick at most 1 tip (highest priority by trigger order)
3. Check `agent_memory.seenTips` — skip if already seen
4. Append a special `type: 'tip'` assistant message to the conversation
5. Persist to `agent_messages`

The tip message type is non-streaming — it is added post-turn, not during
the stream. The client handles `type: 'tip'` messages by rendering
`ForgeTipCard` instead of the standard `ForgeMessageBubble`.

---

## Out of Scope (This Spec)

- Tips in the `/generate` page (outside Forge)
- User-requestable tips ("give me more tips")
- Tip categories or a tips library page
- Tips triggered by message content (only tool results)

---

## Affected Files

New:
- `lib/agent/tips.ts` — `FORGE_TIPS` array + `evaluateTipsForTurn()`
- `components/forge/ForgeTipCard.tsx`

Modified:
- `app/api/forge/route.ts` — call `evaluateTipsForTurn` in `onFinish`,
  append tip message if applicable
- `lib/agent/memory-extraction.ts` — write `seenTips` update alongside
  existing memory extraction
- `components/forge/ForgeMessageList.tsx` — render `ForgeTipCard` for
  `type: 'tip'` messages

---

## Success Criteria

- Health Score result with a volume risk triggers the volume filter tip
- Same tip never appears twice for the same user
- Tip "Dismiss" marks as seen and tip never reappears
- "Refine with this" prefills Refine Chat on `/generate` (if linked)
- No tip fires without a preceding tool call result in the same turn
- `npm run build` passes
