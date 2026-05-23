import { z } from 'zod';

/**
 * Strategy Tags data contract (spec 40).
 *
 * Tags are persisted on `scripts.tags` (jsonb `string[]`, default `[]`).
 * The column ships with `drizzle/migrations/0000_mute_rattler.sql`, so no
 * new migration is required unless a live-schema audit finds drift.
 *
 * Tag rules:
 * - stored as a string array
 * - user-scoped through script ownership (`scripts.user_id`)
 * - normalized before persistence (see {@link normalizeTags})
 *
 * Suggested constraints (also enforced by {@link tagsInputSchema}):
 * - max {@link MAX_TAGS_PER_SCRIPT} tags per script
 * - max {@link MAX_TAG_LENGTH} characters per tag
 *
 * Downstream specs (mutation route 41, search route 42, UI 43) must reuse
 * {@link normalizeTags} and {@link tagsInputSchema} so persistence stays
 * consistent across the boundary.
 */

export const MAX_TAGS_PER_SCRIPT = 10;
export const MAX_TAG_LENGTH = 24;

/**
 * Normalizes a single tag input. Trims whitespace and lower-cases the value
 * for storage. Returns `null` when the result is empty so the caller can
 * drop the value cleanly. Pure.
 */
export function normalizeTag(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Normalizes a tag list per the data contract (spec 40):
 * - trim whitespace
 * - lower-case for storage
 * - de-duplicate (case-insensitive, post-normalization)
 * - reject empty values
 * - drop entries longer than {@link MAX_TAG_LENGTH} (post-trim)
 * - clamp the final list to {@link MAX_TAGS_PER_SCRIPT}
 *
 * Pure and deterministic. Safe to run on both client (pre-submit) and
 * server (pre-persist). Spec 41's mutation route must call this before
 * writing to `scripts.tags`.
 */
export function normalizeTags(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const normalized = normalizeTag(raw);
    if (normalized == null) continue;
    if (normalized.length > MAX_TAG_LENGTH) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= MAX_TAGS_PER_SCRIPT) break;
  }
  return out;
}

/**
 * API-boundary schema for tag-list inputs. Enforces per-tag length and
 * array length. Callers must still pass the parsed value through
 * {@link normalizeTags} before persistence — Zod cannot dedupe / lower-case
 * for us, only reject obviously-bad shapes.
 */
export const tagsInputSchema = z
  .array(z.string().max(MAX_TAG_LENGTH, 'Tag exceeds 24 character limit'))
  .max(MAX_TAGS_PER_SCRIPT, 'Too many tags (max 10)');
