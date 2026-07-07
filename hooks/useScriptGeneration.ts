'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { GrokModelId } from '@/lib/types';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';
import {
  mapGenerationErrorStatus,
  mapRefineErrorStatus,
  type GenerationRateLimitError,
} from '@/lib/scripts/generation-errors';
import { finalizeStreamedScript } from '@/lib/scripts/finalize-streamed-script';
import { streamScriptResponse } from '@/lib/scripts/stream-script-response';

type GeneratePayload = {
  prompt: string;
  balance: string;
  model: GrokModelId;
  structuredInputs: StructuredInputsValue;
};

type UseScriptGenerationOptions = {
  onGenerationComplete?: (script: string, payload: GeneratePayload, assumptions: StrategyAssumptions | null) => void;
  onRefineComplete?: (script: string, assumptions: StrategyAssumptions | null) => void;
  onChunk?: () => void;
};

export type { GenerationRateLimitError };

export function useScriptGeneration(options: UseScriptGenerationOptions = {}) {
  const abortRef = useRef<AbortController | null>(null);
  const [generatedScript, setGeneratedScript] = useState('');
  const [generationError, setGenerationError] =
    useState<GenerationRateLimitError | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [genElapsed, setGenElapsed] = useState<number | null>(null);
  const [assumptions, setAssumptions] = useState<StrategyAssumptions | null>(null);

  const isOutputBusy = isGenerating || isRefining;

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(
    async (payload: GeneratePayload) => {
      setGeneratedScript('');
      setGenerationError(null);
      setIsGenerating(true);
      const startTime = Date.now();
      setGenStartTime(startTime);
      setGenElapsed(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let generationAborted = false;
      let finalScript = '';

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            prompt: payload.prompt,
            balance: payload.balance,
            model: payload.model,
            ...payload.structuredInputs,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const maybeJson: unknown = await res.json().catch(() => null);
          const mapped = mapGenerationErrorStatus(res.status, maybeJson);
          if (mapped.kind === 'rate_limit') {
            setGenerationError(mapped.error);
          } else {
            toast.error(mapped.message);
          }
          return;
        }

        finalScript = await streamScriptResponse(res, (chunk) => {
          setGeneratedScript((prev) => prev + chunk);
          options.onChunk?.();
        });
        setGeneratedScript(finalScript);
        setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          generationAborted = true;
          toast.message('Generation stopped.');
          setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
          return;
        }
        toast.error('Something went wrong while generating. Please try again.');
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
        if (!generationAborted && finalScript.trim()) {
          const { cleanScript, assumptions: extracted } = finalizeStreamedScript(finalScript);
          setGeneratedScript(cleanScript);
          setAssumptions(extracted);
          options.onGenerationComplete?.(cleanScript, payload, extracted);
        } else if (!generationAborted) {
          setAssumptions(null);
        }
      }
    },
    [options],
  );

  const refine = useCallback(
    async (params: { script: string; instruction: string; model: GrokModelId }) => {
      const previousScript = params.script;
      if (!previousScript.trim()) return;

      setGeneratedScript('');
      setIsRefining(true);
      const startTime = Date.now();
      setGenStartTime(startTime);
      setGenElapsed(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let refineAborted = false;
      let refineSucceeded = false;
      let finalScript = '';

      try {
        const res = await fetch('/api/refine-script', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            script: previousScript,
            instruction: params.instruction,
            model: params.model,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const maybeJson: unknown = await res.json().catch(() => null);
          toast.error(mapRefineErrorStatus(res.status, maybeJson));
          setGeneratedScript(previousScript);
          return;
        }

        finalScript = await streamScriptResponse(res, (chunk) => {
          setGeneratedScript((prev) => prev + chunk);
          options.onChunk?.();
        });
        setGeneratedScript(finalScript);
        setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
        refineSucceeded = true;
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          refineAborted = true;
          toast.message('Refinement stopped.');
          setGeneratedScript(previousScript);
          setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
          return;
        }
        toast.error('Something went wrong while refining. Please try again.');
        setGeneratedScript(previousScript);
      } finally {
        setIsRefining(false);
        abortRef.current = null;
        if (!refineAborted && refineSucceeded && finalScript.trim()) {
          const { cleanScript, assumptions: extracted } = finalizeStreamedScript(finalScript);
          setGeneratedScript(cleanScript);
          setAssumptions(extracted);
          options.onRefineComplete?.(cleanScript, extracted);
        } else if (!refineAborted) {
          setAssumptions(null);
        }
      }
    },
    [options],
  );

  return {
    generatedScript,
    setGeneratedScript,
    generationError,
    isGenerating,
    isRefining,
    isOutputBusy,
    genStartTime,
    setGenStartTime,
    genElapsed,
    setGenElapsed,
    stop,
    generate,
    refine,
    assumptions,
    setAssumptions,
  };
}