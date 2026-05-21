# Architecture Context

## Stack

| Layer          | Technology                          | Role                                      |
| -------------- | ----------------------------------- | ----------------------------------------- |
| Framework      | Next.js 16 (App Router)             | Routing, SSR, API routes, layout          |
| Language       | TypeScript 5 (strict mode)          | Type safety throughout                    |
| Styling        | Tailwind CSS v4 + shadcn/ui         | UI components and design tokens           |
| AI             | Vercel AI SDK + @ai-sdk/xai (Grok)  | Streaming Pine Script generation          |
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