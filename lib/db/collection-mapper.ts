import type { collections } from '@/drizzle/schema';
import type { SavedCollection } from '@/lib/types';

type CollectionRow = typeof collections.$inferSelect;

/**
 * Maps a `collections` DB row to the client-facing {@link SavedCollection}.
 * Spec 44 owns the shape; spec 45's CRUD route uses this so all collection
 * responses stay consistent across `GET / POST / PATCH /api/collections`.
 */
export function rowToSavedCollection(row: CollectionRow): SavedCollection {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
