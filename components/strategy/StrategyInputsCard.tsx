'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PromptTemplates } from '@/components/strategy/PromptTemplates';
import { ModelSelector } from '@/components/strategy/ModelSelector';
import { StructuredInputs } from '@/components/strategy/StructuredInputs';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import {
  MAX_PROMPT_LENGTH,
  CHAR_WARNING_THRESHOLD,
  CHAR_DANGER_THRESHOLD,
  type GrokModel,
} from '@/lib/config/constants';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useFormatShortcut } from '@/hooks/useShortcutLabel';
import { pfImprovePromptBtn } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';
import {
  evaluatePromptHealth,
  PROMPT_HEALTH_STYLES,
} from '@/lib/prompt/prompt-health';

type StrategyInputsCardProps = {
  strategy: string;
  onStrategyChange: (value: string) => void;
  balance: string;
  onBalanceChange: (value: string) => void;
  activePreset: string | null;
  onPresetSelect: (prompt: string, presetId: string) => void;
  selectedModel: GrokModel['id'];
  onModelChange: (model: GrokModel['id']) => void;
  structuredInputs: StructuredInputsValue;
  onStructuredInputsChange: (value: StructuredInputsValue) => void;
  canGenerate: boolean;
  isGenerating: boolean;
  isOutputBusy: boolean;
  isImproving: boolean;
  onGenerate: () => void;
  onImprovePrompt: () => void;
};

export function StrategyInputsCard({
  strategy,
  onStrategyChange,
  balance,
  onBalanceChange,
  activePreset,
  onPresetSelect,
  selectedModel,
  onModelChange,
  structuredInputs,
  onStructuredInputsChange,
  canGenerate,
  isGenerating,
  isOutputBusy,
  isImproving,
  onGenerate,
  onImprovePrompt,
}: StrategyInputsCardProps) {
  const charCount = strategy.length;
  const promptHealth = evaluatePromptHealth(strategy);
  const healthStyles = PROMPT_HEALTH_STYLES[promptHealth.level];
  const charColor =
    charCount > CHAR_DANGER_THRESHOLD
      ? 'text-rose-400'
      : charCount > CHAR_WARNING_THRESHOLD
        ? 'text-amber-400'
        : 'text-zinc-500';
  const improveReady = Boolean(strategy.trim()) && !isOutputBusy && !isImproving;
  const improveBusy = Boolean(strategy.trim()) && isImproving;
  const generateReady = canGenerate && !isOutputBusy;
  const generateShortcut = useFormatShortcut('enter');
  const commandShortcut = useFormatShortcut('k');

  return (
    <Card className="pf-card">
      <CardHeader className="p-4 sm:p-5">
        <CardTitle className="text-xl">Inputs</CardTitle>
        <CardDescription className="pf-muted">
          Tight prompt in, clean script out. Include timeframe, market, triggers, and invalidation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        <PromptTemplates activePreset={activePreset} onSelect={onPresetSelect} />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="strategy">Strategy description</Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  healthStyles.badge,
                )}
                title={promptHealth.hint}
                aria-label={`Prompt quality: ${promptHealth.label}. ${promptHealth.hint}`}
              >
                <span
                  className={cn('h-1.5 w-1.5 shrink-0 rounded-full', healthStyles.dot)}
                  aria-hidden
                />
                {promptHealth.label}
              </span>
              <span className={`text-xs tabular-nums ${charColor}`} aria-live="polite">
                {charCount} / {MAX_PROMPT_LENGTH}
              </span>
            </div>
          </div>
          <Textarea
            id="strategy"
            placeholder="Example: 5m momentum breakout. Only trade stocks with premarket high > 2% and RVOL > 2. Entry on break of HOD with pullback confirmation. Stop below last higher low; TP at 2R + trail after 1R..."
            value={strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            rows={8}
            className="pf-input resize-none leading-relaxed"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex flex-col gap-1 sm:min-w-0 sm:flex-1">
              {charCount > MAX_PROMPT_LENGTH && (
                <p className="text-xs text-rose-400 font-medium animate-fade-in">
                  Prompt is too long. Please reduce it to under {MAX_PROMPT_LENGTH} characters.
                </p>
              )}
              <p className="pf-muted text-xs">
                Tip: mention exact alert conditions (e.g. &ldquo;Average&rdquo; vs &ldquo;Strong&rdquo; trigger).{' '}
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {generateShortcut}
                </kbd>{' '}
                to generate ·{' '}
                <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {commandShortcut}
                </kbd>{' '}
                for commands
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onImprovePrompt}
              disabled={!strategy.trim() || isOutputBusy}
              aria-busy={isImproving}
              className={cn(
                'motion-btn-press shrink-0 self-end sm:self-start',
                pfImprovePromptBtn,
                improveReady &&
                  'animate-pulse-glow shadow-[0_0_22px_-5px_rgba(200,255,0,0.45)] hover:shadow-[0_0_28px_-4px_rgba(200,255,0,0.55)]',
                improveBusy &&
                  'pointer-events-none cursor-wait animate-border-glow border-neon-400/60 bg-neon-500/15 shadow-[0_0_32px_-4px_rgba(200,255,0,0.5)]',
              )}
            >
              {isImproving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Improving…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Improve My Prompt
                </span>
              )}
            </Button>
          </div>
        </div>

        <ModelSelector selectedModel={selectedModel} onSelect={onModelChange} />

        <StructuredInputs value={structuredInputs} onChange={onStructuredInputsChange} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="balance">Account balance</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                $
              </span>
              <Input
                id="balance"
                inputMode="decimal"
                placeholder="12,450"
                value={balance}
                onChange={(e) => onBalanceChange(e.target.value)}
                className="pf-input pl-7 font-mono"
              />
            </div>
            <p className="text-xs text-zinc-400">Numbers only. Used for position sizing.</p>
          </div>

          <div className="flex items-end">
            <TooltipProvider>
              <ActionTooltip
                label="Generate Pine Script"
                shortcut="enter"
                wrapDisabled
                triggerClassName="w-full"
              >
                <Button
                  type="button"
                  onClick={onGenerate}
                  disabled={!canGenerate}
                  size="lg"
                  className={cn(
                    'motion-btn-press w-full bg-neon-500 text-zinc-950 hover:bg-neon-400 disabled:opacity-60',
                    generateReady && 'motion-ready-generate',
                  )}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </span>
                  ) : (
                    'Generate Pine Script'
                  )}
                </Button>
              </ActionTooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
