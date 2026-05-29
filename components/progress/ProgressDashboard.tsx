'use client';

import type { ProgressStats } from '@/lib/db/progress-stats';
import { HealthScoreTrendChart } from '@/components/progress/HealthScoreTrendChart';
import { RiskThemesPanel } from '@/components/progress/RiskThemesPanel';
import { RefinementDepthPanel } from '@/components/progress/RefinementDepthPanel';
import { MemoryInsightsPanel } from '@/components/progress/MemoryInsightsPanel';
import { Lock } from 'lucide-react';
import Link from 'next/link';

type Props = {
  stats: ProgressStats | null;
  plan: string;
};

export function ProgressDashboard({ stats, plan }: Props) {
  const isPro = plan === 'pro';
  const s = stats ?? {
    weeklyHealthScores: [],
    topRiskThemes: [],
    avgRefinementDepth: 0,
    mostRefinedScripts: [],
    memoryInsights: [],
    totalScripts: 0,
    totalScoredScripts: 0,
    scriptsThisMonth: 0,
    scriptsLastMonth: 0,
    highestScore: null,
  };

  const hasHealthData = s.totalScoredScripts > 0;
  const hasAnyData = s.totalScripts > 0;

  return (
    <div className="space-y-8">
      {/* Free teaser bar */}
      {!isPro && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300/90">
          Free plan: you see Health Score Trend + Common Risks.{' '}
          <Link href="/pricing" className="underline hover:text-amber-200">
            Upgrade to Pro
          </Link>{' '}
          for Refinement Depth, Forge Memory Insights, and future features.
        </div>
      )}

      {/* Health Score Trend — always visible (core value) */}
      <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Health Score Trend</h2>
            <p className="text-xs text-zinc-500">Average score per week (last 8 weeks) • {s.totalScoredScripts} scored strategies</p>
          </div>
          {s.highestScore && (
            <div className="text-right text-xs">
              <div className="text-neon-400">Personal best</div>
              <Link
                href={`/generate?scriptId=${s.highestScore.scriptId}`}
                className="font-mono text-neon-300 hover:underline"
                title={s.highestScore.title}
              >
                {s.highestScore.score}/10
              </Link>
            </div>
          )}
        </div>

        <HealthScoreTrendChart data={s.weeklyHealthScores} hasData={hasHealthData} />

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-black/40 px-3 py-2">
            This month <span className="font-mono text-neon-300">{s.scriptsThisMonth}</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-black/40 px-3 py-2">
            Last month <span className="font-mono text-zinc-400">{s.scriptsLastMonth}</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 md:col-span-1">
            Total strategies <span className="font-mono text-zinc-300">{s.totalScripts}</span>
          </div>
        </div>

        {!hasHealthData && hasAnyData && (
          <p className="mt-3 text-xs text-amber-400/80">
            Run Health Score on your saved scripts to start populating the trend.
          </p>
        )}
      </section>

      {/* Common Risk Themes — always visible */}
      <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-100">Common Risk Themes</h2>
        <RiskThemesPanel themes={s.topRiskThemes} totalScored={s.totalScoredScripts} />
      </section>

      {/* Pro-only sections */}
      {isPro ? (
        <>
          <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-100">Refinement Depth</h2>
            <RefinementDepthPanel
              avgDepth={s.avgRefinementDepth}
              mostRefined={s.mostRefinedScripts}
            />
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-100">Forge Memory Insight</h2>
            <MemoryInsightsPanel insights={s.memoryInsights} />
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-zinc-800/70 bg-[#111111]/60 p-6 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Refinement Depth + Forge Memory Insights are Pro features.</span>
          </div>
        </div>
      )}

      {s.totalScripts === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
          No strategies yet. Generate a few scripts and run Health Score on them to see your progression.
        </div>
      )}
    </div>
  );
}
