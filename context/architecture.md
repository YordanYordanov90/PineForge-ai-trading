# Architecture Context

## Stack

| Layer          | Technology                          | Role                                      |
| -------------- | ----------------------------------- | ----------------------------------------- |
| Framework      | Next.js 16 (App Router)             | Routing, SSR, API routes, layout          |
| Language       | TypeScript 5 (strict mode)          | Type safety throughout                    |
| Styling        | Tailwind CSS v4 + shadcn/ui         | UI components and design tokens           |
| AI             | Vercel AI SDK + @ai-sdk/xai (Grok)  | Streaming Pine Script generation          |
| AI Agent       | Vercel AI SDK `streamText` + tools   | Forge Agent: tool calling + orchestration |
| Validation     | Zod                                 | All API input validation                  |
| Syntax HL      | shiki                               | Post-stream code highlighting only        |
| Notifications  | sonner                              | Toast feedback                            |
| History        | localStorage (Phase 1–3)            | Client-side script persistence            |
| Auth           | Clerk (Phase 4)                     | User identity and session management      |
| Database       | Neon Postgres + Drizzle ORM (Ph 4)  | Persistent script history, user data      |
| Rate limiting  | Upstash Redis (Phase 4)             | Per-user and per-IP quota enforcement     |
| Deployment     | Vercel                              | Hosting, edge functions, env management   |

## System Boundaries

- `app/api/` — All server-side logic. Validates with Zod, calls Grok, returns
  streaming or JSON responses. Never exposes raw errors or API keys.
- `app/(landing)/` — Marketing page. Static, no auth required.
- `app/generate/` — Core generator UI. Client-heavy (streaming, localStorage,
  interactive state). No auth required Phase 1–3.
- `components/strategy/` — All generator UI components. Own the form, output,
  history, and refine chat.
- `components/landing/` — All marketing page components.
- `app/forge/` — Forge Agent page. Auth-required. Dedicated chat interface for the
  strategy workflow agent.
- `components/forge/` — Forge Agent UI components. Chat messages, tool call display,
  conversation sidebar.
- `lib/agent/` — Agent internals: system prompt, tool definitions, memory helpers.
- `lib/` — Shared utilities: types, validation schemas, constants, prompt templates.
- `hooks/` — Custom React hooks. `useScriptHistory` owns all localStorage access.

## Storage Model

- **localStorage**: Script history (Phase 1–3). `SavedScript[]` keyed to a fixed
  localStorage key. Max 50 entries FIFO. All access wrapped in try/catch.
- **Neon Postgres + Drizzle ORM** (Phase 4): Persistent per-user data. Replaces
  localStorage. Schema in `drizzle/schema.ts`; migrations in `drizzle/migrations/` via
  `drizzle-kit generate` + `drizzle-kit migrate` (use `DATABASE_URL_UNPOOLED` for migrate only).

**Proposed Drizzle Schema (Phase 4)**

