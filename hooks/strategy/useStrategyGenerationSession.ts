'use client';

import { useRef, useState, useCallback } from 'react';
import type { SavedScript } from '@/lib/types';
import { useStrategyOutputTabGuards } from '@/hooks/strategy/useStrategyOutputTabGuards';
import { useStrategyKeyboardShortcuts } from '@/hooks/strategy/useStrategyKeyboardShortcuts';
import { useGeneratorShortcuts } from '@/hooks/strategy/useGeneratorShortcuts';
import { useStrategyOutputResets } from '@/hooks/strategy/useStrategyOutputResets';
import { useStrategyRefineSession } from '@/hooks/strategy/useStrategyRefineSession';
import { useStrategyOutputActions } from '@/hooks/strategy/useStrategyOutputActions';
import { useStrategyGenerationCore } from '@/hooks/strategy/useStrategyGenerationCore';
import { useStrategyVariants } from '@/hooks/strategy/useStrategyVariants';
import type { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import type { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';

type FormInputs = ReturnType<typeof useStrategyFormInputs>;
type LineageSync = ReturnType<typeof useStrategyLineageSync>;

type UseStrategyGenerationSessionOptions = {
  inputs: FormInputs;
  lineage: LineageSync;
  entries: readonly SavedScript[];
  addEntry: (entry: SavedScript) => Promise<SavedScript | undefined>;
  plan?: string;
  onOpenHistory?: () => void;
};

export function useStrategyGenerationSession({
  inputs,
  lineage,
  entries,
  addEntry,
  plan,
  onOpenHistory,
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

  const variants = useStrategyVariants({
    inputs,
    lineage,
    resets,
    generatedScript: core.generatedScript,
    setGeneratedScript: core.setGeneratedScript,
    addEntry,
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

  const handleGenerate = useCallback(() => {
    variants.clearVariants();
    core.handleGenerate();
    // core.handleGenerate is a stable useCallback ref — whole `core` would over-invalidate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.clearVariants, core.handleGenerate]);

  useStrategyKeyboardShortcuts({
    commandOpen,
    onCommandOpenChange: setCommandOpen,
    onGenerate: handleGenerate,
    onOpenInTradingView: actions.handleOpenInTradingView,
    generatedScript: core.generatedScript,
    isOutputBusy: core.isOutputBusy,
  });

  useGeneratorShortcuts({
    setOutputTab: resets.setOutputTab,
    compareAvailable: core.compare.compareAvailable,
    onOpenHistory,
    onDownload: actions.handleDownload,
    onStop: core.stop,
    isOutputBusy: core.isOutputBusy,
    bumpHealthScore: resets.bumpHealthScore,
    bumpBacktestSummary: resets.bumpBacktestSummary,
    bumpAlertTemplates: resets.bumpAlertTemplates,
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
    handleGenerate,
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
    assumptions: core.assumptions,
    setAssumptions: core.setAssumptions,
    variants: variants.variants,
    isGeneratingVariants: variants.isGeneratingVariants,
    variantsOpen: variants.variantsOpen,
    setVariantsOpen: variants.setVariantsOpen,
    generateVariants: variants.generateVariants,
    loadVariant: variants.loadVariant,
    plan,
    bumpHealthScore: resets.bumpHealthScore,
    bumpBacktestSummary: resets.bumpBacktestSummary,
    bumpAlertTemplates: resets.bumpAlertTemplates,
  };
}