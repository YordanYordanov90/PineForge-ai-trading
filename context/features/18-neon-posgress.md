# 18 — Neon Postgres + Drizzle ORM Setup

Set up the database foundation for Phase 4. This spec creates the schema,
migrations, and DB client. No application logic changes yet — data layer only.
Follows Step 1 (Clerk auth pages).

## What to Install

- `drizzle-orm`
- `drizzle-kit`
- `@neondatabase/serverless`
- `@neondatabase/serverless` ws adapter for local dev

```powershell
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## Implementation

### Step 1 — Environment variables

Add to `.env.local` and `.env.example`:

```env
DATABASE_URL=postgresql://...  # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=postgresql://...  # Neon direct connection (for migrations)
```

Use the **pooled** connection string for the app (`DATABASE_URL`).
Use the **unpooled** connection string for `drizzle-kit migrate` only.

### Step 2 — Create drizzle/schema.ts

```ts
import {
  pgTable, serial, varchar, text,
  integer, boolean, timestamp, jsonb
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'),
  // 'free' | 'pro'
  generationsUsed: integer('generations_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const scripts = pgTable('scripts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),
  version: integer('version').default(1),
  parentId: integer('parent_id'),
  // null = root generation, integer = refinement of parentId
  isStarred: boolean('is_starred').default(false),
  tags: jsonb('tags').$type<string[]>().default([]),
  collectionId: integer('collection_id')
    .references(() => collections.id),
  // metadata stored alongside script
  model: varchar('model', { length: 100 }),
  accountBalance: integer('account_balance'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

Notes:
- `isStarred`, `tags`, `collectionId` baked in now — no migration needed
  when Phase 5 starred/tags/collections features land
- `model` + `accountBalance` preserved as metadata (mirrors localStorage shape)
- `parentId` preserves refinement lineage from existing versioning system

### Step 3 — Create lib/db.ts

Use Neon serverless driver with connection pooling:

```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/drizzle/schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- Use `neon-http` driver (works on Vercel Edge + Node runtimes)
- Export `db` as the single database client used across all routes
- `DATABASE_URL` must be the pooled connection string

### Step 4 — Create drizzle.config.ts

```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
    // use unpooled for migrations only
  },
} satisfies Config
```

### Step 5 — Add npm scripts to package.json

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- `db:generate` — generate migration files from schema changes
- `db:migrate` — apply migrations to the database
- `db:studio` — open Drizzle Studio for visual DB inspection (dev only)

### Step 6 — Generate and apply initial migration

```powershell
npm run db:generate
npm run db:migrate
```

Verify in Neon dashboard or Drizzle Studio that `users`, `collections`,
and `scripts` tables are created correctly.

### Step 7 — Add drizzle/migrations to git

Migration files must be committed to version control:
```
drizzle/
  migrations/
    0000_initial.sql   ← commit this
  schema.ts
```

Add `drizzle/migrations/` to git — do NOT add it to `.gitignore`.

## Scope Limits

- No application logic changes in this step — data layer only
- Do not modify any existing routes or components
- Do not wire Clerk userId to database yet (that is Step 3)
- `drizzle-kit push` is for local prototyping only — never use in production
- Do not add any Row Level Security or Postgres policies yet

## Check When Done

- `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless` installed
- `drizzle/schema.ts` created with `users`, `collections`, `scripts` tables
- `lib/db.ts` exports `db` using neon-http driver
- `drizzle.config.ts` uses `DATABASE_URL_UNPOOLED` for migrations
- `npm run db:generate` produces migration file in `drizzle/migrations/`
- `npm run db:migrate` applies migration successfully
- Tables visible in Neon dashboard
- Migration files committed to git
- `npm run build` passes with no type errors