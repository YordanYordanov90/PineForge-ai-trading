/**
 * Strategy DNA Fingerprint (spec 62)
 *
 * Deterministic 32×32 SVG badge generated purely from SavedScript metadata.
 * Same inputs → identical SVG. No network, no AI, no side effects.
 */

export type FingerprintInputs = {
  indicators: string[];
  timeframe: string;
  direction: 'Long' | 'Short' | 'Both' | 'Any';
  market: string;
  scriptLength: number;
  version: number;
};

/** djb2-style hash (no crypto). Returns stable positive integer. */
export function hashToInt(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i); // hash * 33 + c
  }
  return Math.abs(hash) >>> 0;
}

function getMarketBg(market: string): string {
  const m = market.toLowerCase();
  if (m.includes('crypto')) return '#0f172a'; // deeper blue-grey
  if (m.includes('forex')) return '#1e2937'; // slate
  if (m.includes('stock') || m.includes('equit')) return '#27272a'; // zinc
  if (m.includes('future')) return '#27272a';
  return '#18181b'; // neutral zinc-900
}

function normalizeDirection(d: string): 'Long' | 'Short' | 'Both' | 'Any' {
  const v = (d || '').trim();
  if (/^long$/i.test(v)) return 'Long';
  if (/^short$/i.test(v)) return 'Short';
  if (/^both$/i.test(v)) return 'Both';
  return 'Any';
}

function buildCanonicalSeed(inputs: FingerprintInputs): string {
  const ind = [...(inputs.indicators ?? [])]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');
  const tf = (inputs.timeframe || 'any').trim().toLowerCase();
  const dir = normalizeDirection(inputs.direction);
  const mkt = (inputs.market || 'any').trim().toLowerCase();
  // Coarse bucket on length so small script diffs don't explode visual noise
  const lenBucket = String(Math.floor((inputs.scriptLength || 0) / 80));
  const ver = String(inputs.version || 1);
  return [ind, tf, dir, mkt, lenBucket, ver].join('::');
}

function isCellFilled(row: number, col: number, seed: string): boolean {
  const k = `${seed}::cell::${row}::${col}`;
  const h = hashToInt(k);
  // ~55% fill rate for visual density without overcrowding 4x4
  return h % 100 < 55;
}

function getAccentLinePath(direction: 'Long' | 'Short' | 'Both' | 'Any'): string {
  // Inset coords inside the 32x32 so line sits over grid area
  if (direction === 'Long') {
    // upward diagonal /
    return 'M 5 23 L 27 9';
  }
  if (direction === 'Short') {
    // downward diagonal \
    return 'M 5 9 L 27 23';
  }
  // Both or Any → clean horizontal
  return 'M 5 16 L 27 16';
}

/**
 * Returns a complete inline SVG string (safe for dangerouslySetInnerHTML).
 * Fixed 32×32 output. Deterministic for identical inputs.
 */
export function buildFingerprintSvg(inputs: FingerprintInputs): string {
  const bg = getMarketBg(inputs.market);
  const neon = '#c8ff00';
  const zinc = '#3f3f46';
  const seed = buildCanonicalSeed(inputs);
  const dir = normalizeDirection(inputs.direction);

  const CELL = 5.2;
  const GAP = 1.1;
  const START = 3.6; // centers the 4x4 + gaps nicely in 32px

  let cells = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = START + c * (CELL + GAP);
      const y = START + r * (CELL + GAP);
      const fill = isCellFilled(r, c, seed) ? neon : zinc;
      cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${CELL.toFixed(1)}" height="${CELL.toFixed(1)}" fill="${fill}" rx="0.6"/>`;
    }
  }

  const linePath = getAccentLinePath(dir);
  const line = `<path d="${linePath}" stroke="${neon}" stroke-width="1.25" stroke-linecap="round" fill="none" opacity="0.95"/>`;

  // Version dots: 1 for v1, 2 for v2–v3, 3 for v4+
  const dotCount = inputs.version <= 1 ? 1 : inputs.version <= 3 ? 2 : 3;
  let dots = '';
  const dotY = 5.0;
  const dotR = 1.35;
  const baseX = 27.2;
  for (let i = 0; i < dotCount; i++) {
    const dx = baseX - i * 3.1;
    dots += `<circle cx="${dx.toFixed(1)}" cy="${dotY}" r="${dotR}" fill="${neon}"/>`;
  }

  // Subtle inner frame for definition on dark market bgs
  const frame = `<rect x="2" y="2" width="28" height="28" fill="none" stroke="#27272a" stroke-width="0.75" rx="2"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" role="img" aria-hidden="true">` +
    `<rect width="32" height="32" fill="${bg}" rx="3"/>` +
    frame +
    cells +
    line +
    dots +
    `</svg>`
  );
}
