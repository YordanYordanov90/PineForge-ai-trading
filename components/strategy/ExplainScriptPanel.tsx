'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import {
  pfOutputBody,
  pfOutputMuted,
  pfOutputSkeleton,
  pfOutputSubtle,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

export type ExplainScriptMode = 'breakdown' | 'checklist';

type ExplainScriptPanelProps = {
  mode: ExplainScriptMode;
  script: string;
  isTabActive: boolean;
  isScriptFinal: boolean;
  cancelKey: number;
  /** Spec 50: surfaces Breakdown tab text for Markdown export. */
  onBreakdownChange?: (text: string | null) => void;
};

type Phase = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

function fingerprintScript(script: string): string {
  const trimmed = script.trim();
  const head = trimmed.slice(0, 64);
  const tail = trimmed.slice(-64);
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return `${trimmed.length}:${hash.toString(36)}:${head}:${tail}`;
}

function cacheKeyFor(mode: ExplainScriptMode, script: string) {
  return `${mode}::${fingerprintScript(script)}`;
}

export function ExplainScriptPanel({
  mode,
  script,
  isTabActive,
  isScriptFinal,
  cancelKey,
  onBreakdownChange,
}: ExplainScriptPanelProps) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [retryTick, setRetryTick] = useState(0);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef<AbortController | null>(null);
  const startedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    startedRef.current.clear();
    if (mode === 'breakdown') {
      onBreakdownChange?.(null);
    }
  }, [cancelKey, mode, onBreakdownChange]);

  useEffect(() => {
    if (mode !== 'breakdown' || !onBreakdownChange) return;
    const trimmed = text.trim();
    onBreakdownChange(trimmed.length > 0 ? trimmed : null);
  }, [mode, text, onBreakdownChange]);

  useEffect(() => {
    const trimmed = script.trim();
    if (!trimmed) {
      setText('');
      setPhase('idle');
      return;
    }

    const key = cacheKeyFor(mode, script);
    const cached = cacheRef.current.get(key);
    if (cached !== undefined) {
      setText(cached);
      setPhase('done');
      return;
    }

    if (!isScriptFinal) {
      setText('');
      setPhase('idle');
      return;
    }

    if (!isTabActive) {
      return;
    }

    if (startedRef.current.has(key)) {
      return;
    }

    startedRef.current.add(key);
    const ac = new AbortController();
    inFlightRef.current = ac;

    let accumulated = '';

    (async () => {
      try {
        setPhase('loading');
        setText('');
        const res = await fetch('/api/explain-script', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ script, mode }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const maybeJson: unknown = await res.json().catch(() => null);
          const fallback =
            res.status === 409
              ? 'A generation is already in progress.'
              : res.status === 429
                ? 'Too many requests. Please try again in a moment.'
                : 'Request failed. Please try again.';
          toast.error(
            messageFromApiErrorJson(
              maybeJson,
              'Invalid input. Please try again.',
              fallback,
            ),
          );
          startedRef.current.delete(key);
          setPhase('error');
          return;
        }

        if (!res.body) {
          accumulated = await res.text();
          cacheRef.current.set(key, accumulated);
          setText(accumulated);
          setPhase('done');
          return;
        }

        setPhase('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            accumulated += decoder.decode(value, { stream: true });
            setText(accumulated);
          }
        }

        cacheRef.current.set(key, accumulated);
        setPhase('done');
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          startedRef.current.delete(key);
          return;
        }
        toast.error('Something went wrong. Please try again.');
        startedRef.current.delete(key);
        setPhase('error');
      }
    })();
  }, [isTabActive, isScriptFinal, script, mode, cancelKey, retryTick]);

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
          onClick={() => {
            const key = cacheKeyFor(mode, script);
            startedRef.current.delete(key);
            setPhase('idle');
            setText('');
            setRetryTick((t) => t + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-h-[640px] overflow-auto px-6 py-6 text-sm leading-relaxed whitespace-pre-wrap',
        pfOutputBody,
      )}
    >
      {text}
      {phase === 'streaming' && (
        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-400/80 align-middle" />
      )}
    </div>
  );
}
