'use client';

import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pfOutputMuted, pfOutputTitle, terminalRunButton } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type HealthScoreEmptyStateProps = {
  canRun: boolean;
  isLoading: boolean;
  onRun: () => void;
};

export function HealthScoreEmptyState({ canRun, isLoading, onRun }: HealthScoreEmptyStateProps) {
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
        onClick={onRun}
        className={terminalRunButton}
      >
        Run Health Score
      </Button>
    </div>
  );
}
