import type { RiskThemeCount } from '@/lib/db/progress-stats';

type Props = {
  themes: RiskThemeCount[];
  totalScored: number;
};

export function RiskThemesPanel({ themes, totalScored }: Props) {
  if (themes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-black/30 px-4 py-8 text-center text-sm text-zinc-500">
        No recurring risk patterns detected yet. Run Health Score on more strategies.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {themes.map((t, idx) => {
        const pct = totalScored > 0 ? Math.round((t.count / totalScored) * 100) : 0;
        return (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-neon-500/70">#{idx + 1}</span>
              <span className="text-zinc-100">{t.theme}</span>
            </div>
            <div className="text-right font-mono text-xs text-zinc-400">
              {t.count} of {totalScored} <span className="text-zinc-600">({pct}%)</span>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-zinc-500">Derived from stored Health Score risk notes using static keyword patterns.</p>
    </div>
  );
}
