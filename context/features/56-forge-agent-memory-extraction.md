# 56 — Forge Agent Memory Extraction

Defines how the long-term user profile (`agent_memory.profile`) gets
populated from conversation history. This is a background process that
runs after a conversation exchange, not during.

## Goal

After enough conversation turns, the agent should "know" the user's
preferences without being told each time. Memory extraction reads recent
conversations and updates the structured `AgentUserProfile` so the system
prompt in spec `55` has personalized context on every future conversation.

## Trigger

Memory extraction runs at the **end of a conversation exchange** (in the
`onFinish` callback of spec `55`'s streaming endpoint), but only when:

1. The conversation has at least **4 user messages** (enough signal to
   extract meaningful preferences — not on the first quick question)
2. At least **1 hour** has passed since `agent_memory.updated_at` for this
   user (debounce — avoids re-extracting on every message in a rapid session)

If either condition is not met, extraction is skipped silently. This keeps
the cost low — extraction runs at most once per hour per user, and only
when there is meaningful new conversation data.

## Extraction Flow

1. **Load recent conversations** — fetch the 3 most recently updated
   conversations for the user (full messages). These provide the richest
   recent signal. Older conversations have already contributed to previous
   extractions.
2. **Load existing profile** — `getAgentMemory(userId)` returns the current
   `AgentUserProfile` or `{}`.
3. **Build extraction prompt** — a `generateObject` call (not `streamText`)
   with the existing profile + recent conversation messages as context.
   The prompt asks the model to produce an updated `AgentUserProfile`.
4. **Validate** — the output is validated against `agentUserProfileSchema`
   (Zod) before persisting. Invalid output is discarded (existing profile
   stays unchanged).
5. **Merge** — new profile fields are merged with the existing profile.
   The merge is additive for arrays (new values union with existing, capped
   at limits) and replacement for scalars (`riskTolerance`,
   `averageHealthScore`).
6. **Persist** — `upsertAgentMemory(userId, mergedProfile)` writes to the
   `agent_memory` table with an upsert on `user_id`.

## Extraction Prompt

`lib/agent/memory-extraction.ts` exports:
- `MEMORY_EXTRACTION_SYSTEM` — system prompt for the extraction call
- `buildMemoryExtractionUserPrompt(existingProfile, conversations)` —
  user prompt with conversation excerpts

### System Prompt

```
You are a preference extraction assistant. Given a user's recent
conversations with a Pine Script strategy assistant, extract or update
their trading preferences profile.

Rules:
- Only extract preferences that are clearly stated or strongly implied
- Do not invent preferences the user hasn't shown
- Preserve existing preferences unless the user explicitly contradicts them
- Keep insights actionable and specific (not generic observations)
- Cap arrays at their maximum lengths
```

### User Prompt Structure

```
## Current Profile
[JSON of existing AgentUserProfile, or "No profile yet."]

## Recent Conversations
[Last 3 conversations, each as a condensed excerpt:
 - conversation title
 - user messages only (assistant messages are context but not extracted)
 - tool calls and results mentioned (e.g. "User ran Health Score: 6/10")
 - max ~2000 tokens per conversation to control cost]

## Task
Update the profile based on these conversations. Return the complete
updated profile (not just the diff).
```

## Output Schema

```ts
const agentUserProfileSchema = z.object({
  preferredMarkets: z.array(z.string().max(20)).max(10).optional(),
  preferredTimeframes: z.array(z.string().max(10)).max(8).optional(),
  preferredIndicators: z.array(z.string().max(30)).max(10).optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  strategyPatterns: z.array(z.string().max(30)).max(8).optional(),
  averageHealthScore: z.number().min(1).max(10).optional(),
  totalStrategiesGenerated: z.number().int().min(0).optional(),
  insights: z.array(z.string().max(200)).max(10).optional(),
  lastExtractedAt: z.string().optional(),
});
```

`totalStrategiesGenerated` is computed from a simple `count(*)` on the
user's scripts table, not extracted from conversations. It's set during
the merge step for accuracy.

`lastExtractedAt` is set to the current ISO timestamp during the merge
step, not by the LLM.

## Merge Logic

```ts
function mergeProfiles(
  existing: AgentUserProfile,
  extracted: AgentUserProfile,
  scriptCount: number,
): AgentUserProfile {
  return {
    preferredMarkets: uniqueMerge(existing.preferredMarkets, extracted.preferredMarkets, 10),
    preferredTimeframes: uniqueMerge(existing.preferredTimeframes, extracted.preferredTimeframes, 8),
    preferredIndicators: uniqueMerge(existing.preferredIndicators, extracted.preferredIndicators, 10),
    riskTolerance: extracted.riskTolerance ?? existing.riskTolerance,
    strategyPatterns: uniqueMerge(existing.strategyPatterns, extracted.strategyPatterns, 8),
    averageHealthScore: extracted.averageHealthScore ?? existing.averageHealthScore,
    totalStrategiesGenerated: scriptCount,
    insights: mergeInsights(existing.insights, extracted.insights, 10),
    lastExtractedAt: new Date().toISOString(),
  };
}
```

- `uniqueMerge(a, b, cap)` — union of arrays, deduplicated (case-insensitive
  for markets/timeframes/indicators), capped at `cap`. New items go to the
  end; overflow trims from the start (oldest preferences evicted).
- `mergeInsights(a, b, cap)` — extracted insights replace existing ones
  with the same semantic meaning (TBD — v1 can simply append and trim
  oldest). Capped at 10.

## Cost Control

- `generateObject` (not `streamText`) — cheaper, no streaming overhead
- `temperature: 0` — deterministic extraction, no creative output
- `maxOutputTokens: 800` — profile is a small structured object
- Model: same as the user's plan entitlement (Fast for free, resolved for Pro)
- Debounce: max once per hour per user
- Input: max ~6000 tokens (3 conversations × ~2000 tokens each)
- This call does **not** count against the user's daily AI quota — it's
  an internal maintenance operation, not a user-initiated action

## DB Helpers

New helpers in `lib/db/agent-memory.ts` (re-exported from `lib/db/index.ts`):

- `getAgentMemory(userId)` — select `profile` from `agent_memory` where
  `user_id = userId`; returns `AgentUserProfile` or `{}`
- `upsertAgentMemory(userId, profile)` — insert or update on conflict
  `(user_id)`, sets `profile` and bumps `updated_at`
- `getMemoryLastUpdated(userId)` — returns `updated_at` timestamp for
  debounce check (avoids loading the full profile just to check timing)

## File Structure

```
lib/agent/memory-extraction.ts   → MEMORY_EXTRACTION_SYSTEM, builder, mergeProfiles
lib/db/agent-memory.ts           → getAgentMemory, upsertAgentMemory, getMemoryLastUpdated
```

## Scope Limits

- No UI for viewing or editing the memory profile (v1 — the profile is
  internal to the agent's system prompt)
- No manual "forget me" button (future — would clear `agent_memory` row)
- No real-time extraction during conversation (only post-exchange)
- No extraction from scripts the user generates outside of Forge
  conversations (only Forge conversations feed memory)
