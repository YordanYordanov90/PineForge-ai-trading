'use client';

import { useRef, useState } from 'react';
import type { SavedScript } from '@/lib/types';
import { useStrategyOutputTabGuards } from '@/hooks/strategy/useStrategyOutputTabGuards';
import { useStrategyKeyboardShortcuts } from '@/hooks/strategy/useStrategyKeyboardShortcuts';
import { useStrategyOutputResets } from '@/hooks/strategy/useStrategyOutputResets';
import { useStrategyRefineSession } from '@/hooks/strategy/useStrategyRefineSession';
import { useStrategyOutputActions } from '@/hooks/strategy/useStrategyOutputActions';
import { useStrategyGenerationCore } from '@/hooks/strategy/useStrategyGenerationCore';
import type { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import type { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';

type FormInputs = ReturnType<typeof useStrategyFormInputs>;
type LineageSync = ReturnType<typeof useStrategyLineageSync>;

type UseStrategyGenerationSessionOptions = {
  inputs: FormInputs;
  lineage: LineageSync;
  entries: readonly SavedScript[];
  addEntry: (entry: SavedScript) => Promise<SavedScript | undefined>;
};

export function useStrategyGenerationSession({
  inputs,
  lineage,
  entries,
  addEntry,
}: UseStrategyGenerationSessionOptions) {
  const outputRef = useRef<HTMLDivElement>(null);
  const [webhookPanelOpen, setWebhookPanelOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  const refine = useStrategyRefineSession();
  const resets = useStrategyOutputResets();

  const core = useStrategyGenerationCore({
    inputs,
    lineage,
    entries,
    addEntry,
    outputRef,
    setOutputTab: resets.setOutputTab,
    resetPanelKeys: resets.resetPanelKeys,
    setWebhookPanelOpen,
    bumpRefineResetKey: refine.bumpRefineResetKey,
  });

  useStrategyOutputTabGuards({
    outputTab: resets.outputTab,
    onOutputTabChange: resets.setOutputTab,
    compareAvailable: core.compare.compareAvailable,
    generatedScript: core.generatedScript,
  });

  const actions = useStrategyOutputActions({
    generatedScript: core.generatedScript,
    outputRef,
  });

  useStrategyKeyboardShortcuts({
    commandOpen,
    onCommandOpenChange: setCommandOpen,
    onGenerate: core.handleGenerate,
    onOpenInTradingView: actions.handleOpenInTradingView,
    generatedScript: core.generatedScript,
    isOutputBusy: core.isOutputBusy,
  });

  const isStreaming = core.isOutputBusy && Boolean(core.generatedScript);
  const isIdle = !core.isOutputBusy && !core.generatedScript;

  return {
    outputRef,
    generatedScript: core.generatedScript,
    setGeneratedScript: core.setGeneratedScript,
    generationError: core.generationError,
    isGenerating: core.isGenerating,
    isRefining: core.isRefining,
    isOutputBusy: core.isOutputBusy,
    genElapsed: core.genElapsed,
    stop: core.stop,
    copied: actions.copied,
    refineResetKey: refine.refineResetKey,
    refinePrefillInstruction: refine.refinePrefillInstruction,
    refinePrefillNonce: refine.refinePrefillNonce,
    outputTab: resets.outputTab,
    setOutputTab: resets.setOutputTab,
    explainCancelKey: resets.explainCancelKey,
    healthScoreResetKey: resets.healthScoreResetKey,
    backtestSummaryResetKey: resets.backtestSummaryResetKey,
    alertTemplatesResetKey: resets.alertTemplatesResetKey,
    webhookPanelOpen,
    setWebhookPanelOpen,
    webhookUrl,
    setWebhookUrl,
    commandOpen,
    setCommandOpen,
    canGenerate: core.canGenerate,
    canImprove: core.canImprove,
    validationResult: core.validationResult,
    handleGeneratedScriptChange: core.handleGeneratedScriptChange,
    handlePrefillRefine: refine.handlePrefillRefine,
    handleGenerate: core.handleGenerate,
    handleRefine: core.handleRefine,
    handleCopy: actions.handleCopy,
    handleDownload: actions.handleDownload,
    handleOpenInTradingView: actions.handleOpenInTradingView,
    compare: core.compare,
    isStreaming,
    isIdle,
    resetPanelKeys: resets.resetPanelKeys,
    setCopied: actions.setCopied,
    setGenElapsed: core.setGenElapsed,
    setGenStartTime: core.setGenStartTime,
  };
}
