/**
 * Parses a dynamic route segment as a positive integer id.
 * Returns null for non-numeric, non-finite, or sub-1 values.
 */
export function parsePositiveInt(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}
