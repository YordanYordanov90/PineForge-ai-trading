# 52 — Forge Agent Memory Schema

Data contract and Drizzle migration for the Forge Agent's persistence layer.
Two new tables: `agent_conversations` (short-term, per-thread) and
`agent_memory` (long-term, per-user profile).

## Goal

Give the agent persistent memory so conversations survive page reloads and
the agent personalizes over time based on accumulated user context.

## Tables

### `agent_conversations`

Stores individual conversation threads. Each user can have multiple
conversations. Messages are stored as a JSON array in a single jsonb column
(not one row per message) to keep reads cheap — a conversation is always
loaded in full.

```ts
export const agentConversations = pgTable('agent_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 200 }),
  messages: jsonb('messages').$type<AgentMessage[]>().notNull().default([]),
  scriptId: integer('script_id').references(() => scripts.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Column notes:**
- `title` — auto-generated from the first user message (agent summarizes
  to ~60 chars), or `null` for brand-new conversations. Updatable.
- `messages` — JSON array of `AgentMessage` objects (see Message Format below).
  Append-only in normal operation; never partially updated.
- `script_id` — optional FK to `scripts.id`. Set when the conversation
  was started from `/forge?scriptId=<id>`. The agent uses this to load
  initial context. Nullable because not every conversation starts from
  a specific script.
- `updated_at` — bumped on every message append. Used for "last active"
  sort in the conversation list.

**Limits:**
- Max conversations per user: 50 (same FIFO pattern as script history —
  oldest non-active conversation is soft-deleted when the cap is reached).
- Max messages per conversation: 200 (hard limit enforced by the streaming
  endpoint; agent tells the user to start a new conversation when close).
- No message-level pagination — conversations are loaded whole. At 200
  messages this is roughly 50–100KB of JSON, acceptable for a single read.

### `agent_memory`

Stores the long-term user profile. One row per user (unique constraint on
`user_id`). The `profile` jsonb column holds structured preferences
extracted from conversations over time (spec `56` defines the extraction
logic).

```ts
export const agentMemory = pgTable('agent_memory', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  profile: jsonb('profile').$type<AgentUserProfile>().notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## Message Format

The `AgentMessage` type represents a single turn in the conversation.
Stored inside the `messages` jsonb array on `agent_conversations`.

```ts
type AgentMessageRole = 'user' | 'assistant' | 'tool';

interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: AgentToolResult[];
  createdAt: string; // ISO timestamp
}

interface AgentToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface AgentToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
}
```

**Design notes:**
- The shape mirrors the Vercel AI SDK's internal message format closely
  so serialization/deserialization between the SDK and the DB is minimal.
- `toolCalls` and `toolResults` are on the message object (not separate
  rows) because they are always displayed inline with the conversation.
- `createdAt` is per-message (not just per-conversation) so the UI can
  show timestamps on individual turns.

## User Profile Format

The `AgentUserProfile` type defines the long-term memory structure.
Spec `56` (memory extraction) owns how this gets populated; this spec
defines the shape only.

```ts
interface AgentUserProfile {
  preferredMarkets?: string[];      // e.g. ["BTC", "ETH", "SPY"]
  preferredTimeframes?: string[];   // e.g. ["5m", "15m", "1h"]
  preferredIndicators?: string[];   // e.g. ["RSI", "MACD", "EMA"]
  riskTolerance?: string;           // e.g. "conservative", "moderate", "aggressive"
  strategyPatterns?: string[];      // e.g. ["momentum", "scalping", "mean-reversion"]
  averageHealthScore?: number;      // rolling average from Health Score runs
  totalStrategiesGenerated?: number;
  insights?: string[];              // free-text observations, max 10
  lastExtractedAt?: string;         // ISO timestamp of last extraction run
}
```

**Design notes:**
- All fields are optional so a fresh profile is an empty `{}` and the
  agent gracefully handles missing data (no preferences to reference yet).
- `insights` is a bounded free-text array for observations the extraction
  prompt captures that don't fit structured fields (e.g. "User consistently
  forgets volume filters", "Prefers 3Commas for alert automation").
  Capped at 10 entries — older insights are evicted when new ones arrive.
- `averageHealthScore` and `totalStrategiesGenerated` are denormalized
  from the scripts table for quick injection into the system prompt
  without querying the full script history.

## Migration

This spec requires a new Drizzle migration (`drizzle-kit generate`).

**Tables created:**
- `agent_conversations` — with FK to `users(id)` and optional FK to `scripts(id)`
- `agent_memory` — with FK to `users(id)` and unique constraint on `user_id`

**Indexes:**
- `agent_conversations(user_id, updated_at DESC)` — for listing
  conversations by recency
- `agent_memory(user_id)` — unique index (implied by the unique constraint)

**No changes to existing tables.** The `users`, `scripts`, and
`collections` tables are untouched.

## Types Location

All types (`AgentMessage`, `AgentToolCall`, `AgentToolResult`,
`AgentUserProfile`, `AgentMessageRole`) live in `lib/types/agent.ts`
and are re-exported from `lib/types/index.ts`.

## Row Mappers

`lib/db/agent-mapper.ts` exports:
- `rowToAgentConversation(row)` → `SavedConversation`
- `rowToAgentMemory(row)` → `AgentUserProfile`

Re-exported from `lib/db/index.ts` for consistency with existing mappers.

```ts
interface SavedConversation {
  id: number;
  title: string | null;
  messages: AgentMessage[];
  scriptId: number | null;
  createdAt: string;
  updatedAt: string;
}
```

## Scope Limits

- This spec defines the schema and types only
- No CRUD routes (spec `54`)
- No streaming endpoint (spec `55`)
- No memory extraction logic (spec `56`)
- No UI (spec `57`)
