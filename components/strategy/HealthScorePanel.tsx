'use client';

import { Activity, AlertTriangle, CheckCircle2, Loader2, ListChecks } from 'lucide-react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import { useHealthScore, type HealthScoreRunInput } from '@/hooks/useHealthScore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HealthScorePanelProps = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
  isScriptFinal: boolean;
  resetKey: number;
};

function scoreTone(score: number): string {
  if (score >= 8) return 'text-emerald-300';
  if (score >= 6) return 'text-emerald-400/90';
  if (score >= 4) return 'text-amber-300';
  return 'text-rose-300';
}

function buildRunInput(props: HealthScorePanelProps): HealthScoreRunInput {
  return {
    prompt: props.prompt,
    script: props.script,
    model: props.model,
    balance: props.balance,
    structuredInputs: props.structuredInputs,
  };
}

function BulletSection({
  title,
  items,
  icon: Icon,
  itemClassName,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  itemClassName?: string;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {title}
      </h3>
      <ul className="space-y-2 text-sm text-zinc-300">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className={cn('flex gap-2 leading-relaxed', itemClassName)}
          >
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HealthScorePanel({
  prompt,
  script,
  model,
  balance,
  structuredInputs,
  isScriptFinal,
  resetKey,
}: HealthScorePanelProps) {
  const { phase, result, errorMessage, run, isLoading } = useHealthScore(resetKey);
  const canRun = isScriptFinal && Boolean(script.trim()) && Boolean(prompt.trim());

  const handleRun = () => {
    void run(
      buildRunInput({ prompt, script, model, balance, structuredInputs, isScriptFinal, resetKey }),
    );
  };

  if (!script.trim()) {
    return (
      <p className="px-6 py-6 text-sm text-zinc-500">
        Generate or load a script to run a Health Score.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className="px-6 py-6 text-sm text-zinc-500">
        Finish generating or refining to analyze strategy health.
      </p>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
          <Activity className="h-6 w-6 text-emerald-400" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Strategy Health Score</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Get a 1–10 structural quality review with actionable notes before you backtest in
            TradingView. Guidance only — not a profitability forecast.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canRun || isLoading}
          onClick={handleRun}
          className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
        >
          Run Health Score
        </Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="px-6 py-10" role="status" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" aria-hidden />
          <p className="text-sm text-zinc-300">Analyzing strategy structure…</p>
          <p className="text-xs text-zinc-500">Usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="px-6 py-8" role="alert">
        <p className="text-sm text-zinc-300">
          {errorMessage ?? 'Could not complete the health score.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-zinc-700"
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-h-[640px] overflow-auto px-6 py-6">
      <p className="mb-4 text-xs text-zinc-500">
        Structural analysis guidance — not a performance prediction or financial advice.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3 border-b border-zinc-800/70 pb-6">
        <p
          className={cn('text-5xl font-semibold tabular-nums leading-none', scoreTone(result.score))}
          aria-label={`Health score ${result.score} out of 10`}
        >
          {result.score}
          <span className="text-2xl font-normal text-zinc-500">/10</span>
        </p>
        <div>
          <p className="text-lg font-medium text-zinc-100">{result.verdict}</p>
          <p className="text-xs text-zinc-500">Strategy Health Score</p>
        </div>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-zinc-300">{result.summary}</p>

      <div className="grid gap-6">
        <BulletSection title="Strengths" items={result.strengths} icon={CheckCircle2} />
        <BulletSection
          title="Risks"
          items={result.risks}
          icon={AlertTriangle}
          itemClassName="text-amber-100/90"
        />
        <BulletSection title="Next Steps" items={result.nextSteps} icon={ListChecks} />
      </div>

      <div className="mt-6 flex justify-end border-t border-zinc-800/70 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300"
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Run again
        </Button>
      </div>
    </div>
  );
}
