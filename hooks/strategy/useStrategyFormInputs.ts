'use client';

import { useCallback, useState } from 'react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import { DEFAULT_MODEL } from '@/lib/config/constants';
import type { GrokModel } from '@/lib/config/constants';
import { usePromptImprover } from '@/hooks/usePromptImprover';

export type StrategyGenerationPayload = {
  prompt: string;
  balance: string;
  model: GrokModel['id'];
  structuredInputs: StructuredInputsValue;
};

export function useStrategyFormInputs() {
  const [strategy, setStrategy] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedModel, setSelectedModel] = useState<GrokModel['id']>(DEFAULT_MODEL);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [structuredInputs, setStructuredInputs] = useState<StructuredInputsValue>({});

  const { isImproving, handleImprovePrompt } = usePromptImprover({
    onSuccess: setStrategy,
  });

  const getGenerationPayload = useCallback(
    (): StrategyGenerationPayload => ({
      prompt: strategy,
      balance,
      model: selectedModel,
      structuredInputs,
    }),
    [strategy, balance, selectedModel, structuredInputs],
  );

  const handlePresetSelect = useCallback((prompt: string, presetId: string) => {
    setStrategy(prompt);
    setActivePreset(presetId);
  }, []);

  const handleStrategyChange = useCallback((value: string) => {
    setStrategy(value);
    setActivePreset(null);
  }, []);

  const handleSuggestionClick = useCallback((prompt: string) => {
    setStrategy(prompt);
    setActivePreset(null);
    window.setTimeout(() => {
      const el = document.getElementById('strategy');
      if (!(el instanceof HTMLTextAreaElement)) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }, 0);
  }, []);

  const onImprovePrompt = useCallback(() => {
    void handleImprovePrompt(strategy, structuredInputs);
  }, [handleImprovePrompt, strategy, structuredInputs]);

  const clearActivePreset = useCallback(() => {
    setActivePreset(null);
  }, []);

  return {
    strategy,
    balance,
    selectedModel,
    activePreset,
    structuredInputs,
    isImproving,
    setBalance,
    setSelectedModel,
    setActivePreset,
    setStructuredInputs,
    setStrategy,
    getGenerationPayload,
    handlePresetSelect,
    handleStrategyChange,
    handleSuggestionClick,
    onImprovePrompt,
    clearActivePreset,
  };
}
