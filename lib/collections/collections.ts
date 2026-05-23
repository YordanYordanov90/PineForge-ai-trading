import { z } from 'zod';

/**
 * Strategy Collections data contract (spec 44).
 *
 * Collections are persisted in the existing `collections` table
 * (id, user_id, name, created_at) with a foreign-key relation from
 * `scripts.collection_id`. Both ship with
 * `drizzle/migrations/0000_mute_rattler.sql`, so no new migration is
 * required unless a live-schema audit finds drift.
 *
 * Collection rules:
 * - names are per-user (ownership enforced via `collections.user_id`)
 * - names are trimmed before persistence (see {@link normalizeCollectionName})
 * - duplicate names for the same user are prevented at the **app layer**
 *   (spec 45's CRUD route runs a case-insensitive existence check before
 *   insert/rename) — there is no DB unique index yet
 *
 * Suggested constraints (also enforced by {@link collectionNameInputSchema}):
 * - max {@link MAX_COLLECTION_NAME_LENGTH} characters per name
 *   (matches the `varchar(100)` DB column)
 * - min {@link MIN_COLLECTION_NAME_LENGTH} character per name (post-trim)
 *
 * Downstream specs (CRUD route 45, assignment route 46, UI 47) must reuse
 * {@link normalizeCollectionName} and {@link collectionNameInputSchema} so
 * persistence stays consistent across the boundary.
 */

export const MAX_COLLECTION_NAME_LENGTH = 100;
export const MIN_COLLECTION_NAME_LENGTH = 1;

/**
 * Normalizes a collection name input. Trims surrounding whitespace and
 * returns `null` when the result is empty or exceeds the column length so
 * callers can drop the value cleanly. Casing is preserved (collections are
 * display labels, unlike tags). Pure.
 */
export function normalizeCollectionName(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length < MIN_COLLECTION_NAME_LENGTH) return null;
  if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) return null;
  return trimmed;
}

/**
 * Case-insensitive equality check for collection names. The app layer is the
 * source of truth for duplicate prevention (no DB unique index yet), so
 * spec 45's CRUD route must use this when comparing a new/renamed name to
 * the user's existing collections.
 */
export function isSameCollectionName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * API-boundary schema for collection-name inputs. Enforces shape only
 * (string, length). Callers must still pass the parsed value through
 * {@link normalizeCollectionName} before persistence so trailing/leading
 * whitespace never reaches the database.
 */
export const collectionNameInputSchema = z
  .string()
  .min(MIN_COLLECTION_NAME_LENGTH, 'Collection name is required')
  .max(
    MAX_COLLECTION_NAME_LENGTH,
    `Collection name exceeds ${MAX_COLLECTION_NAME_LENGTH} character limit`,
  );
