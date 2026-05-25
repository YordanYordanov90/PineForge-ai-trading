'use client';

import { useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  FlaskConical,
  LineChart,
  ListChecks,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { BacktestSummaryResult } from '@/lib/api/validation';
import type { GrokModel } from '@/lib/config/constants';
import {
  useBacktestSummary,
  type BacktestSummaryRunInput,
} from '@/hooks/useBacktestSummary';
import { Button } from '@/components/ui/button';
import {
  pfOutputBody,
  pfOutputBorder,
  pfOutputHeading,
  pfOutputMuted,
  pfOutputSectionLabel,
  pfOutputTitle,
  terminalRunButton,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type BacktestSummaryPanelProps = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
  isScriptFinal: boolean;
  resetKey: number;
  /** Spec 50: surfaces loaded result for Markdown export. */
  onResultChange?: (result: BacktestSummaryResult | null) => void;
};

type SectionIcon = ComponentType<SVGProps<SVGSVGElement>>;

function buildRunInput(props: BacktestSummaryPanelProps): BacktestSummaryRunInput {
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
  icon: SectionIcon;
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
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BacktestSummaryPanel({
  prompt,
  script,
  model,
  balance,
  structuredInputs,
  isScriptFinal,
  resetKey,
  onResultChange,
}: BacktestSummaryPanelProps) {
  const { phase, result, errorMessage, run, isLoading } = useBacktestSummary(resetKey);

  useEffect(() => {
    onResultChange?.(phase === 'success' && result ? result : null);
  }, [phase, result, onResultChange]);

  const canRun =
    isScriptFinal && Boolean(script.trim()) && Boolean((prompt ?? '').trim());

  const handleRun = () => {
    void run(
      buildRunInput({
        prompt,
        script,
        model,
        balance,
        structuredInputs,
        isScriptFinal,
        resetKey,
      }),
    );
  };

  if (!script.trim()) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Generate or load a script to build a backtesting plan.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Finish generating or refining to draft the backtesting checklist.
      </p>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neon-500/25 bg-neon-500/10">
          <FlaskConical className="h-6 w-6 text-neon-400" aria-hidden />
        </div>
        <div>
          <p className={cn('text-sm', pfOutputTitle)}>Backtesting Summary</p>
          <p className={cn('mt-1 max-w-sm text-sm', pfOutputMuted)}>
            Get a structured checklist for where to test, what to inspect in the equity curve,
            common failure modes, and a step-by-step plan. Research guidance only — no
            performance predictions.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canRun || isLoading}
          onClick={handleRun}
          className={terminalRunButton}
        >
          Generate Backtesting Summary
        </Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="px-6 py-10" role="status" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-neon-400" aria-hidden />
          <p className={cn('text-sm', pfOutputBody)}>Drafting backtesting checklist…</p>
          <p className={cn('text-xs', pfOutputMuted)}>Usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="px-6 py-8" role="alert">
        <p className={cn('text-sm', pfOutputBody)}>
          {errorMessage ?? 'Could not generate the backtesting summary.'}
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

  const { title, sections } = result;

  return (
    <div className="max-h-[640px] overflow-auto px-6 py-6">
      <p className={cn('mb-4 text-xs', pfOutputMuted)}>
        Research checklist — not a performance prediction. Run your own backtest in TradingView
        with the inputs below before any live execution.
      </p>

      <div className={cn('mb-6 border-b pb-5', pfOutputBorder)}>
        <p className={cn('text-lg font-medium', pfOutputHeading)}>{title}</p>
        <p className={cn('mt-1 text-xs', pfOutputMuted)}>Backtesting Summary</p>
      </div>

      <div className="grid gap-6">
        <BulletSection
          title="Recommended Timeframes"
          items={sections.recommendedTimeframes}
          icon={Clock}
        />
        <BulletSection
          title="Recommended Markets"
          items={sections.recommendedMarkets}
          icon={TrendingUp}
        />
        <BulletSection
          title="What To Check In The Equity Curve"
          items={sections.equityCurveChecks}
          icon={LineChart}
        />
        <BulletSection
          title="Common Failure Modes"
          items={sections.failureModes}
          icon={AlertTriangle}
          itemClassName="text-amber-900/90 dark:text-amber-100/90"
        />
        <BulletSection
          title="Backtesting Plan"
          items={sections.testPlan}
          icon={ListChecks}
        />
      </div>

      <div className={cn('mt-6 flex justify-end border-t pt-4', pfOutputBorder)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-300 text-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Run again
        </Button>
      </div>
    </div>
  );
}
