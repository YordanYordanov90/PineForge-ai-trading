'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import type { BacktestSummaryResult } from '@/lib/api/validation';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';

export type BacktestSummaryPhase = 'empty' | 'loading' | 'success' | 'error';

export type BacktestSummaryRunInput = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
};

type BacktestSummaryApiResponse = {
  success: boolean;
  data: BacktestSummaryResult | null;
  error: string | null;
};

/**
 * Frontend state + request hook for `POST /api/backtesting-summary`.
 *
 * Mirrors the `useHealthScore` / `useAlertTemplates` shape so the output panels
 * can compose all three the same way. Stale results clear via `resetKey` —
 * bumped by the generator shell on generate/refine/history-load.
 */
export function useBacktestSummary(resetKey: number) {
  const [phase, setPhase] = useState<BacktestSummaryPhase>('empty');
  const [result, setResult] = useState<BacktestSummaryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    inFlightRef.current = false;
    setPhase('empty');
    setResult(null);
    setErrorMessage(null);
  }, [resetKey]);

  const run = useCallback(async (input: BacktestSummaryRunInput) => {
    const trimmedScript = input.script.trim();
    const trimmedPrompt = input.prompt.trim();
    if (!trimmedScript || !trimmedPrompt || inFlightRef.current) return;

    inFlightRef.current = true;
    setPhase('loading');
    setErrorMessage(null);

    const { structuredInputs } = input;

    try {
      const res = await fetch('/api/backtesting-summary', {
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
              : 'Backtesting summary request failed. Please try again.';
        setErrorMessage(
          messageFromApiErrorJson(maybeJson, 'Invalid input.', fallback),
        );
        setPhase('error');
        return;
      }

      const payload = maybeJson as BacktestSummaryApiResponse;
      if (!payload.success || !payload.data) {
        setErrorMessage(
          payload.error?.trim() ||
            'Backtesting summary could not be completed. Please try again.',
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
