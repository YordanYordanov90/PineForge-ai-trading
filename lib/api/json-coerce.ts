/**
 * Best-effort JSON parsing for LLM webhook payloads (alert templates, etc.).
 * Accepts objects, strict JSON strings, repaired JSON, and JSON-like text.
 */

function stripMarkdownJsonFence(value: string): string {
  const trimmed = value.trim();
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

function repairJsonSyntax(candidate: string): string {
  return candidate
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n\r]*/g, '')
    .replace(/,(\s*[}\]])/g, '$1');
}

function tryParseJson(candidate: string): unknown | null {
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}

function formatParsedJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function looksJsonLike(value: string): boolean {
  const t = value.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

/**
 * Coerce LLM output into a pretty-printed JSON string for display/copy.
 * Returns null only when there is no usable payload.
 */
export function coerceMessageJsonString(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'object') {
    try {
      return formatParsedJson(raw);
    } catch {
      return null;
    }
  }

  if (typeof raw !== 'string') return null;

  const candidates = [
    raw.trim(),
    stripMarkdownJsonFence(raw),
    repairJsonSyntax(raw.trim()),
    repairJsonSyntax(stripMarkdownJsonFence(raw)),
  ];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);

    let parsed = tryParseJson(candidate);
    if (parsed !== null) {
      if (typeof parsed === 'string') {
        const inner = tryParseJson(parsed) ?? tryParseJson(repairJsonSyntax(parsed));
        if (inner !== null) parsed = inner;
        else if (looksJsonLike(parsed)) return parsed.trim();
      }
      if (typeof parsed === 'object') {
        return formatParsedJson(parsed);
      }
    }

    const repaired = repairJsonSyntax(candidate);
    parsed = tryParseJson(repaired);
    if (parsed !== null && typeof parsed === 'object') {
      return formatParsedJson(parsed);
    }

    if (looksJsonLike(candidate) && candidate.length > 2) {
      return candidate;
    }
  }

  return null;
}
