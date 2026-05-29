'use client';

import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SavedScript } from '@/lib/types';
import { useStrategyOutputTabGuards } from '@/hooks/strategy/useStrategyOutputTabGuards';
import { useStrategyKeyboardShortcuts } from '@/hooks/strategy/useStrategyKeyboardShortcuts';
import { useStrategyOutputResets } from '@/hooks/strategy/useStrategyOutputResets';
import { useStrategyRefineSession } from '@/hooks/strategy/useStrategyRefineSession';
import { useStrategyOutputActions } from '@/hooks/strategy/useStrategyOutputActions';
import { useStrategyGenerationCore } from '@/hooks/strategy/useStrategyGenerationCore';
import type { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import type { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';
import {
  buildSavedScriptFromGeneration,
  buildSavedScriptFromRefinement,
} from '@/hooks/useScriptHistory';
import type { VariantCardData } from '@/components/strategy/VariantCard';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';

type FormInputs = ReturnType<typeof useStrategyFormInputs>;
type LineageSync = ReturnType<typeof useStrategyLineageSync>;

type UseStrategyGenerationSessionOptions = {
  inputs: FormInputs;
  lineage: LineageSync;
  entries: readonly SavedScript[];
  addEntry: (entry: SavedScript) => Promise<SavedScript | undefined>;
  plan?: string;
};

export function useStrategyGenerationSession({
  inputs,
  lineage,
  entries,
  addEntry,
  plan,
}: UseStrategyGenerationSessionOptions) {
  const outputRef = useRef<HTMLDivElement>(null);
  const [webhookPanelOpen, setWebhookPanelOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  // Spec 64: Variants quick-generate state (controlled by this session)
  const [variants, setVariants] = useState<VariantCardData[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);

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

  // --- Spec 64 Variant generation + load (kept inside session per feature spec) ---
  const generateVariants = useCallback(async () => {
    const script = core.generatedScript.trim();
    if (!script) return;

    const prompt = inputs.strategy.trim();
    if (!prompt) {
      toast.error('No strategy prompt available for variants.');
      return;
    }

    setIsGeneratingVariants(true);
    setVariants([]);
    setVariantsOpen(true);

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt,
          script,
          model: inputs.selectedModel,
          balance: inputs.balance || null,
          structuredInputs: inputs.structuredInputs,
        }),
      });

      if (!res.ok) {
        const maybeJson: unknown = await res.json().catch(() => null);
        const msg = messageFromApiErrorJson(
          maybeJson,
          'Variant generation failed. Please try again.',
          'Variant generation failed. Please try again.',
        );
        toast.error(msg);
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      const variantsData = (data as { data?: { variants?: VariantCardData[] } })?.data?.variants ?? [];
      if (Array.isArray(variantsData) && variantsData.length > 0) {
        setVariants(variantsData as VariantCardData[]);
        setVariantsOpen(true);
      } else {
        toast.error('No variants were returned. Try again.');
      }
    } catch (e) {
      toast.error('Network error while generating variants.');
    } finally {
      setIsGeneratingVariants(false);
    }
  }, [core.generatedScript, inputs.strategy, inputs.selectedModel, inputs.balance, inputs.structuredInputs]);

  const loadVariant = useCallback(
    async (variant: VariantCardData) => {
      // Copy variant script into main output (does not change the high-level prompt textarea)
      core.setGeneratedScript(variant.script);
      resets.setOutputTab('script');

      // Create history entry with lineage + variantAxis metadata (spec 64)
      const lineageRef = lineage.getLineageRef?.() ?? lineage.lineageState;
      const parentId = lineageRef?.rootId;
      const baseVersion = lineageRef?.lastVersion ?? 1;
      const parentName = lineage.exportTitle || inputs.strategy.slice(0, 40) || 'Untitled strategy';

      const variantName = `${parentName} — ${variant.label}`;
      const entry = parentId
        ? buildSavedScriptFromRefinement({
            name: variantName,
            prompt: inputs.strategy,
            balance: inputs.balance,
            script: variant.script,
            model: inputs.selectedModel,
            version: baseVersion + 1,
            parentId,
            market: inputs.structuredInputs.market ?? undefined,
            timeframe: inputs.structuredInputs.timeframe ?? undefined,
            direction: inputs.structuredInputs.direction ?? undefined,
            indicators: inputs.structuredInputs.indicators ?? undefined,
            rr: inputs.structuredInputs.rr ?? undefined,
            variantAxis: variant.axis,
          })
        : buildSavedScriptFromGeneration({
            prompt: variant.prompt || inputs.strategy,
            balance: inputs.balance,
            script: variant.script,
            model: inputs.selectedModel,
            market: inputs.structuredInputs.market ?? undefined,
            timeframe: inputs.structuredInputs.timeframe ?? undefined,
            direction: inputs.structuredInputs.direction ?? undefined,
            indicators: inputs.structuredInputs.indicators ?? undefined,
            rr: inputs.structuredInputs.rr ?? undefined,
            variantAxis: variant.axis,
          });

      if (!parentId) {
        entry.name = variantName;
      }

      try {
        const saved = await addEntry(entry);
        if (saved) {
          if (parentId) {
            lineage.recordRefinementSaved?.(saved, variant.script, resets.resetPanelKeys);
          } else {
            lineage.recordGenerationSaved?.(saved);
          }
        }
      } catch {
        // addEntry already toasts on failure paths
      }

      // Close refine prefill if any, surface success
      toast.success(`Loaded ${variant.label}`);
    },
    [
      core.setGeneratedScript,
      resets,
      lineage,
      inputs.strategy,
      inputs.balance,
      inputs.selectedModel,
      inputs.structuredInputs,
      addEntry,
    ],
  );

  // Clear variant strip state on any fresh generation or history-driven reset
  const handleGenerate = useCallback(() => {
    setVariants([]);
    setVariantsOpen(false);
    setIsGeneratingVariants(false);
    core.handleGenerate();
  }, [core.handleGenerate]);

  useStrategyKeyboardShortcuts({
    commandOpen,
    onCommandOpenChange: setCommandOpen,
    onGenerate: handleGenerate,
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
    // Spec 60
    assumptions: core.assumptions,
    setAssumptions: core.setAssumptions,
    // Spec 64
    variants,
    isGeneratingVariants,
    variantsOpen,
    setVariantsOpen,
    generateVariants,
    loadVariant,
    plan,
  };
}
