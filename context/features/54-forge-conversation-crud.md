# 54 — Forge Conversation CRUD Routes

Standard REST endpoints for managing agent conversations. Pattern mirrors
the collections CRUD (spec `45`) — narrow routes, owner-scoped, Zod
validation, sanitized errors.

## Endpoints

### `GET /api/forge/conversations`

List the authenticated user's conversations, ordered by `updated_at` desc.

**Response**: `{ conversations: SavedConversation[] }`

- Returns title, id, createdAt, updatedAt, scriptId for each conversation
- Does **not** include the full `messages` array (too heavy for a list view).
  Messages are loaded on `GET /api/forge/conversations/[id]`.
- Signed-in but no DB user → `{ conversations: [] }` (soft-empty pattern)
- Max 50 conversations returned (matches the storage cap from spec `52`)

### `GET /api/forge/conversations/[conversationId]`

Load a single conversation with full messages.

**Response**: `{ conversation: SavedConversation }` (includes `messages`)

- 400 — invalid conversation ID
- 404 — no DB user or conversation not found
- 403 — conversation belongs to a different user

### `POST /api/forge/conversations`

Create a new conversation.

**Request body**:
```ts
const createConversationSchema = z.object({
  scriptId: z.number().int().positive().nullable().optional()
    .describe('Optional script ID to attach as initial context'),
});
```

**Response**: `{ conversation: SavedConversation }` (empty messages array)

- When `scriptId` is provided, validate that the script exists and belongs
  to the authenticated user (same ownership pattern as spec `46`). If the
  script doesn't exist or belongs to another user → 403.
- Auto-provisions DB user via `ensureDbUserForClerkId` (same as collections
  POST in spec `45`).
- If the user already has 50 conversations, delete the oldest conversation
  (by `updated_at`) that is not the one being created. This is FIFO
  eviction — no "pinned conversations" in v1.

### `PATCH /api/forge/conversations/[conversationId]`

Update conversation metadata (title only in v1).

**Request body**:
```ts
const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).trim(),
});
```

**Response**: `{ conversation: SavedConversation }` (without messages)

- 400 — invalid ID or Zod issues
- 403 — not the owner
- 404 — not found

### `DELETE /api/forge/conversations/[conversationId]`

Delete a conversation and all its messages.

**Response**: `{ ok: true }`

- 400 — invalid ID
- 403 — not the owner
- 404 — not found
- No cascade concerns — `agent_conversations` has no FKs pointing to it.
  The row is simply deleted.

## Route Files

```
app/api/forge/conversations/route.ts           → GET (list) + POST (create)
app/api/forge/conversations/[conversationId]/route.ts → GET (detail) + PATCH + DELETE
```

## Message Persistence

Messages are **not** managed by these CRUD routes. The streaming endpoint
(spec `55`) owns message appending — after each exchange completes, the
endpoint appends the new messages to the conversation's `messages` jsonb
array and bumps `updated_at`.

These CRUD routes provide the shell (create, list, load, rename, delete).
The streaming endpoint fills the shell with content.

## DB Helpers

New helpers in `lib/db/agent-conversations.ts` (re-exported from
`lib/db/index.ts`):

- `listConversationsForUser(userId)` — select id, title, scriptId,
  createdAt, updatedAt (no messages); order by `updated_at` desc;
  limit 50
- `getConversationForUser(userId, conversationId)` — select full row
  including messages; ownership check via `eq(agentConversations.userId, userId)`
- `createConversation(userId, scriptId?)` — insert with empty messages;
  handle FIFO eviction if count ≥ 50
- `updateConversationTitle(userId, conversationId, title)` — ownership-scoped update
- `deleteConversation(userId, conversationId)` — ownership-scoped delete
- `appendMessages(conversationId, userId, newMessages)` — used by spec `55`;
  appends to the jsonb array and bumps `updated_at`

## Auto-Title Generation

When a conversation is created, `title` is `null`. After the first
assistant response in the streaming endpoint (spec `55`), the endpoint
generates a short title (≤60 chars) from the conversation context and
calls `updateConversationTitle`. The user can rename afterward via PATCH.

## Auth Flow

All routes use `requireClerkSession` → `getDbUserIdByClerk` (or
`ensureDbUserForClerkId` for POST). Same pattern as every other
authenticated route in the project.

## Validation Schemas Location

`createConversationSchema` and `updateConversationSchema` are added to
`lib/api/validation.ts` alongside the existing collection/tag schemas.

## Scope Limits

- No message streaming or tool calling (spec `55`)
- No memory extraction (spec `56`)
- No UI (spec `57`)
- No message editing or individual message deletion (v1 — conversations
  are append-only; delete the whole conversation to clear)
