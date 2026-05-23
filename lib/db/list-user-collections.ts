import { and, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import { collections } from '@/drizzle/schema';
import { db } from './client';

type CollectionRow = typeof collections.$inferSelect;

/**
 * Lists a user's collections ordered by recency. Bounded by the natural
 * size of a user's collection set — there is no hard cap because
 * collections are coarse-grained (folders), not per-item records. Spec
 * 45's `GET /api/collections` consumes this directly.
 */
export async function listCollectionsForUser(
  userId: number,
): Promise<CollectionRow[]> {
  return db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.createdAt));
}

/**
 * App-layer duplicate-name guard (spec 44 contract — no DB unique index
 * yet on `(user_id, lower(name))`). Returns the existing row when the
 * user already has a collection with the same case-insensitive name, or
 * `null` otherwise. Spec 45's `POST` and `PATCH` routes call this
 * before insert/update to return a sanitized 409.
 *
 * Pass `excludeId` from `PATCH` so renaming a collection to its own
 * current name (or a casing variant of it) doesn't conflict with itself.
 */
export async function findUserCollectionByNameInsensitive(
  userId: number,
  name: string,
  excludeId?: number,
): Promise<CollectionRow | null> {
  const conditions: SQL[] = [
    eq(collections.userId, userId),
    sql`lower(${collections.name}) = lower(${name})`,
  ];

  if (excludeId != null) {
    conditions.push(ne(collections.id, excludeId));
  }

  const [row] = await db
    .select()
    .from(collections)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}
