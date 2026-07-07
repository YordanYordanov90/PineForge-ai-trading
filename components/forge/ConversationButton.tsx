'use client';

import { FlaskConical, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConversationButtonProps = {
  title: string;
  relative: string;
  type: 'general' | 'research';
  isActive: boolean;
  onClick: () => void;
};

export function ConversationButton({
  title,
  relative,
  type,
  isActive,
  onClick,
}: ConversationButtonProps) {
  const isResearch = type === 'research';
  const Icon = isResearch ? FlaskConical : MessageSquare;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className="flex w-full min-w-0 flex-col items-start gap-0.5 pr-8 text-left"
    >
      <span className="flex w-full min-w-0 items-center gap-1.5">
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            isResearch
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-neon-600/70 dark:text-neon-400/60',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'block min-w-0 flex-1 truncate text-sm font-medium',
            isActive
              ? 'text-neon-700 dark:text-neon-300'
              : 'text-zinc-800 dark:text-zinc-200',
          )}
        >
          {title}
        </span>
        {isResearch ? (
          <span className="ml-1 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
            RESEARCH
          </span>
        ) : null}
      </span>
      <span className="pf-muted block pl-5 font-mono text-[10px] tabular-nums uppercase tracking-wide">
        {relative}
      </span>
    </button>
  );
}