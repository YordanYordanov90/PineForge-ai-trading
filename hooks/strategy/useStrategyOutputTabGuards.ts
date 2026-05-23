'use client';

import { useEffect } from 'react';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';

type UseStrategyOutputTabGuardsOptions = {
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  compareAvailable: boolean;
  generatedScript: string;
};

export function useStrategyOutputTabGuards({
  outputTab,
  onOutputTabChange,
  compareAvailable,
  generatedScript,
}: UseStrategyOutputTabGuardsOptions) {
  useEffect(() => {
    if (outputTab !== 'compare' || compareAvailable) return;
    queueMicrotask(() => {
      onOutputTabChange('script');
    });
  }, [outputTab, compareAvailable, onOutputTabChange]);

  useEffect(() => {
    if (outputTab !== 'health' || generatedScript.trim()) return;
    queueMicrotask(() => {
      onOutputTabChange('script');
    });
  }, [outputTab, generatedScript, onOutputTabChange]);

  useEffect(() => {
    if (outputTab !== 'alerts' || generatedScript.trim()) return;
    queueMicrotask(() => {
      onOutputTabChange('script');
    });
  }, [outputTab, generatedScript, onOutputTabChange]);

  useEffect(() => {
    if (outputTab !== 'backtest' || generatedScript.trim()) return;
    queueMicrotask(() => {
      onOutputTabChange('script');
    });
  }, [outputTab, generatedScript, onOutputTabChange]);
}
