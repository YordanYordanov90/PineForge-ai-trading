'use client';

import { Activity, AlertTriangle, CheckCircle2, Loader2, ListChecks } from 'lucide-react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import { useHealthScore, type HealthScoreRunInput } from '@/hooks/useHealthScore';
import { Button } from '@/components/ui/button';
import {
  pfOutputBody,
  pfOutputBorder,
  pfOutputHeading,
  pfOutputMuted,
  pfOutputSectionLabel,
  pfOutputSubtle,
  pfOutputTitle,
  terminalRunButton,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type HealthScorePanelProps = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
  isScriptFinal: boolean;
  resetKey: number;
  onPrefillRefine?: (instruction: string) => void;
};

function scoreTone(score: number): string {
  if (score >= 8) return 'text-emerald-600 dark:text-emerald-300';
  if (score >= 6) return 'text-emerald-700 dark:text-emerald-400/90';
  if (score >= 4) return 'text-amber-700 dark:text-amber-300';
  return 'text-rose-700 dark:text-rose-300';
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
      <h3 className={cn('mb-2 flex items-center gap-2', pfOutputSectionLabel)}>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {title}
      </h3>
      <ul className={cn('space-y-2 text-sm', pfOutputBody)}>
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className={cn('flex gap-2 leading-relaxed', itemClassName)}
          >
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NextStepsSection({
  items,
  onPrefillRefine,
}: {
  items: string[];
  onPrefillRefine?: (instruction: string) => void;
}) {
  return (
    <section>
      <h3 className={cn('mb-2 flex items-center gap-2', pfOutputSectionLabel)}>
        <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Next Steps
      </h3>
      <ul className={cn('space-y-3 text-sm', pfOutputBody)}>
        {items.map((item, index) => (
          <li
            key={`next-step-${index}`}
            className="flex items-start justify-between gap-3 leading-relaxed"
          >
            <div className="flex min-w-0 flex-1 gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden />
              <span>{item}</span>
            </div>
            {onPrefillRefine ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrefillRefine(item)}
                className="h-7 shrink-0 border-emerald-500/35 bg-emerald-500/5 px-2.5 text-xs text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Refine
              </Button>
            ) : null}
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
  onPrefillRefine,
}: HealthScorePanelProps) {
  const { phase, result, errorMessage, run, isLoading } = useHealthScore(resetKey);
  const canRun =
    isScriptFinal && Boolean(script.trim()) && Boolean((prompt ?? '').trim());

  const handleRun = () => {
    void run(
      buildRunInput({ prompt, script, model, balance, structuredInputs, isScriptFinal, resetKey }),
    );
  };

  if (!script.trim()) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Generate or load a script to run a Health Score.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
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
          <p className={cn('text-sm', pfOutputTitle)}>Strategy Health Score</p>
          <p className={cn('mt-1 max-w-sm text-sm', pfOutputMuted)}>
            Get a 1–10 structural quality review with actionable notes before you backtest in
            TradingView. Guidance only — not a profitability forecast.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canRun || isLoading}
          onClick={handleRun}
          className={terminalRunButton}
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
          <p className={cn('text-sm', pfOutputBody)}>Analyzing strategy structure…</p>
          <p className={cn('text-xs', pfOutputMuted)}>Usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="px-6 py-8" role="alert">
        <p className={cn('text-sm', pfOutputBody)}>
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
      <p className={cn('mb-4 text-xs', pfOutputMuted)}>
        Structural analysis guidance — not a performance prediction or financial advice.
      </p>

      <div className={cn('mb-6 flex flex-wrap items-end gap-3 border-b pb-6', pfOutputBorder)}>
        <p
          className={cn('text-5xl font-semibold tabular-nums leading-none', scoreTone(result.score))}
          aria-label={`Health score ${result.score} out of 10`}
        >
          {result.score}
          <span className={cn('text-2xl font-normal', pfOutputMuted)}>/10</span>
        </p>
        <div>
          <p className={cn('text-lg font-medium', pfOutputHeading)}>{result.verdict}</p>
          <p className={cn('text-xs', pfOutputMuted)}>Strategy Health Score</p>
        </div>
      </div>

      <p className={cn('mb-6 text-sm leading-relaxed', pfOutputBody)}>{result.summary}</p>

      <div className="grid gap-6">
        <BulletSection title="Strengths" items={result.strengths} icon={CheckCircle2} />
        <BulletSection
          title="Risks"
          items={result.risks}
          icon={AlertTriangle}
          itemClassName="text-amber-900/90 dark:text-amber-100/90"
        />
        <NextStepsSection items={result.nextSteps} onPrefillRefine={onPrefillRefine} />
      </div>

      <div className={cn('mt-6 flex justify-end border-t pt-4', pfOutputBorder)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('border-zinc-300 text-zinc-800 dark:border-zinc-700 dark:text-zinc-300')}
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Run again
        </Button>
      </div>
    </div>
  );
}
