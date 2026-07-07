'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useExplainScriptStream,
  type ExplainScriptMode,
} from '@/hooks/strategy/useExplainScriptStream';
import {
  pfOutputBody,
  pfOutputMuted,
  pfOutputSkeleton,
  pfOutputSubtle,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

export type { ExplainScriptMode };

type ExplainScriptPanelProps = {
  mode: ExplainScriptMode;
  script: string;
  isTabActive: boolean;
  isScriptFinal: boolean;
  cancelKey: number;
  /** When false, content grows with the output card scroll (no nested 640px scroller). */
  containedScroll?: boolean;
  /** Spec 50: surfaces Breakdown tab text for Markdown export. */
  onBreakdownChange?: (text: string | null) => void;
};

export function ExplainScriptPanel({
  mode,
  script,
  isTabActive,
  isScriptFinal,
  cancelKey,
  containedScroll = true,
  onBreakdownChange,
}: ExplainScriptPanelProps) {
  const { text, phase, retry } = useExplainScriptStream({
    mode,
    script,
    isTabActive,
    isScriptFinal,
    cancelKey,
    onBreakdownChange,
  });

  if (!script.trim()) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Generate or load a script to see this tab.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Finish generating or refining to load this explanation.
      </p>
    );
  }

  if (phase === 'idle' && !isTabActive) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Open this tab to load the explanation.
      </p>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="space-y-3 px-6 py-6">
        <Skeleton className={cn('h-4 w-[88%] rounded-md', pfOutputSkeleton)} />
        <Skeleton className={cn('h-4 w-[76%] rounded-md', pfOutputSkeleton)} />
        <Skeleton className={cn('h-4 w-[82%] rounded-md', pfOutputSkeleton)} />
        <div className={cn('flex items-center gap-2 pt-2 text-xs', pfOutputMuted)}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="px-6 py-6">
        <p className={cn('text-sm', pfOutputSubtle)}>Could not load this explanation.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 border-zinc-700"
          onClick={retry}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'px-6 py-6 text-sm leading-relaxed whitespace-pre-wrap',
        containedScroll && 'max-h-[640px] overflow-auto',
        pfOutputBody,
      )}
    >
      {text}
      {phase === 'streaming' && (
        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-neon-400/80 align-middle" />
      )}
    </div>
  );
}