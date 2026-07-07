'use client';

import { useEffect, useState } from 'react';
import type { GenerationRateLimitError } from '@/hooks/useScriptGeneration';

type UseStrategySuccessPulseOptions = {
  isGenerating: boolean;
  isRefining: boolean;
  generatedScript: string;
  generationError: GenerationRateLimitError | null;
};

export function useStrategySuccessPulse({
  isGenerating,
  isRefining,
  generatedScript,
  generationError,
}: UseStrategySuccessPulseOptions) {
  const [successPulse, setSuccessPulse] = useState(false);
  const [prevIsGenerating, setPrevIsGenerating] = useState(isGenerating);

  if (prevIsGenerating !== isGenerating) {
    setPrevIsGenerating(isGenerating);
    const finishedGenerate =
      prevIsGenerating &&
      !isGenerating &&
      !isRefining &&
      Boolean(generatedScript.trim()) &&
      !generationError;
    if (finishedGenerate && !successPulse) setSuccessPulse(true);
  }

  useEffect(() => {
    if (!successPulse) return;
    const timer = window.setTimeout(() => setSuccessPulse(false), 720);
    return () => window.clearTimeout(timer);
  }, [successPulse]);

  return successPulse;
}