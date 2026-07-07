'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { SavedScript } from '@/lib/types';
import type { VariantCardData } from '@/components/strategy/VariantCard';
import {
  buildSavedScriptFromGeneration,
  buildSavedScriptFromRefinement,
} from '@/hooks/useScriptHistory';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import type { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import type { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';
import type { useStrategyOutputResets } from '@/hooks/strategy/useStrategyOutputResets';

type FormInputs = ReturnType<typeof useStrategyFormInputs>;
type LineageSync = ReturnType<typeof useStrategyLineageSync>;
type OutputResets = ReturnType<typeof useStrategyOutputResets>;

type UseStrategyVariantsOptions = {
  inputs: FormInputs;
  lineage: LineageSync;
  resets: OutputResets;
  generatedScript: string;
  setGeneratedScript: (script: string) => void;
  addEntry: (entry: SavedScript) => Promise<SavedScript | undefined>;
};

export function useStrategyVariants({
  inputs,
  lineage,
  resets,
  generatedScript,
  setGeneratedScript,
  addEntry,
}: UseStrategyVariantsOptions) {
  const [variants, setVariants] = useState<VariantCardData[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);

  const clearVariants = useCallback(() => {
    setVariants([]);
    setVariantsOpen(false);
    setIsGeneratingVariants(false);
  }, []);

  const generateVariants = useCallback(async () => {
    const script = generatedScript.trim();
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
        toast.error(
          messageFromApiErrorJson(
            maybeJson,
            'Variant generation failed. Please try again.',
            'Variant generation failed. Please try again.',
          ),
        );
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      const variantsData =
        (data as { data?: { variants?: VariantCardData[] } })?.data?.variants ?? [];
      if (Array.isArray(variantsData) && variantsData.length > 0) {
        setVariants(variantsData as VariantCardData[]);
        setVariantsOpen(true);
      } else {
        toast.error('No variants were returned. Try again.');
      }
    } catch {
      toast.error('Network error while generating variants.');
    } finally {
      setIsGeneratingVariants(false);
    }
  }, [generatedScript, inputs.strategy, inputs.selectedModel, inputs.balance, inputs.structuredInputs]);

  const loadVariant = useCallback(
    async (variant: VariantCardData) => {
      setGeneratedScript(variant.script);
      resets.setOutputTab('script');

      const lineageRef = lineage.getLineageRef?.() ?? lineage.lineageState;
      const parentId = lineageRef?.rootId;
      const baseVersion = lineageRef?.lastVersion ?? 1;
      const parentName =
        lineage.exportTitle || inputs.strategy.slice(0, 40) || 'Untitled strategy';
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

      toast.success(`Loaded ${variant.label}`);
    },
    [
      setGeneratedScript,
      resets,
      lineage,
      inputs.strategy,
      inputs.balance,
      inputs.selectedModel,
      inputs.structuredInputs,
      addEntry,
    ],
  );

  return {
    variants,
    isGeneratingVariants,
    variantsOpen,
    setVariantsOpen,
    generateVariants,
    loadVariant,
    clearVariants,
  };
}