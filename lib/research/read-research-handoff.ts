import type { ResearchSummaryPayload } from '@/lib/api/validation';

const STORAGE_KEY = 'pineforge_research_handoff';

/**
 * Reads (and immediately clears) a research handoff payload written by the
 * "Generate from Research" flow (spec 61).
 *
 * The payload is stored in sessionStorage so that a navigation to /generate
 * can pre-fill the generator without leaking the data into URL query params
 * (which have length and visibility concerns).
 *
 * - Returns `null` when nothing is present or after the first successful read.
 * - Safe for SSR / RSC (returns null when not in browser).
 * - Defensive parsing; malformed data is discarded and the key cleared.
 */
export function readResearchHandoff(): ResearchSummaryPayload | null {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // Clear immediately per spec (one-time handoff)
    sessionStorage.removeItem(STORAGE_KEY);

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'description' in parsed &&
      typeof (parsed as { description: unknown }).description === 'string'
    ) {
      return parsed as ResearchSummaryPayload;
    }

    return null;
  } catch {
    // Best-effort cleanup on parse error
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export { STORAGE_KEY as RESEARCH_HANDOFF_STORAGE_KEY };