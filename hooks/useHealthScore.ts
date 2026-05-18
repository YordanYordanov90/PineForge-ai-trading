'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import type { HealthScoreResult } from '@/lib/api/validation';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';

export type HealthScorePhase = 'empty' | 'loading' | 'success' | 'error';

export type HealthScoreRunInput = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
};

type HealthScoreApiResponse = {
  success: boolean;
  data: HealthScoreResult | null;
  error: string | null;
};

export function useHealthScore(resetKey: number) {
  const [phase, setPhase] = useState<HealthScorePhase>('empty');
  const [result, setResult] = useState<HealthScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    inFlightRef.current = false;
    setPhase('empty');
    setResult(null);
    setErrorMessage(null);
  }, [resetKey]);

  const run = useCallback(async (input: HealthScoreRunInput) => {
    const trimmedScript = input.script.trim();
    const trimmedPrompt = input.prompt.trim();
    if (!trimmedScript || !trimmedPrompt || inFlightRef.current) return;

    inFlightRef.current = true;
    setPhase('loading');
    setErrorMessage(null);

    const { structuredInputs } = input;

    try {
      const res = await fetch('/api/health-score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          script: trimmedScript,
          model: input.model,
          balance: input.balance.trim() || null,
          market: structuredInputs.market ?? null,
          timeframe: structuredInputs.timeframe ?? null,
          direction: structuredInputs.direction ?? null,
          indicators: structuredInputs.indicators,
        }),
      });

      const maybeJson: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const fallback =
          res.status === 403
            ? 'Premium models require a Pro plan.'
            : res.status === 429
              ? 'Too many requests. Please try again in a moment.'
              : 'Health score request failed. Please try again.';
        setErrorMessage(
          messageFromApiErrorJson(maybeJson, 'Invalid input.', fallback),
        );
        setPhase('error');
        return;
      }

      const payload = maybeJson as HealthScoreApiResponse;
      if (!payload.success || !payload.data) {
        setErrorMessage(
          payload.error?.trim() ||
            'Health score could not be completed. Please try again.',
        );
        setPhase('error');
        return;
      }

      setResult(payload.data);
      setPhase('success');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setPhase('error');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  return {
    phase,
    result,
    errorMessage,
    run,
    isLoading: phase === 'loading',
  };
}
