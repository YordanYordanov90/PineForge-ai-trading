import type { HealthScoreResult } from '@/lib/api/validation';
import {
  pfOutputBorder,
  pfOutputHeading,
  pfOutputMuted,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

function scoreTone(score: number): string {
  if (score >= 8) return 'text-neon-600 dark:text-neon-300';
  if (score >= 6) return 'text-neon-700 dark:text-neon-400/90';
  if (score >= 4) return 'text-amber-700 dark:text-amber-300';
  return 'text-rose-700 dark:text-rose-300';
}

type HealthScoreScoreHeaderProps = {
  result: HealthScoreResult;
};

export function HealthScoreScoreHeader({ result }: HealthScoreScoreHeaderProps) {
  return (
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
  );
}
