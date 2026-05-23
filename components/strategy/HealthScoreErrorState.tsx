'use client';

import { HealthScorePanelActions } from '@/components/strategy/HealthScorePanelActions';
import { pfOutputBody } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type HealthScoreErrorStateProps = {
  errorMessage: string | null;
  canRun: boolean;
  isLoading: boolean;
  onRun: () => void;
};

export function HealthScoreErrorState({
  errorMessage,
  canRun,
  isLoading,
  onRun,
}: HealthScoreErrorStateProps) {
  return (
    <div className="px-6 py-8" role="alert">
      <p className={cn('text-sm', pfOutputBody)}>
        {errorMessage ?? 'Could not complete the health score.'}
      </p>
      <HealthScorePanelActions
        label="Retry"
        disabled={!canRun || isLoading}
        onRun={onRun}
        variant="inline"
      />
    </div>
  );
}
