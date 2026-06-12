'use client';

import { useEffect, useRef } from 'react';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';

type UseGeneratorShortcutsOptions = {
  setOutputTab: (tab: OutputTab) => void;
  compareAvailable: boolean;
  onOpenHistory?: () => void;
  onDownload?: () => void;
  onStop?: () => void;
  isOutputBusy?: boolean;
  bumpHealthScore?: () => void;
  bumpBacktestSummary?: () => void;
  bumpAlertTemplates?: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || target.isContentEditable;
}

export function useGeneratorShortcuts({
  setOutputTab,
  compareAvailable,
  onOpenHistory,
  onDownload,
  onStop,
  isOutputBusy,
  bumpHealthScore,
  bumpBacktestSummary,
  bumpAlertTemplates,
}: UseGeneratorShortcutsOptions) {
  const setOutputTabRef = useRef(setOutputTab);
  const compareAvailableRef = useRef(compareAvailable);
  const onOpenHistoryRef = useRef(onOpenHistory);
  const onDownloadRef = useRef(onDownload);
  const onStopRef = useRef(onStop);
  const isOutputBusyRef = useRef(isOutputBusy);
  const bumpHealthRef = useRef(bumpHealthScore);
  const bumpBacktestRef = useRef(bumpBacktestSummary);
  const bumpAlertsRef = useRef(bumpAlertTemplates);

  useEffect(() => {
    setOutputTabRef.current = setOutputTab;
    compareAvailableRef.current = compareAvailable;
    onOpenHistoryRef.current = onOpenHistory;
    onDownloadRef.current = onDownload;
    onStopRef.current = onStop;
    isOutputBusyRef.current = isOutputBusy;
    bumpHealthRef.current = bumpHealthScore;
    bumpBacktestRef.current = bumpBacktestSummary;
    bumpAlertsRef.current = bumpAlertTemplates;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;
      const key = e.key;

      // Number keys 1-7: tab switching (no mod). Guard typing.
      if (!mod && /^[1-7]$/.test(key)) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        const num = parseInt(key, 10);
        const tabMap: Record<number, OutputTab> = {
          1: 'script',
          2: 'breakdown',
          3: 'checklist',
          4: 'health',
          5: 'alerts',
          6: 'backtest',
          7: 'compare',
        };
        const target = tabMap[num];
        if (!target) return;
        if (target === 'compare' && !compareAvailableRef.current) return;
        setOutputTabRef.current(target);
        return;
      }

      // Ctrl/Cmd + H : open history
      if (mod && !shift && key.toLowerCase() === 'h') {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        onOpenHistoryRef.current?.();
        return;
      }

      // Ctrl/Cmd + D : download
      if (mod && !shift && key.toLowerCase() === 'd') {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        onDownloadRef.current?.();
        return;
      }

      // Ctrl/Cmd + Shift + H : run health (switch + bump reset to prepare fresh run)
      if (mod && shift && key.toLowerCase() === 'h') {
        e.preventDefault();
        setOutputTabRef.current('health');
        bumpHealthRef.current?.();
        return;
      }

      // Ctrl/Cmd + Shift + B : run backtest
      if (mod && shift && key.toLowerCase() === 'b') {
        e.preventDefault();
        setOutputTabRef.current('backtest');
        bumpBacktestRef.current?.();
        return;
      }

      // Ctrl/Cmd + Shift + A : run alerts
      if (mod && shift && key.toLowerCase() === 'a') {
        e.preventDefault();
        setOutputTabRef.current('alerts');
        bumpAlertsRef.current?.();
        return;
      }

      // Ctrl/Cmd + . : stop generation (visible in status)
      if (mod && key === '.') {
        if (isOutputBusyRef.current) {
          e.preventDefault();
          onStopRef.current?.();
        }
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenHistory]); // stable ref pattern inside covers the rest
}
