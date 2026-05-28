'use client';

import { useMemo } from 'react';
import { ArrowRight, GitCompare } from 'lucide-react';
import { StrategyFingerprint } from '@/components/strategy/StrategyFingerprint';
import { CoverageMap } from '@/components/reports/CoverageMap';
import type { SavedComparisonReport, SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ComparisonReportCardProps = {
  report: SavedComparisonReport;
  scripts: SavedScript[]; // the compared scripts (for fingerprints + coverage)
  onRefine?: (scriptId: number) => void;
  className?: string;
};

const OVERLAP_STYLES: Record<SavedComparisonReport['report']['overlapAssessment'], string> = {
  low: 'text-neon-400 border-neon-500/40 bg-neon-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  high: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};

export function ComparisonReportCard({
  report,
  scripts,
  onRefine,
  className,
}: ComparisonReportCardProps) {
  const { report: data } = report;
  const scriptById = useMemo(() => new Map(scripts.map((s) => [Number(s.id), s])), [scripts]);

  const headerScripts = report.scriptIds
    .map((id) => scriptById.get(id))
    .filter((s): s is SavedScript => Boolean(s));

  const overlapClass = OVERLAP_STYLES[data.overlapAssessment];

  return (
    <div className={cn('pf-card rounded-2xl border border-zinc-800 p-6', className)}>
      {/* Header: fingerprints + title */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex -space-x-1">
          {headerScripts.map((s) => (
            <StrategyFingerprint key={s.id} entry={s} className="h-9 w-9 ring-2 ring-[#111111]" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-zinc-400" aria-hidden />
            <h3 className="truncate text-lg font-semibold text-zinc-100">{report.title}</h3>
          </div>
          <div className="text-[10px] text-zinc-500">
            Compared {report.scriptIds.length} strategies · {new Date(report.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider',
            overlapClass,
          )}
          aria-label={`Overlap: ${data.overlapAssessment}`}
        >
          {data.overlapAssessment} overlap
        </div>
      </div>

      {/* Summary */}
      <section className="mb-6">
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Summary</div>
        <p className="text-sm leading-relaxed text-zinc-200">{data.summary}</p>
      </section>

      {/* Two-column logic + risk */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Entry Logic</div>
          <p className="text-sm leading-relaxed text-zinc-200">{data.entryLogicComparison}</p>
        </section>
        <section>
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Risk Profile</div>
          <p className="text-sm leading-relaxed text-zinc-200">{data.riskProfileComparison}</p>
        </section>
      </div>

      {/* Market fit list */}
      <section className="mb-6">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Market Condition Fit</div>
        <ul className="space-y-2">
          {data.marketConditionFit.map((fit) => (
            <li key={fit.scriptId} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-3 text-sm">
              <div className="font-medium text-zinc-100">{fit.scriptTitle}</div>
              <div className="mt-1 text-emerald-400/90">Best for: {fit.bestFor}</div>
              <div className="text-rose-400/80">Avoid in: {fit.avoidIn}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Coverage Map */}
      <CoverageMap coverage={data.coverageMap} scripts={scripts} className="mb-6" />

      {/* Overlap notes */}
      <section className="mb-6">
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Overlap Notes</div>
        <p className="text-sm leading-relaxed text-zinc-200">{data.overlapNotes}</p>
      </section>

      {/* Recommendation + CTA */}
      <section>
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-zinc-400">Recommendation</div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-200">{data.recommendation}</p>

        {onRefine && headerScripts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {headerScripts.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-neon-500/30 text-neon-300 hover:bg-neon-500/10"
                onClick={() => onRefine(Number(s.id))}
              >
                Refine “{s.name.length > 28 ? s.name.slice(0, 25) + '…' : s.name}”
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
