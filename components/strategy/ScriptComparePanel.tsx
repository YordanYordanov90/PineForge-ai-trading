'use client';

import { diffLines } from 'diff';
import { useCallback, useMemo, useRef, type UIEvent } from 'react';
import {
  pfOutputCompareAdded,
  pfOutputCompareDivide,
  pfOutputCompareHeader,
  pfOutputCompareLine,
  pfOutputCompareRemoved,
  pfOutputCompareSpacer,
  pfOutputBorder,
  pfOutputMuted,
} from '@/lib/ui/terminal-texture';
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

const comparePreBase =
  'm-0 min-h-[1.625rem] border-b px-3 py-0.5 font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto';

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
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className={cn('relative z-10 grid grid-cols-2', pfOutputCompareHeader)}>
        <div className={cn('border-r px-3 py-2 tabular-nums', pfOutputBorder)}>{beforeLabel}</div>
        <div className="px-3 py-2 tabular-nums">{afterLabel}</div>
      </div>
      <div className={cn('grid max-h-[640px] grid-cols-2 divide-x', pfOutputCompareDivide)}>
        <div
          ref={leftScrollRef}
          onScroll={onLeftScroll}
          className="overflow-auto overscroll-contain"
        >
          {rows.map((row, i) => (
            <pre
              key={`l-${i}`}
              className={cn(
                comparePreBase,
                pfOutputCompareLine,
                row.leftKind === 'removed' && pfOutputCompareRemoved,
                row.leftKind === 'spacer' && pfOutputCompareSpacer,
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
                comparePreBase,
                pfOutputCompareLine,
                row.rightKind === 'added' && pfOutputCompareAdded,
                row.rightKind === 'spacer' && pfOutputCompareSpacer,
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
