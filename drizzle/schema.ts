import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'),
  generationsUsed: integer('generations_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ScriptMetadata = {
  prompt: string;
  balance: string;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
};

export const scripts = pgTable('scripts', {
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
});
