'use client';

import { useCallback, useState } from 'react';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';

function bumpKey(setter: (fn: (k: number) => number) => void) {
  setter((k) => k + 1);
}

export function useStrategyOutputResets() {
  const [outputTab, setOutputTab] = useState<OutputTab>('script');
  const [explainCancelKey, setExplainCancelKey] = useState(0);
  const [healthScoreResetKey, setHealthScoreResetKey] = useState(0);
  const [backtestSummaryResetKey, setBacktestSummaryResetKey] = useState(0);
  const [alertTemplatesResetKey, setAlertTemplatesResetKey] = useState(0);

  const resetPanelKeys = useCallback(() => {
    bumpKey(setExplainCancelKey);
    bumpKey(setHealthScoreResetKey);
    bumpKey(setBacktestSummaryResetKey);
    bumpKey(setAlertTemplatesResetKey);
  }, []);

  return {
    outputTab,
    setOutputTab,
    explainCancelKey,
    healthScoreResetKey,
    backtestSummaryResetKey,
    alertTemplatesResetKey,
    resetPanelKeys,
  };
}
