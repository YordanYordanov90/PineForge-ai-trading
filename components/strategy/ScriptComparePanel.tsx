'use client';

import { diffLines } from 'diff';
import { useCallback, useMemo, useRef, type UIEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ScriptComparePanelProps {
  beforeScript: string;
  afterScript: string;
  beforeLabel: string;
  afterLabel: string;
  /** When false, show placeholder (streaming or no scripts). */
  isReady: boolean;
  emptyMessage?: string;
}

type DiffRow = {
  left: string;
  right: string;
  leftKind: 'neutral' | 'removed' | 'spacer';
  rightKind: 'neutral' | 'added' | 'spacer';
};

function linesFromChunk(value: string): string[] {
  if (value === '') return [];
  const parts = value.split('\n');
  if (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }
  return parts;
}

function buildSideBySideRows(before: string, after: string): DiffRow[] {
  const rows: DiffRow[] = [];
  const parts = diffLines(before, after);

  for (const part of parts) {
    const lines = linesFromChunk(part.value);
    if (part.added) {
      for (const line of lines) {
        rows.push({
          left: '',
          right: line,
          leftKind: 'spacer',
          rightKind: 'added',
        });
      }
    } else if (part.removed) {
      for (const line of lines) {
        rows.push({
          left: line,
          right: '',
          leftKind: 'removed',
          rightKind: 'spacer',
        });
      }
    } else {
      for (const line of lines) {
        rows.push({
          left: line,
          right: line,
          leftKind: 'neutral',
          rightKind: 'neutral',
        });
      }
    }
  }
  return rows;
}

export function ScriptComparePanel({
  beforeScript,
  afterScript,
  beforeLabel,
  afterLabel,
  isReady,
  emptyMessage = 'Finish generating to compare versions.',
}: ScriptComparePanelProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const rows = useMemo(() => {
    if (!isReady) return [];
    return buildSideBySideRows(beforeScript, afterScript);
  }, [beforeScript, afterScript, isReady]);

  const syncScroll = useCallback((source: HTMLDivElement, target: HTMLDivElement | null) => {
    if (!target || syncing.current) return;
    syncing.current = true;
    target.scrollTop = source.scrollTop;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const onLeftScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      syncScroll(e.currentTarget, rightScrollRef.current);
    },
    [syncScroll],
  );

  const onRightScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      syncScroll(e.currentTarget, leftScrollRef.current);
    },
    [syncScroll],
  );

  if (!isReady) {
    return (
      <p className="px-6 py-6 text-sm text-zinc-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="relative z-10 grid grid-cols-2 border-b border-zinc-800/80 bg-zinc-900/90 text-xs font-medium text-zinc-400">
        <div className="border-r border-zinc-800/80 px-3 py-2 tabular-nums">{beforeLabel}</div>
        <div className="px-3 py-2 tabular-nums">{afterLabel}</div>
      </div>
      <div className="grid max-h-[640px] grid-cols-2 divide-x divide-zinc-800/80">
        <div
          ref={leftScrollRef}
          onScroll={onLeftScroll}
          className="overflow-auto overscroll-contain"
        >
          {rows.map((row, i) => (
            <pre
              key={`l-${i}`}
              className={cn(
                'm-0 min-h-[1.625rem] border-b border-zinc-800/40 px-3 py-0.5 font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto text-zinc-200',
                row.leftKind === 'removed' && 'bg-rose-950/35 text-rose-100/95',
                row.leftKind === 'spacer' && 'bg-zinc-950/30 text-transparent',
              )}
            >
              {row.leftKind === 'spacer' ? '\u00a0' : row.left}
            </pre>
          ))}
        </div>
        <div
          ref={rightScrollRef}
          onScroll={onRightScroll}
          className="overflow-auto overscroll-contain"
        >
          {rows.map((row, i) => (
            <pre
              key={`r-${i}`}
              className={cn(
                'm-0 min-h-[1.625rem] border-b border-zinc-800/40 px-3 py-0.5 font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto text-zinc-200',
                row.rightKind === 'added' && 'bg-emerald-950/30 text-emerald-100/95',
                row.rightKind === 'spacer' && 'bg-zinc-950/30 text-transparent',
              )}
            >
              {row.rightKind === 'spacer' ? '\u00a0' : row.right}
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}
