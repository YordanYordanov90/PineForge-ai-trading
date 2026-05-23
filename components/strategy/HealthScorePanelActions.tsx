'use client';

import { Button } from '@/components/ui/button';
import { pfOutputBorder } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type HealthScorePanelActionsProps = {
  label: string;
  disabled: boolean;
  onRun: () => void;
  variant?: 'inline' | 'footer';
  className?: string;
};

export function HealthScorePanelActions({
  label,
  disabled,
  onRun,
  variant = 'footer',
  className,
}: HealthScorePanelActionsProps) {
  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onRun}
      className={cn(
        variant === 'inline'
          ? 'mt-4 border-zinc-700'
          : 'border-zinc-300 text-zinc-800 dark:border-zinc-700 dark:text-zinc-300',
        className,
      )}
    >
      {label}
    </Button>
  );

  if (variant === 'inline') {
    return button;
  }

  return (
    <div className={cn('mt-6 flex justify-end border-t pt-4', pfOutputBorder)}>
      {button}
    </div>
  );
}
