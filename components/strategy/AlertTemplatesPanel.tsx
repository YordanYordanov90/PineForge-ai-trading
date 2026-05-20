'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import type { AlertTemplateProvider } from '@/lib/api/validation';
import { AlertTemplateCard } from '@/components/strategy/AlertTemplateCard';
import {
  useAlertTemplates,
  type AlertTemplatesRunInput,
} from '@/hooks/useAlertTemplates';
import { Button } from '@/components/ui/button';
import {
  pfOutputBody,
  pfOutputBorder,
  pfOutputMuted,
  pfOutputTitle,
  terminalRunButton,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type AlertTemplatesPanelProps = {
  prompt: string;
  script: string;
  model: GrokModel['id'];
  balance: string;
  structuredInputs: StructuredInputsValue;
  isScriptFinal: boolean;
  resetKey: number;
};

function buildRunInput(props: AlertTemplatesPanelProps): AlertTemplatesRunInput {
  return {
    prompt: props.prompt,
    script: props.script,
    model: props.model,
    balance: props.balance,
    structuredInputs: props.structuredInputs,
  };
}

export function AlertTemplatesPanel({
  prompt,
  script,
  model,
  balance,
  structuredInputs,
  isScriptFinal,
  resetKey,
}: AlertTemplatesPanelProps) {
  const { phase, result, errorMessage, run, isLoading } = useAlertTemplates(resetKey);
  const [activeProvider, setActiveProvider] = useState<AlertTemplateProvider>('3commas');
  const canRun =
    isScriptFinal && Boolean(script.trim()) && Boolean((prompt ?? '').trim());

  const handleRun = () => {
    void run(
      buildRunInput({
        prompt,
        script,
        model,
        balance,
        structuredInputs,
        isScriptFinal,
        resetKey,
      }),
    );
  };

  if (!script.trim()) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Generate or load a script to create alert message templates.
      </p>
    );
  }

  if (!isScriptFinal) {
    return (
      <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
        Finish generating or refining to build webhook JSON templates.
      </p>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
          <Bell className="h-6 w-6 text-emerald-400" aria-hidden />
        </div>
        <div>
          <p className={cn('text-sm', pfOutputTitle)}>Alert Message Templates</p>
          <p className={cn('mt-1 max-w-sm text-sm', pfOutputMuted)}>
            Generate copy-ready webhook JSON for 3Commas, Alertatron, WunderTrading, or a custom
            receiver. Templates only — PineForge does not send alerts or store credentials.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canRun || isLoading}
          onClick={handleRun}
          className={terminalRunButton}
        >
          Generate Alert Templates
        </Button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="px-6 py-10" role="status" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" aria-hidden />
          <p className={cn('text-sm', pfOutputBody)}>Building provider templates…</p>
          <p className={cn('text-xs', pfOutputMuted)}>Usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="px-6 py-8" role="alert">
        <p className={cn('text-sm', pfOutputBody)}>
          {errorMessage ?? 'Could not generate alert templates.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-zinc-700"
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-h-[640px] overflow-auto px-6 py-6">
      <p className={cn('mb-4 text-xs', pfOutputMuted)}>
        Paste into TradingView alert message fields. Replace highlighted placeholders before live
        use. Not execution automation.
      </p>

      <div className="space-y-3">
        {result.templates.map((template) => (
          <AlertTemplateCard
            key={template.provider}
            template={template}
            isActive={activeProvider === template.provider}
            onSelect={() => setActiveProvider(template.provider)}
          />
        ))}
      </div>

      <div className={cn('mt-6 flex justify-end border-t pt-4', pfOutputBorder)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-300 text-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
          disabled={!canRun || isLoading}
          onClick={handleRun}
        >
          Regenerate templates
        </Button>
      </div>
    </div>
  );
}
