'use client';

import { useCallback, useMemo, type RefObject } from 'react';
import { toast } from 'sonner';
import { validateScript } from '@/components/strategy/ScriptOutput';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';
import {
  buildSavedScriptFromGeneration,
  buildSavedScriptFromRefinement,
} from '@/hooks/useScriptHistory';
import type { SavedScript } from '@/lib/types';
import { MAX_PROMPT_LENGTH } from '@/lib/config/constants';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { buildStrategyCompareState } from '@/lib/scripts/strategy-compare';
import type { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import type { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';

type FormInputs = ReturnType<typeof useStrategyFormInputs>;
type LineageSync = ReturnType<typeof useStrategyLineageSync>;

type UseStrategyGenerationCoreOptions = {
  inputs: FormInputs;
  lineage: LineageSync;
  entries: readonly SavedScript[];
  addEntry: (entry: SavedScript) => Promise<SavedScript | undefined>;
  outputRef: RefObject<HTMLDivElement | null>;
  setOutputTab: (tab: OutputTab) => void;
  resetPanelKeys: () => void;
  setWebhookPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  bumpRefineResetKey: () => void;
};

export function useStrategyGenerationCore({
  inputs,
  lineage,
  entries,
  addEntry,
  outputRef,
  setOutputTab,
  resetPanelKeys,
  setWebhookPanelOpen,
  bumpRefineResetKey,
}: UseStrategyGenerationCoreOptions) {
  const {
    generatedScript,
    setGeneratedScript,
    generationError,
    isGenerating,
    isRefining,
    isOutputBusy,
    setGenStartTime,
    genElapsed,
    setGenElapsed,
    stop,
    generate,
    refine,
    assumptions,
    setAssumptions,
  } = useScriptGeneration({
    onChunk: () => {
      requestAnimationFrame(() => {
        const panel = outputRef.current;
        if (panel) {
          panel.scrollTop = panel.scrollHeight;
        }
      });
    },
    onGenerationComplete: (finalScript, payload, extractedAssumptions) => {
      void (async () => {
        const entry = buildSavedScriptFromGeneration({
          prompt: payload.prompt,
          balance: payload.balance,
          script: finalScript,
          model: payload.model,
          market: payload.structuredInputs.market,
          timeframe: payload.structuredInputs.timeframe,
          direction: payload.structuredInputs.direction,
          indicators: payload.structuredInputs.indicators,
          rr: payload.structuredInputs.rr,
          assumptions: extractedAssumptions ?? null,
        });
        const saved = await addEntry(entry);
        lineage.markCompareBaseline(finalScript);
        if (!saved) return;
        lineage.recordGenerationSaved(saved);
      })();
    },
    onRefineComplete: (finalScript, extractedAssumptions) => {
      const lineageRef = lineage.getLineageRef();
      if (!lineageRef) return;
      const payload = inputs.getGenerationPayload();
      void (async () => {
        const saved = await addEntry(
          buildSavedScriptFromRefinement({
            name: lineage.getSessionHistoryName(),
            prompt: payload.prompt,
            balance: payload.balance,
            script: finalScript,
            model: payload.model,
            version: lineageRef.lastVersion + 1,
            parentId: lineageRef.rootId,
            market: payload.structuredInputs.market,
            timeframe: payload.structuredInputs.timeframe,
            direction: payload.structuredInputs.direction,
            indicators: payload.structuredInputs.indicators,
            rr: payload.structuredInputs.rr,
            assumptions: extractedAssumptions ?? null,
          }),
        );
        if (!saved) return;
        lineage.recordRefinementSaved(saved, finalScript, bumpRefineResetKey);
      })();
    },
  });

  const canGenerate =
    Boolean(inputs.strategy.trim()) &&
    Boolean(inputs.balance.trim()) &&
    !isOutputBusy &&
    inputs.strategy.length <= MAX_PROMPT_LENGTH;

  const canImprove = useMemo(
    () =>
      Boolean(inputs.strategy.trim()) && !isOutputBusy && !inputs.isImproving,
    [inputs.strategy, isOutputBusy, inputs.isImproving],
  );

  const validationResult: ValidationResult | null = useMemo(
    () => (!isOutputBusy && generatedScript ? validateScript(generatedScript) : null),
    [isOutputBusy, generatedScript],
  );

  const compare = useMemo(
    () =>
      buildStrategyCompareState({
        entries,
        lineageState: lineage.lineageState,
        historyLineageReady: lineage.historyLineageReady,
        generatedScript,
        scriptCompareBaseline: lineage.scriptCompareBaseline,
        isOutputBusy,
      }),
    [
      entries,
      lineage.lineageState,
      lineage.historyLineageReady,
      lineage.scriptCompareBaseline,
      generatedScript,
      isOutputBusy,
    ],
  );

  const handleGeneratedScriptChange = useCallback(
    (value: string) => {
      setGeneratedScript(value);
    },
    [setGeneratedScript],
  );

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setOutputTab('script');
    resetPanelKeys();
    lineage.resetLineageForGenerate();
    inputs.clearActivePreset();
    setWebhookPanelOpen(false);
    await generate(inputs.getGenerationPayload());
  }, [
    canGenerate,
    inputs,
    lineage,
    generate,
    resetPanelKeys,
    setOutputTab,
    setWebhookPanelOpen,
  ]);

  const handleRefine = useCallback(
    async (instruction: string) => {
      const lineageRef = lineage.getLineageRef();
      if (!lineageRef) {
        toast.error('Could not link refinement. Generate or load a script from History.');
        return;
      }
      const previousScript = generatedScript;
      if (!previousScript.trim()) return;

      setOutputTab('script');
      resetPanelKeys();
      setWebhookPanelOpen(false);
      await refine({
        script: previousScript,
        instruction,
        model: inputs.selectedModel,
      });
    },
    [
      generatedScript,
      inputs.selectedModel,
      lineage,
      refine,
      resetPanelKeys,
      setOutputTab,
      setWebhookPanelOpen,
    ],
  );

  return {
    generatedScript,
    setGeneratedScript,
    generationError,
    isGenerating,
    isRefining,
    isOutputBusy,
    genElapsed,
    stop,
    setGenElapsed,
    setGenStartTime,
    canGenerate,
    canImprove,
    validationResult,
    compare,
    handleGeneratedScriptChange,
    handleGenerate,
    handleRefine,
    // Spec 60
    assumptions,
    setAssumptions,
  };
}
