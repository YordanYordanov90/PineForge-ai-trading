'use client';

import { AlertTriangle, CheckCircle2, ListChecks } from 'lucide-react';
import { HealthScorePanelActions } from '@/components/strategy/HealthScorePanelActions';
import { HealthScoreScoreHeader } from '@/components/strategy/HealthScoreScoreHeader';
import { Button } from '@/components/ui/button';
import type { HealthScoreResult } from '@/lib/api/validation';
import {
  pfOutputBody,
  pfOutputMuted,
  pfOutputSectionLabel,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

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
                className="h-7 shrink-0 border-neon-500/35 bg-neon-500/5 px-2.5 text-xs text-neon-700 hover:bg-neon-500/15 hover:text-neon-800 dark:text-neon-300 dark:hover:text-neon-200"
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

type HealthScoreResultViewProps = {
  result: HealthScoreResult;
  canRun: boolean;
  isLoading: boolean;
  onRun: () => void;
  onPrefillRefine?: (instruction: string) => void;
};

export function HealthScoreResultView({
  result,
  canRun,
  isLoading,
  onRun,
  onPrefillRefine,
}: HealthScoreResultViewProps) {
  return (
    <div className="max-h-[640px] overflow-auto px-6 py-6">
      <p className={cn('mb-4 text-xs', pfOutputMuted)}>
        Structural analysis guidance — not a performance prediction or financial advice.
      </p>

      <HealthScoreScoreHeader result={result} />

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

      <HealthScorePanelActions
        label="Run again"
        disabled={!canRun || isLoading}
        onRun={onRun}
        variant="footer"
      />
    </div>
  );
}
