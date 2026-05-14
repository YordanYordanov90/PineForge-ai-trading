'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { messageFromApiErrorJson } from '@/lib/message-from-api-error';
import type { GrokModelId } from '@/lib/types';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';

type GeneratePayload = {
  prompt: string;
  balance: string;
  model: GrokModelId;
  structuredInputs: StructuredInputsValue;
};

type UseScriptGenerationOptions = {
  onGenerationComplete?: (script: string, payload: GeneratePayload) => void;
  onRefineComplete?: (script: string) => void;
  onChunk?: () => void;
};

export function useScriptGeneration(options: UseScriptGenerationOptions = {}) {
  const abortRef = useRef<AbortController | null>(null);
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [genElapsed, setGenElapsed] = useState<number | null>(null);

  const isOutputBusy = isGenerating || isRefining;

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(
    async (payload: GeneratePayload) => {
      setGeneratedScript('');
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
          toast.error(
            messageFromApiErrorJson(
              maybeJson,
              'Invalid input. Please check your fields.',
              'Request failed. Please try again.',
            ),
          );
          return;
        }

        if (!res.body) {
          finalScript = await res.text();
          setGeneratedScript(finalScript);
          setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            finalScript += chunk;
            setGeneratedScript((prev) => prev + chunk);
            options.onChunk?.();
          }
        }

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
          options.onGenerationComplete?.(finalScript, payload);
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
          toast.error(
            messageFromApiErrorJson(
              maybeJson,
              'Invalid input. Please check your refinement.',
              'Request failed. Please try again.',
            ),
          );
          setGeneratedScript(previousScript);
          return;
        }

        if (!res.body) {
          finalScript = await res.text();
          setGeneratedScript(finalScript);
          setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
          refineSucceeded = true;
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            finalScript += chunk;
            setGeneratedScript((prev) => prev + chunk);
            options.onChunk?.();
          }
        }

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
          options.onRefineComplete?.(finalScript);
        }
      }
    },
    [options],
  );

  return {
    generatedScript,
    setGeneratedScript,
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
  };
}
