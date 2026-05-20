'use client';

import type { ReactElement } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useModKeyLabel } from '@/hooks/useShortcutLabel';
import { formatShortcut, type ShortcutKey } from '@/lib/ui/shortcut-label';
import { cn } from '@/lib/utils';

type ActionTooltipProps = {
  label: string;
  shortcut?: ShortcutKey;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Use when the child may be `disabled` so the tooltip still receives pointer events */
  wrapDisabled?: boolean;
  triggerClassName?: string;
  children: ReactElement;
};

export function ActionTooltip({
  label,
  shortcut,
  side = 'top',
  wrapDisabled = false,
  triggerClassName,
  children,
}: ActionTooltipProps) {
  const modLabel = useModKeyLabel();

  const trigger = wrapDisabled ? (
    <span className={cn('inline-flex', triggerClassName)}>{children}</span>
  ) : (
    children
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={side}>
        {label}
        {shortcut ? (
          <span className="ml-1.5 font-mono tabular-nums text-zinc-400">
            {formatShortcut(shortcut, modLabel)}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
