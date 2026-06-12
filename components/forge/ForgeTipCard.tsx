'use client';

import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForgeTip } from '@/lib/agent/tips';

type ForgeTipCardProps = {
  tip: ForgeTip;
  onDismiss?: () => void;
  onRefine?: (suggestion?: string) => void;
};

/**
 * Inline educational tip card for contextual suggestions (after health/backtest tools).
 * Amber styling. Renders from data-tip parts.
 */
export function ForgeTipCard({ tip, onDismiss, onRefine }: ForgeTipCardProps) {
  const handleRefine = () => {
    if (tip.refineSuggestion && navigator?.clipboard) {
      navigator.clipboard.writeText(tip.refineSuggestion).catch(() => {
        /* non-fatal */
      });
    }
    onRefine?.(tip.refineSuggestion);
  };

  return (
    <div
      className={cn(
        'group relative max-w-[92%] border-l-2 border-amber-500/70 bg-amber-500/[0.035] py-2.5 pl-4 pr-8',
        'dark:bg-amber-500/[0.04]',
        'text-sm leading-relaxed text-zinc-800 dark:text-zinc-200',
      )}
      role="note"
      aria-label={`Tip: ${tip.title}`}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded p-1 text-amber-600/60 opacity-60 transition hover:bg-amber-500/10 hover:text-amber-700 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:text-amber-400/70 dark:hover:text-amber-300"
          aria-label="Dismiss this tip for the current session"
        >
          <X className="size-3.5" />
        </button>
      ) : null}

      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600/90 dark:text-amber-400/80">
        <Lightbulb className="size-3.5" />
        <span>Tip</span>
      </div>

      <div className="font-medium text-amber-700 dark:text-amber-300">
        {tip.title}
      </div>

      <p className="mt-1 text-[13px] leading-snug text-zinc-700 dark:text-zinc-300">
        {tip.body}
      </p>

      {tip.codeSnippet ? (
        <pre className="mt-2 overflow-x-auto rounded border border-amber-500/20 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-amber-200/90 dark:bg-zinc-950/70">
          {tip.codeSnippet}
        </pre>
      ) : null}

      {tip.refineSuggestion && onRefine ? (
        <button
          type="button"
          onClick={handleRefine}
          className="mt-2 inline text-[12px] text-amber-600 underline decoration-amber-600/50 underline-offset-2 transition hover:text-amber-700 hover:decoration-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
        >
          Refine with this
        </button>
      ) : null}
    </div>
  );
}
