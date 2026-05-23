import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'),
  generationsUsed: integer('generations_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const collections = pgTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    // `listCollectionsForUser` filters by user and orders by recency.
    index('collections_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc(),
    ),
  ],
);

export type ScriptMetadata = {
  prompt: string;
  balance: string;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
};

export const scripts = pgTable(
  'scripts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    title: varchar('title', { length: 200 }),
    content: text('content').notNull(),
    version: integer('version').default(1),
    parentId: integer('parent_id'),
    isStarred: boolean('is_starred').default(false),
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<ScriptMetadata>(),
    collectionId: integer('collection_id').references(() => collections.id),
    model: varchar('model', { length: 100 }),
    accountBalance: integer('account_balance'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    // Primary list path: `listScriptsForUser` filters by user and orders
    // by `created_at desc`. Composite index also serves user-only filters
    // (`searchScriptsForUser`, ownership pre-checks) via prefix matching.
    index('scripts_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc(),
    ),
    // Starred union in `listScriptsForUser` + `starred` search filter.
    index('scripts_user_id_is_starred_idx').on(table.userId, table.isStarred),
    // Collection filter in `searchScriptsForUser` + post-delete unassign
    // (`UPDATE scripts SET collection_id = NULL WHERE user_id = ? AND
    // collection_id = ?`).
    index('scripts_user_id_collection_id_idx').on(
      table.userId,
      table.collectionId,
    ),
  ],
);
