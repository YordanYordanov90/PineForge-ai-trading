'use client';

import { useEffect } from 'react';
import { HealthScoreEmptyState } from '@/components/strategy/HealthScoreEmptyState';
import { HealthScoreErrorState } from '@/components/strategy/HealthScoreErrorState';
import { HealthScoreLoadingState } from '@/components/strategy/HealthScoreLoadingState';
import { HealthScoreResultView } from '@/components/strategy/HealthScoreResultView';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import type { HealthScoreResult } from '@/lib/api/validation';
import { useHealthScore, type HealthScoreRunInput } from '@/hooks/useHealthScore';
import { pfOutputMuted } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type HealthScorePanelProps = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
  isScriptFinal: boolean;
  resetKey: number;
  onPrefillRefine?: (instruction: string) => void;
  /** Spec 50: surfaces loaded result for Markdown export. */
  onResultChange?: (result: HealthScoreResult | null) => void;
  /** Spec 60: passed through to the health-score request for assumption cross-reference. */
  assumptions?: import('@/lib/ai/parse-assumptions').StrategyAssumptions | null;
};

function buildRunInput(props: HealthScorePanelProps): HealthScoreRunInput {
  return {
    prompt: props.prompt,
    script: props.script,
    model: props.model,
    balance: props.balance,
    structuredInputs: props.structuredInputs,
  };
}

export function HealthScorePanel({
  prompt,
  script,
  model,
  balance,
  structuredInputs,
  isScriptFinal,
  resetKey,
  onPrefillRefine,
  onResultChange,
}: HealthScorePanelProps) {
  const { phase, result, errorMessage, run, isLoading } = useHealthScore(resetKey);

  useEffect(() => {
    onResultChange?.(phase === 'success' && result ? result : null);
  }, [phase, result, onResultChange]);

  const canRun =
    isScriptFinal && Boolean(script.trim()) && Boolean((prompt ?? '').trim());

  const handleRun = () => {
    void run(
      buildRunInput({ prompt, script, model, balance, structuredInputs, isScriptFinal, resetKey }),
    );
  };

  if (!script.trim()) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Generate or load a script to run a Health Score.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Finish generating or refining to analyze strategy health.
      </p>
    );
  }

  if (phase === 'empty') {
    return (
      <HealthScoreEmptyState canRun={canRun} isLoading={isLoading} onRun={handleRun} />
    );
  }

  if (phase === 'loading') {
    return <HealthScoreLoadingState />;
  }

  if (phase === 'error') {
    return (
      <HealthScoreErrorState
        errorMessage={errorMessage}
        canRun={canRun}
        isLoading={isLoading}
        onRun={handleRun}
      />
    );
  }

  if (!result) return null;

  return (
    <HealthScoreResultView
      result={result}
      canRun={canRun}
      isLoading={isLoading}
      onRun={handleRun}
      onPrefillRefine={onPrefillRefine}
    />
  );
}
