/**
 * Strategy Assumptions Block parser (spec 60).
 *
 * Extracts the trailing === ASSUMPTIONS === ... === END ASSUMPTIONS === block
 * produced by the generation prompt. The block is stripped so it never appears
 * in the Pine Script copy/download artifact.
 */

export type StrategyAssumptions = {
  items: string[]; // bullet points, trimmed, without the leading "- " / "• "
  raw: string; // the raw trimmed text content between the delimiters
};

/**
 * Parses a raw LLM generation output that may contain a trailing assumptions block.
 * Returns the clean Pine Script (block removed) and the structured assumptions (or null).
 */
export function parseAssumptionsBlock(
  rawOutput: string,
): { assumptions: StrategyAssumptions | null; cleanScript: string } {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return { assumptions: null, cleanScript: '' };
  }

  const text = rawOutput;

  // Flexible delimiter detection (allow surrounding whitespace / case variants on the marker words)
  const startMarker = /===+\s*ASSUMPTIONS\s*===+/i;
  const endMarker = /===+\s*END\s+ASSUMPTIONS\s*===+/i;

  const startMatch = startMarker.exec(text);
  const endMatch = endMarker.exec(text);

  if (!startMatch || !endMatch || endMatch.index <= startMatch.index) {
    // No valid block — return everything as the script
    return { assumptions: null, cleanScript: text.trim() };
  }

  const blockStart = startMatch.index + startMatch[0].length;
  const blockEnd = endMatch.index;

  const rawBlock = text.slice(blockStart, blockEnd).trim();

  // Remove the entire block (including markers) from the script output
  const before = text.slice(0, startMatch.index).trimEnd();
  const after = text.slice(endMatch.index + endMatch[0].length).trimStart();
  const cleanScript = [before, after].filter(Boolean).join('\n\n').trim();

  if (!rawBlock) {
    return { assumptions: null, cleanScript };
  }

  // Parse bullet points: lines starting with -, •, *, or – (en-dash) after trimming
  const lines = rawBlock.split(/\r?\n/);
  const items: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match common bullet prefixes
    const bulletMatch = /^[-•*–—]\s*(.+)$/.exec(trimmed);
    if (bulletMatch && bulletMatch[1]) {
      const item = bulletMatch[1].trim();
      if (item) items.push(item);
      continue;
    }

    // Also accept lines that start with " - " anywhere after optional numbering
    const looseBullet = /^\s*[-•*–—]\s*(.+)$/.exec(trimmed);
    if (looseBullet && looseBullet[1]) {
      const item = looseBullet[1].trim();
      if (item) items.push(item);
    }
  }

  if (items.length === 0) {
    // Block existed but contained no parseable bullets — still surface raw for debugging/empty state
    return {
      assumptions: { items: [], raw: rawBlock },
      cleanScript,
    };
  }

  return {
    assumptions: { items, raw: rawBlock },
    cleanScript,
  };
}
