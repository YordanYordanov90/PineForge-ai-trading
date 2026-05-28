'use client';

import { StrategyFingerprint } from '@/components/strategy/StrategyFingerprint';
import type { SavedScript, ComparisonReportData } from '@/lib/types';
import { cn } from '@/lib/utils';

type CoverageMapProps = {
  coverage: ComparisonReportData['coverageMap'];
  scripts: SavedScript[]; // the 2-3 scripts that were compared (for fingerprint lookup)
  className?: string;
};

const REGIMES = [
  { key: 'trendy' as const, label: 'Trending' },
  { key: 'ranging' as const, label: 'Ranging' },
  { key: 'breakout' as const, label: 'Breakout' },
];

export function CoverageMap({ coverage, scripts, className }: CoverageMapProps) {
  const scriptById = new Map(scripts.map((s) => [Number(s.id), s]));

  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-[#111111]/60 p-4', className)}>
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">
        Coverage Map
      </div>
      <div className="grid grid-cols-3 gap-2">
        {REGIMES.map(({ key, label }) => {
          const winnerId = coverage[key];
          const winner = winnerId != null ? scriptById.get(winnerId) : null;
          return (
            <div
              key={key}
              className="flex flex-col items-center rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-3 text-center"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{label}</div>
              {winner ? (
                <div className="mt-2 flex flex-col items-center gap-1.5">
                  <StrategyFingerprint entry={winner} className="h-8 w-8" />
                  <div className="max-w-[92px] truncate text-[10px] text-zinc-300" title={winner.name}>
                    {winner.name}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-zinc-500">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
