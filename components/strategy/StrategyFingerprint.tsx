import type { SavedScript } from '@/lib/types';
import { buildFingerprintSvg, type FingerprintInputs } from '@/lib/scripts/fingerprint';

type StrategyFingerprintProps = {
  entry: SavedScript;
  className?: string;
};

function deriveInputs(entry: SavedScript): FingerprintInputs {
  const rawDir = entry.direction as 'Long' | 'Short' | 'Both' | 'Any' | undefined;
  const direction: FingerprintInputs['direction'] =
    rawDir === 'Long' || rawDir === 'Short' || rawDir === 'Both' ? rawDir : 'Any';

  return {
    indicators: entry.indicators ?? [],
    timeframe: entry.timeframe ?? 'Any',
    direction,
    market: entry.market ?? 'Any',
    scriptLength: entry.script?.length ?? 0,
    version: entry.version ?? 1,
  };
}

/**
 * Deterministic 32×32 visual fingerprint badge for a saved script (spec 62).
 * Renders an inline SVG derived only from structured SavedScript fields.
 * Safe for inline use — all data originates from app-controlled storage.
 */
export function StrategyFingerprint({ entry, className }: StrategyFingerprintProps) {
  const inputs = deriveInputs(entry);
  const svg = buildFingerprintSvg(inputs);

  const label = `Strategy fingerprint for ${entry.name || 'Untitled strategy'}`;

  return (
    <div
      className={className}
      style={{ width: 32, height: 32, flex: '0 0 32px' }}
      title={entry.name || 'Untitled strategy'}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
