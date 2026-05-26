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
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import type {
  AgentMessage,
  AgentUserProfile,
} from '@/lib/types/agent';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';

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
  /**
   * Spec 60: Assumptions block extracted during generation.
   * Stored in the existing jsonb column (no migration required).
   */
  assumptions?: StrategyAssumptions | null;
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

/**
 * Forge Agent conversations (spec 52).
 *
 * Each row represents one chat thread for a user. Messages are stored as
 * a JSON array on a single jsonb column (not one row per message) so a
 * conversation is always loaded in a single read. Append-only in normal
 * operation; never partially updated. Hard-capped at 200 messages per
 * conversation by the streaming endpoint (spec 55) and 50 conversations
 * per user via FIFO eviction (spec 54).
 */
export const agentConversations = pgTable(
  'agent_conversations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    /**
     * Auto-generated from the first user message (~60 chars). Null while
     * the conversation is brand-new and no first turn has been summarized.
     */
    title: varchar('title', { length: 200 }),
    /**
     * JSON array of {@link AgentMessage} objects. `notNull()` + `default([])`
     * mean reads never have to coalesce null. Cast helps the row mapper
     * stay typed without `any`.
     */
    messages: jsonb('messages')
      .$type<AgentMessage[]>()
      .notNull()
      .default([]),
    /**
     * Optional FK to the script that seeded this conversation
     * (`/forge?scriptId=<id>`). Nullable because most threads start
     * without a specific script. Spec 53's tools may use this to load
     * initial context.
     */
    scriptId: integer('script_id').references(() => scripts.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    // Conversation list sort: `WHERE user_id = ? ORDER BY updated_at DESC`.
    // Composite index also serves user-only filters (ownership pre-checks
    // for spec 54's CRUD routes) via prefix matching.
    index('agent_conversations_user_id_updated_at_idx').on(
      table.userId,
      table.updatedAt.desc(),
    ),
  ],
);

/**
 * Forge Agent long-term memory (spec 52).
 *
 * One row per user — `user_id` carries a unique constraint so the
 * upsert path in spec 56 (memory extraction) can rely on a single row.
 * `profile` holds the structured {@link AgentUserProfile} extracted from
 * conversations over time and is injected into the system prompt on
 * every conversation start (spec 55).
 */
export const agentMemory = pgTable(
  'agent_memory',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    profile: jsonb('profile')
      .$type<AgentUserProfile>()
      .notNull()
      .default({}),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    // One profile per user — enforced at the DB layer so spec 56's upsert
    // (`INSERT ... ON CONFLICT (user_id) DO UPDATE`) can target this index.
    uniqueIndex('agent_memory_user_id_unique_idx').on(table.userId),
  ],
);
