'use client';

import { useCallback, useRef, useState } from 'react';
import {
  DEFAULT_MODEL,
  GROK_MODELS,
} from '@/lib/config/constants';
import type { GrokModel } from '@/lib/config/constants';
import type { SavedScript } from '@/lib/types';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { LineageState } from '@/hooks/strategy/lineage-types';

const MODEL_IDS = new Set<GrokModel['id']>(GROK_MODELS.map((m) => m.id));

export type ApplyLoadedScriptCallbacks = {
  setStrategy: (value: string) => void;
  setBalance: (value: string) => void;
  setSelectedModel: (value: GrokModel['id']) => void;
  setStructuredInputs: (value: StructuredInputsValue) => void;
  setGeneratedScript: (value: string) => void;
  setActivePreset: (value: string | null) => void;
  setCopied: (value: boolean) => void;
  setGenElapsed: (value: number | null) => void;
  setGenStartTime: (value: number | null) => void;
  resetPanelKeys: () => void;
  setOutputTab: (tab: 'script') => void;
  // Spec 60
  setAssumptions?: (value: import('@/lib/ai/parse-assumptions').StrategyAssumptions | null) => void;
};

export function useStrategyLineageSync() {
  const lineageRef = useRef<LineageState | null>(null);
  const [lineageState, setLineageState] = useState<LineageState | null>(null);
  const [historyLineageReady, setHistoryLineageReady] = useState(false);
  const [scriptCompareBaseline, setScriptCompareBaseline] = useState<string | null>(
    null,
  );
  const sessionHistoryNameRef = useRef('');
  const [exportTitle, setExportTitle] = useState('');
  const [exportCreatedAt, setExportCreatedAt] = useState<string | null>(null);

  const markCompareBaseline = useCallback((script: string) => {
    setScriptCompareBaseline(script);
  }, []);

  const recordGenerationSaved = useCallback((saved: SavedScript) => {
    const nextLineage: LineageState = { rootId: saved.id, lastVersion: 1 };
    lineageRef.current = nextLineage;
    setLineageState(nextLineage);
    sessionHistoryNameRef.current = saved.name;
    setExportTitle(saved.name);
    setExportCreatedAt(saved.createdAt);
    setHistoryLineageReady(true);
  }, []);

  const recordRefinementSaved = useCallback(
    (saved: SavedScript, finalScript: string, onRefinePanelReset: () => void) => {
      const lineage = lineageRef.current;
      if (!lineage) return;
      const nextVersion = lineage.lastVersion + 1;
      const nextLineage: LineageState = {
        rootId: lineage.rootId,
        lastVersion: nextVersion,
      };
      lineageRef.current = nextLineage;
      setLineageState(nextLineage);
      setScriptCompareBaseline(finalScript);
      onRefinePanelReset();
    },
    [],
  );

  const resetLineageForGenerate = useCallback(() => {
    setHistoryLineageReady(false);
    setExportTitle('');
    setExportCreatedAt(null);
    lineageRef.current = null;
    setLineageState(null);
    setScriptCompareBaseline(null);
  }, []);

  const applyLoadedScript = useCallback(
    (entry: SavedScript, plan: string, callbacks: ApplyLoadedScriptCallbacks) => {
      callbacks.setStrategy(entry.prompt);
      callbacks.setBalance(entry.balance);
      let model =
        entry.model && MODEL_IDS.has(entry.model) ? entry.model : DEFAULT_MODEL;
      if (plan !== 'pro' && model !== DEFAULT_MODEL) {
        model = DEFAULT_MODEL;
      }
      callbacks.setSelectedModel(model);
      callbacks.setStructuredInputs({
        market: entry.market,
        timeframe: entry.timeframe,
        direction: entry.direction,
        indicators: entry.indicators,
        rr: entry.rr,
      });
      callbacks.setGeneratedScript(entry.script);
      callbacks.setActivePreset(null);
      callbacks.setCopied(false);
      callbacks.setGenElapsed(null);
      callbacks.setGenStartTime(null);
      const nextLineage: LineageState = {
        rootId: entry.parentId ?? entry.id,
        lastVersion: entry.version,
      };
      lineageRef.current = nextLineage;
      setLineageState(nextLineage);
      sessionHistoryNameRef.current = entry.name;
      setExportTitle(entry.name);
      setExportCreatedAt(entry.createdAt);
      setHistoryLineageReady(true);
      setScriptCompareBaseline(entry.script);
      callbacks.setOutputTab('script');
      callbacks.resetPanelKeys();
      // Spec 60: surface saved assumptions for the loaded script in Breakdown tab
      callbacks.setAssumptions?.(entry.assumptions ?? null);
    },
    [],
  );

  const getLineageRef = useCallback(() => lineageRef.current, []);

  const getSessionHistoryName = useCallback(() => sessionHistoryNameRef.current, []);

  return {
    lineageState,
    historyLineageReady,
    scriptCompareBaseline,
    exportTitle,
    exportCreatedAt,
    recordGenerationSaved,
    recordRefinementSaved,
    resetLineageForGenerate,
    applyLoadedScript,
    getLineageRef,
    getSessionHistoryName,
    markCompareBaseline,
  };
}