```ts
// drizzle/schema.ts
import { pgTable, serial, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'), // 'free' | 'pro'
  generationsUsed: integer('generations_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scripts = pgTable('scripts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),
  version: integer('version').default(1),
  parentId: integer('parent_id'),
  isStarred: boolean('is_starred').default(false),
  tags: jsonb('tags').$type<string[]>().default([]),
  collectionId: integer('collection_id').references(() => collections.id),
  model: varchar('model', { length: 100 }),
  accountBalance: integer('account_balance'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## Data Contracts

### API response envelope (all `/api/*` JSON routes)

Every Route Handler that returns JSON uses one shape:

```json
{ "success": true, "data": <payload>, "error": null }
{ "success": false, "data": null, "error": "<user-safe message>" }
```

- **HTTP status** remains the primary signal (`401`, `403`, `404`, `409`, `429`, `502`, etc.).
- **Helpers**: `apiSuccess`, `apiError`, `apiInvalidRequest` in `lib/api/envelope.ts`.
- **Client parsing**: `parseApiSuccessEnvelope` in `lib/api/parse-envelope.ts`; errors via `messageFromApiErrorJson` in `lib/api/message-from-api-error.ts`.
- **Streaming success** (`POST /api/generate`, `/api/refine-script`, `/api/explain-script`): body is a plain text stream on `2xx`; failures still return the JSON envelope above.
- **`data` payloads** (resource keys preserved for agent/tool clarity):
  - Lists: `{ scripts: SavedScript[] }`, `{ collections: SavedCollection[] }`
  - Single resource: `{ script: SavedScript }`, `{ collection: SavedCollection }`
  - Mutations ack: `{ deleted: true }`, `{ synced: true }`
  - AI structured: domain object directly (e.g. `HealthScoreResult`, alert templates bundle)
  - Improve prompt: `{ improvedPrompt: string }`

### Route protection layers

Two complementary guards. Pick by the route's cost profile, not by HTTP method.

| Helper | Used by | Limiter | IP check | Purpose |
|---|---|---|---|---|
| `protectAiRoute(req)` | `/api/generate`, `/api/refine-script`, `/api/explain-script`, `/api/improve-prompt`, `/api/health-score`, `/api/alert-templates`, `/api/backtesting-summary` | `freeUserRatelimit` (3 / 24 h) or `proUserRatelimit` (200 / 24 h) by plan | yes (`ipRatelimit`, 10 / 60 s) | Caps paid model spend; also returns the resolved `plan` for entitlement checks |
| `protectDataRoute()` | `/api/scripts*`, `/api/collections*`, `/api/scripts/search`, `/api/users/sync` | `dataUserRatelimit` (120 / 60 s, plan-agnostic) | no (auth required anyway) | Defense-in-depth on CRUD; protects against scripted abuse of authenticated endpoints |

Both helpers emit the same envelope on failure (`401` Unauthorized, `429` Too many requests). Ownership helpers (`resolveOwnedScriptRoute`, `resolveOwnedCollectionRoute`) take a pre-validated Clerk user id and run after `protectDataRoute()`, so there is exactly one `auth()` call per request.

### Pinned / Starred Scripts (spec `36`)

- **Source of truth**: `scripts.is_starred` (boolean, default `false`) on the
  existing `scripts` table. No migration is required — the column has shipped
  with `0000_mute_rattler.sql` since the Phase 4 schema was generated.
- **Client model**: `SavedScript.isStarred: boolean` (always present, defaults
  to `false`). Exposed by `rowToSavedScript()` in `lib/db/script-mapper.ts`,
  validated on the wire by `savedScriptSchema` in `hooks/useScriptHistory.ts`
  (legacy localStorage entries without the field are parsed as `isStarred: false`).
- **Per-user**: ownership is already enforced by `scripts.user_id`; star state
  inherits per-user scope for free.
- **Per-row** (not per-lineage): every refinement is its own row with its own
  star state. The future UI (spec `39`) decides whether to surface starred
  rows as a group or filter, but the persistence shape is row-level.
- **Mutation**: this contract is **read-only here**. Toggling lives in the
  dedicated `PATCH /api/scripts/[scriptId]/star` route (spec `37`), which must
  bump `updated_at` and return the full `SavedScript` payload.
- **Eviction rule**: signed-in history is sourced from Neon (not the
  50-entry localStorage FIFO), so starred scripts are not at risk of being
  evicted by client-side history limits.
- **History query (spec `38`)**: `GET /api/scripts` uses
  `listScriptsForUser()` — up to 50 rows by `created_at` desc, unioned with
  any older `is_starred = true` rows, deduped and re-sorted by recency (order
  unchanged for the main list). Each item includes `isStarred` via
  `rowToSavedScript()`. Signed-in client cache uses `capScriptHistory()` so
  optimistic adds keep all starred entries while trimming only unstarred
  beyond 50. `partitionScriptsByStarred()` in `lib/scripts/history-list.ts`
  is available for spec `39` UI grouping.

### Strategy Tags (spec `40`)

- **Source of truth**: `scripts.tags` (`jsonb` `string[]`, default `[]`) on
  the existing `scripts` table. The column ships with
  `drizzle/migrations/0000_mute_rattler.sql`; no migration is required
  unless a live-schema audit finds drift.
- **Client model**: `SavedScript.tags: string[]` (always present, defaults
  to `[]`). Exposed by `rowToSavedScript()` in `lib/db/script-mapper.ts`,
  validated on the wire by `savedScriptSchema` in `hooks/useScriptHistory.ts`
  (legacy localStorage entries without the field are parsed as `tags: []`).
- **Per-user**: ownership is already enforced by `scripts.user_id`; tag
  state inherits per-user scope for free.
- **Normalization rules** (`lib/scripts/tags.ts`, single source of truth):
  trim whitespace, lower-case for storage, de-duplicate, drop empty
  values, clamp to `MAX_TAG_LENGTH = 24` per tag, clamp the final list to
  `MAX_TAGS_PER_SCRIPT = 10`. Pure and deterministic — safe to run on both
  client (pre-submit) and server (pre-persist). Exposed as `normalizeTag`,
  `normalizeTags`, and an API-boundary `tagsInputSchema` (Zod) that
  enforces per-tag length and array length but does not dedupe.
- **Mutation (spec `41`)**: `PATCH /api/scripts/[scriptId]/tags` at
  `app/api/scripts/[scriptId]/tags/route.ts`: `requireClerkSession` →
  `parseScriptId` → `getDbUserIdByClerk` → Zod-validate body with
  `setScriptTagsSchema` (`{ tags: tagsInputSchema }`) → ownership check on
  `scripts.user_id` → `normalizeTags(parsed.data.tags)` (server-side, never
  trust raw input) → update `scripts.tags` + bump `updated_at` → return
  `{ script: rowToSavedScript(updated) }` so the client gets the final
  normalized list. Invalid id → 400; missing user → 404; non-owner → 403;
  sanitized JSON errors only. Empty arrays are valid and clear tags.
- **Search (spec `42`)**: `GET /api/scripts/search` at
  `app/api/scripts/search/route.ts` is the dedicated read endpoint —
  `GET /api/scripts` keeps its plain recency+starred-union behavior so
  spec 43's UI can pick the right call by mode.
  - Query params (all optional): `q` (free text, ≤ 200 chars, trimmed),
    `tag` (repeated **or** comma-separated; route splits each value on
    `,` then runs the combined list through `normalizeTags()`),
    `starred` (`'true' | 'false'`), `collectionId` (positive int).
    Validated by `searchScriptsQuerySchema` in `lib/api/validation.ts`.
  - DB helper: `searchScriptsForUser(userId, filters)` in
    `lib/db/search-user-scripts.ts`. Always ANDs
    `eq(scripts.userId, userId)` first so cross-user leaks are
    structurally impossible. Text match uses Drizzle's `ilike()` on
    `scripts.title` `OR` parameterized `metadata->>'prompt' ILIKE`; tag
    match uses jsonb `@>` containment (must contain all requested tags);
    `starred` and `collectionId` are simple `eq()`. `q` is escaped
    against LIKE wildcards (`%`, `_`, `\`) before binding so user-typed
    wildcards do not expand the match. Results sort by `created_at`
    desc, capped at `MAX_HISTORY_ENTRIES`.
  - Response shape: `{ scripts: SavedScript[] }` (matches
    `GET /api/scripts`). Missing user → `{ scripts: [] }`; invalid query
    → 400 with Zod issues; signed-out → 401 (via session helper).
- **Out of scope here**: chip-editor UI (spec `43`), collections (specs
  `44`–`47`).

### Strategy Collections (spec `44`)

- **Source of truth**: the existing `collections` table (`id`,
  `user_id → users.id`, `name varchar(100)`, `created_at`) plus the
  `scripts.collection_id` foreign key (`integer references collections(id)`,
  nullable). Both ship with `drizzle/migrations/0000_mute_rattler.sql`; no
  migration is required unless a live-schema audit finds drift.
- **Client model**:
  - `SavedCollection { id: number; name: string; createdAt: string }` —
    consumed by spec `45`'s CRUD response and spec `47`'s picker.
  - `SavedScript.collectionId: number | null` (always present, defaults to
    `null` for legacy entries). Exposed by `rowToSavedScript()` in
    `lib/db/script-mapper.ts`, validated on the wire by `savedScriptSchema`
    in `hooks/useScriptHistory.ts` (legacy localStorage entries without the
    field are parsed as `collectionId: null`).
- **Row mapper**: `rowToSavedCollection()` in `lib/db/collection-mapper.ts`
  (re-exported from `lib/db/index.ts`) so every collection response stays
  shape-consistent across `GET / POST / PATCH /api/collections` (spec 45).
- **Per-user**: ownership is enforced by `collections.user_id`. Names are
  scoped per-user (the same name may exist in two different users'
  workspaces, but never twice within one user). Cross-user assignment is
  blocked structurally by spec 46's ownership check on **both** the script
  and the target collection.
- **Naming rules** (`lib/collections/collections.ts`, single source of
  truth):
  - trim surrounding whitespace before persistence
  - `MIN_COLLECTION_NAME_LENGTH = 1` (post-trim) — empty names are rejected
  - `MAX_COLLECTION_NAME_LENGTH = 100` — matches the `varchar(100)` DB column
  - casing is preserved (collections are display labels, unlike tags)
  - duplicate names per user are prevented at the **app layer** —
    `isSameCollectionName()` runs a case-insensitive comparison that spec
    45's CRUD route uses against the user's existing collections before
    insert/rename. A future migration can add a DB unique index
    `(user_id, lower(name))` if needed; the app-layer check is the
    canonical guard until then.
- **API boundary**: `collectionNameInputSchema` (Zod) enforces shape +
  length only — routes must still pass parsed input through
  `normalizeCollectionName()` so trailing/leading whitespace never reaches
  the database.
- **Mutation surface**:
  - spec 45 (shipped) — `GET / POST /api/collections`,
    `PATCH / DELETE /api/collections/[collectionId]` (see
    "Collections CRUD route" entry below for the route contract)
  - spec 46 (shipped) — `PATCH /api/scripts/[scriptId]/collection` with
    body `{ collectionId: number | null }` (see "Script collection
    assignment route" entry below)
- **Search**: spec 42's `searchScriptsQuerySchema` already accepts
  `collectionId` and `searchScriptsForUser()` filters with
  `eq(scripts.collectionId, …)` ANDed under
  `eq(scripts.userId, userId)`. Assignments from spec 46 populate the
  column so collection filters return matches.
- **Out of scope here**: collection picker / management UI (spec `47`).

### Collections CRUD route (spec `45`)

- **Endpoints**:
  - `GET /api/collections` → `{ collections: SavedCollection[] }`
    (recency desc; signed-in but no DB user → `{ collections: [] }`,
    matching the `/api/scripts` "soft empty" pattern).
  - `POST /api/collections` → body `{ name: string }` →
    `{ collection: SavedCollection }`. Uses `ensureDbUserForClerkId`
    so first-call after sign-in auto-provisions the DB user row.
  - `PATCH /api/collections/[collectionId]` → body `{ name: string }`
    → `{ collection: SavedCollection }`.
  - `DELETE /api/collections/[collectionId]` → `{ ok: true }`.
- **Validation** (`lib/api/validation.ts`):
  `createCollectionSchema` and `renameCollectionSchema` both wrap
  `collectionNameInputSchema` from spec 44 (shape only — min/max
  length). Routes re-run `normalizeCollectionName()` after Zod so
  trailing/leading whitespace never reaches the DB and the duplicate
  check works on the canonical value.
- **Ownership** is enforced by every route: a `select` with
  `eq(collections.userId, userId)` runs before any PATCH/DELETE, and
  every UPDATE/DELETE statement re-includes the same `userId` clause
  so cross-user writes are structurally impossible.
- **Duplicate-name guard** (`findUserCollectionByNameInsensitive()` in
  `lib/db/list-user-collections.ts`): runs
  `lower(collections.name) = lower(?)` scoped to `userId`, with an
  optional `excludeId` for PATCH so renaming a collection to its own
  current casing variant doesn't conflict with itself. Returns 409
  with the sanitized message `"A collection with this name already
  exists."`. No DB unique index yet — a future migration on
  `(user_id, lower(name))` can replace the app check (the app guard
  is canonical until then; the route stays the source of truth).
- **DELETE unassign step**: the existing FK
  `scripts.collection_id → collections.id` is `ON DELETE no action`
  (per `0000_mute_rattler.sql`), so deleting a collection that still
  has referencing scripts would fail with a FK violation. The DELETE
  handler therefore runs:
  1. `UPDATE scripts SET collection_id = NULL, updated_at = NOW()
     WHERE user_id = ? AND collection_id = ?` (idempotent; ANDed with
     `isNotNull(scripts.collectionId)` for an inexpensive short-circuit
     on already-empty collections),
  2. `DELETE FROM collections WHERE id = ? AND user_id = ?`.
  Both writes are scoped to the caller's `userId`. neon-http does not
  expose transactions, so on partial failure (unassign succeeds,
  delete fails) the user can simply retry — the unassign step is
  idempotent (the second pass finds zero matching rows) and no
  cross-user state is touched. A future migration could switch the FK
  to `ON DELETE SET NULL` to fold both writes into one statement; the
  app-layer behaviour stays correct either way.
- **Sanitized errors only**: 401 (session helper), 400 (invalid id
  or Zod issues — issues object only, no raw Zod stringification),
  403 (non-owner), 404 (no DB user — PATCH/DELETE only; POST
  auto-provisions instead), 409 (duplicate name), 500 (write returned
  nothing). No raw DB errors or stack traces leak.
- **Response shape**: every single-collection endpoint returns
  `{ collection: SavedCollection }`; the list endpoint returns
  `{ collections: SavedCollection[] }`. Spec 47's picker can rely on
  this without a discriminator.
- **Collections UI (spec `47`)**: history sheet (`ScriptHistory`) +
  `CollectionControls` + `useCollections()` + extended
  `useScriptHistory.setCollectionEntry()` / `refreshEntries()`.
  Signed-in only: filter chips (All / per-collection / None),
  create/rename/delete collections, per-entry native `<select>`
  picker → `PATCH /api/scripts/[id]/collection`. Client filter in
  `filterHistoryEntries()` mirrors server `collectionId` semantics;
  after collection delete, `refreshEntries()` syncs unassigned scripts
  in the cache. Signed-out users see no collection UI.
- **Out of scope here**: full file-explorer UI, nested folders.

### Strategy Export Source (spec `48`)

- **Purpose**: define the canonical payload that feeds Notion / Obsidian
  export. Spec 48 owns the **contract** only — the markdown serializer
  (spec `49`) and the user-facing actions (spec `50`) consume this shape.
- **Source of truth**: `lib/export/source.ts` exports the
  `StrategyExportSource` type, `StrategyExportSourceModel`,
  `StrategyExportStructuredInputs`, and pure builders
  `buildStrategyExportSource()` + `buildExportSourceFromSavedScript()`.
- **No new AI calls, no DB persistence**: the contract is reconstructable
  from existing generator state (active form) or a persisted
  `SavedScript`. Breakdown markdown is sourced from the same content the
  Breakdown output tab loads lazily — `null` is a valid value when the
  user has not opened the tab yet, and spec 50 decides whether to skip
  the section or prompt the user.
- **Payload shape** (matches the spec's recommended fields one-to-one):
  - `title: string` — falls back to `DEFAULT_EXPORT_TITLE`
    (`"Untitled strategy"`) on empty input.
  - `prompt: string` — original strategy description, trimmed.
  - `script: string` — Pine Script body, preserved verbatim
    (no whitespace normalization here; spec 49 owns fenced-code
    formatting).
  - `model: { id: GrokModelId; label: string } | null` — resolved from
    `GROK_MODELS` so spec 49 does not need to re-resolve constants when
    rendering markdown.
  - `structuredInputs: { market?, timeframe?, direction?, indicators?,
    rr?, balance? }` — values trimmed; empty strings, empty arrays, and
    `undefined` are omitted so spec 49 can `if (source.structuredInputs.
    market)` cleanly. `balance` is included even though it is outside
    the spec's explicit "such as" list because the spec calls that list
    illustrative and balance is part of the same generator state.
  - `breakdown: string | null` — trimmed Breakdown tab content, or
    `null` if not loaded.
  - `createdAt: string | null` — ISO timestamp from history / DB; `null`
    for freshly generated drafts.
  - `updatedAt: string | null` — kept on the contract for forward
    compatibility (current `SavedScript` does not surface
    `scripts.updated_at`; spec 49 can render it once the row mapper
    exposes it without a breaking contract change).
- **Builders**:
  - `buildStrategyExportSource(input)` — generic funnel for the active
    generator path (raw `strategy`, `generatedScript`, `selectedModel`,
    `structuredInputs`, plus optional `breakdown` / timestamps).
  - `buildExportSourceFromSavedScript(saved, { breakdown? })` —
    convenience for the history path; maps a `SavedScript` into the
    same shape. Sets `updatedAt: null` (see above).
  - Both are pure, deterministic, and synchronous — safe to call on
    server or client, no async, no DOM, no network.
- **Out of scope here**: copy/download/share UI (spec `50`), Notion API
  integration, OAuth.

### Strategy Export Markdown Serializer (spec `49`)

- **Purpose**: turn a `StrategyExportSource` into one normalized Markdown
  document for Notion / Obsidian paste workflows. Spec 49 owns formatting
  only — no UI, no file route, no provider-specific variants.
- **Source of truth**: `lib/export/strategy-markdown.ts` exports
  `assembleStrategyExportMarkdown(source, options?)`,
  `StrategyExportMarkdownOptions`, and `exportHasMetadata(source)`.
- **Stable heading order** (required sections first, then optional):
  1. `#` title
  2. `## Strategy Metadata` — bullet list (model, market, timeframe,
     direction, R:R, balance, indicators, created/updated dates); omitted
     when nothing would render
  3. `## Original Prompt` — blockquote preserving line breaks
  4. `## Breakdown` — only when `source.breakdown` is non-null; body passed
     through verbatim (explain-tab content may already contain Markdown)
  5. `## Pine Script` — fenced code block with language tag `pine`; fence
     length auto-expands if the script body contains triple backticks
  6. `## Health Score` — when `options.healthScore` is set (score, verdict,
     summary, strengths/risks/next steps bullets)
  7. `## Alert Templates` — when `options.alertTemplates` is set (per-provider
     `###` label, description, fenced `json` for `messageJson`, notes,
     placeholders)
  8. `## Backtesting Summary` — when `options.backtestSummary` is set (uses
     the pre-assembled `markdown` field from spec 33 plus optional `###`
     title line)
- **Rules**: deterministic — same input always yields the same string;
  dates formatted as UTC `YYYY-MM-DD` via `toISOString().slice(0, 10)`;
  inline whitespace in bullets collapsed to single spaces; document trimmed
  with no leading/trailing junk. Optional sections require no new AI calls —
  spec 50 passes hook results into `StrategyExportMarkdownOptions` when
  already loaded in client state.
- **Out of scope here**: Notion API, OAuth, backend download route.

### Strategy Export Actions UI (spec `50`)

- **Placement**: `/generate` output card header — `FileText` toggle in
  `OutputActionBar` opens `ExportMarkdownPanel` (same pattern as webhook
  JSON). Panel shows when a script exists and output is idle.
- **Actions**: **Copy Markdown** (`navigator.clipboard`) and **Download
  `.md`** (`downloadMarkdownFile()` in `lib/export/download-markdown.ts` —
  Blob + anchor, no API route). Sonner toasts on success/failure.
- **Data path**: `buildExportMarkdownFromContext()` in
  `lib/export/build-export-markdown.ts` calls spec-48
  `buildStrategyExportSource()` then spec-49
  `assembleStrategyExportMarkdown()`. `StrategyOutputCard` collects:
  - form fields (`strategyPrompt`, `generatedScript`, `selectedModel`,
    `structuredInputs`, `accountBalance`)
  - `exportTitle` / `exportCreatedAt` from `StrategyForm` (set on
    generate save + history load; cleared on new generate)
  - `breakdownText` via `ExplainScriptPanel` `onBreakdownChange` (only
    when Breakdown tab content is loaded)
  - optional `healthExportResult`, `alertExportResult`,
    `backtestExportResult` via `onResultChange` on the respective panels
    (only after user runs those analyses — no new AI on export)
- **UX copy**: panel explains Notion / Obsidian readiness; hints to open
  Breakdown tab when `breakdown` is missing; notes when optional sections
  are included.
- **Reset**: export auxiliary state clears on `explainCancelKey` and
  health/backtest/alert reset keys (generate, refine, history load).
- **Out of scope here**: Notion OAuth, direct Notion write, command
  palette entries.

### Script collection assignment route (spec `46`)

- **Endpoint**: `PATCH /api/scripts/[scriptId]/collection` at
  `app/api/scripts/[scriptId]/collection/route.ts`.
- **Request body**: `{ collectionId: number | null }`, validated by
  `setScriptCollectionSchema` in `lib/api/validation.ts` (`z.number()
  .int().positive().nullable()`). `null` clears `scripts.collection_id`;
  a positive integer assigns the script to that collection.
- **Flow** (mirrors spec 37 star / spec 41 tags narrow routes):
  `requireClerkSession` → `parseScriptId` → `getDbUserIdByClerk` →
  Zod-validate body → ownership pre-check on `scripts.user_id` → if
  `collectionId` is non-null, a second pre-check on
  `collections.user_id` (same `userId`) so cross-user assignment is
  structurally impossible — missing or foreign collections return 403
  (no existence leak) → `update().set({ collectionId, updatedAt })`
  with both `scripts.id` and `scripts.user_id` in the WHERE clause →
  `{ script: rowToSavedScript(updated) }` so the client receives the
  persisted `collectionId`.
- **Sanitized errors**: 401 (session helper), 400 (invalid script id
  or Zod issues), 404 (no DB user), 403 (non-owner script or
  non-owned / missing target collection), 500 (update returned
  nothing). No tag, star, or collection CRUD side effects in this
  route.
- **Out of scope here**: collection CRUD (spec `45`), collection
  picker UI (spec `47`).

## Forge Agent Architecture (Phase 6)

### Overview

The Forge Agent is a strategy workflow agent on `/forge` that orchestrates
existing PineForge features through conversational tool calling. It uses the
Vercel AI SDK's `streamText` with a `tools` object — each tool wraps an
existing PineForge API route or DB query.

### Memory Model

Two-layer memory:

1. **Short-term (conversation)**: per-thread message history stored in an
   `agent_conversations` table. Each conversation is a JSON array of messages
   (user, assistant, tool calls, tool results). Loaded on conversation open,
   appended on each exchange, persisted on conversation end or periodically.

2. **Long-term (user profile)**: an `agent_memory` table stores a structured
   JSON profile per user — extracted from conversations over time. Fields:
   preferred markets, preferred timeframes, preferred indicators, risk
   tolerance notes, strategy patterns, average Health Score, and free-text
   insights. Injected into the agent's system prompt on every conversation
   start so the agent "remembers" the user across sessions.

### Tool Calling Pattern

Each tool is defined with:
- a Zod input schema (validated before execution)
- a `description` that tells the LLM when to use it
- an `execute` function that calls an internal API route or DB helper
- error handling that returns a user-friendly message, never raw errors

Tools call the same backend endpoints the UI uses. No separate "agent API" —
the agent is a consumer of the existing API surface, scoped to the
authenticated user's data.

### Guardrails

The agent's system prompt defines hard boundaries:
- No buy/sell recommendations or price predictions
- No live market data (the agent knows about strategies, not markets)
- No financial advice language
- Refusal pattern: decline clearly, redirect to something the agent can do
- Tool results are validated before being presented to the user
- User messages are not passed raw to tool inputs — the agent extracts
  structured parameters via its tool schemas

### Data Tables (new — requires migration)

```
agent_conversations
  id            serial PK
  user_id       integer FK → users.id NOT NULL
  title         varchar(200)
  messages      jsonb NOT NULL DEFAULT '[]'
  created_at    timestamp DEFAULT now()
  updated_at    timestamp DEFAULT now()

agent_memory
  id            serial PK
  user_id       integer FK → users.id NOT NULL UNIQUE
  profile       jsonb NOT NULL DEFAULT '{}'
  updated_at    timestamp DEFAULT now()
```

### Entry Points

- Direct: user navigates to `/forge` from navbar
- Contextual: "Discuss with Forge" button on `/generate` navigates to
  `/forge?scriptId=<id>` — the agent loads the script from DB and has
  full context for the conversation

### Spec Index

| Spec | Scope |
|------|-------|
| `51` | Product overview — identity, scope, examples |
| `52` | Memory schema — Drizzle tables + migration |
| `53` | Tool definitions — inputs, endpoints, errors |
| `54` | Conversation CRUD — save/load/list/delete REST routes |
| `55` | Agent streaming endpoint — `POST /api/forge` |
| `56` | Memory extraction — background preference extraction |
| `57` | `/forge` page UI — chat interface + conversation sidebar |
| `58` | Guardrails — refusal patterns, prompt injection defense |