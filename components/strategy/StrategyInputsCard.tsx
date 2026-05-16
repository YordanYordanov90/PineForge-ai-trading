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
import { cn } from '@/lib/utils';

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
  const charColor =
    charCount > CHAR_DANGER_THRESHOLD
      ? 'text-rose-400'
      : charCount > CHAR_WARNING_THRESHOLD
        ? 'text-amber-400'
        : 'text-zinc-500';
  const improveReady = Boolean(strategy.trim()) && !isOutputBusy && !isImproving;
  const improveBusy = Boolean(strategy.trim()) && isImproving;

  return (
    <Card className="border-zinc-800/70 bg-zinc-950/35 backdrop-blur">
      <CardHeader className="p-4 sm:p-5">
        <CardTitle className="text-xl">Inputs</CardTitle>
        <CardDescription className="text-zinc-400">
          Tight prompt in, clean script out. Include timeframe, market, triggers, and invalidation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        <PromptTemplates activePreset={activePreset} onSelect={onPresetSelect} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="strategy">Strategy description</Label>
            <span className={`text-xs tabular-nums ${charColor}`} aria-live="polite">
              {charCount} / {MAX_PROMPT_LENGTH}
            </span>
          </div>
          <Textarea
            id="strategy"
            placeholder="Example: 5m momentum breakout. Only trade stocks with premarket high > 2% and RVOL > 2. Entry on break of HOD with pullback confirmation. Stop below last higher low; TP at 2R + trail after 1R..."
            value={strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            rows={8}
            className="resize-none border-zinc-700/70 bg-zinc-950/60 leading-relaxed placeholder:text-zinc-500 focus-visible:ring-emerald-400/30 text-white"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex flex-col gap-1 sm:min-w-0 sm:flex-1">
              {charCount > MAX_PROMPT_LENGTH && (
                <p className="text-xs text-rose-400 font-medium animate-fade-in">
                  Prompt is too long. Please reduce it to under {MAX_PROMPT_LENGTH} characters.
                </p>
              )}
              <p className="text-xs text-zinc-400">
                Tip: mention exact alert conditions (e.g. &ldquo;Average&rdquo; vs &ldquo;Strong&rdquo; trigger).{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  Ctrl
                </kbd>{' '}
                /{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  ⌘
                </kbd>
                +{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  Enter
                </kbd>{' '}
                to generate ·{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  Ctrl
                </kbd>{' '}
                /{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  ⌘
                </kbd>
                +{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                  K
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
                'shrink-0 self-end border-emerald-500/45 bg-emerald-500/10 text-emerald-100 shadow-sm shadow-emerald-950/40 hover:border-emerald-400/70 hover:bg-emerald-500/18 hover:text-white focus-visible:border-emerald-400/60 focus-visible:ring-emerald-400/25 disabled:border-zinc-700 disabled:bg-zinc-900/40 disabled:text-zinc-500 disabled:shadow-none sm:self-start',
                improveReady &&
                  'animate-pulse-glow shadow-[0_0_22px_-5px_rgba(16,185,129,0.45)] hover:shadow-[0_0_28px_-4px_rgba(16,185,129,0.55)]',
                improveBusy &&
                  'pointer-events-none cursor-wait animate-border-glow border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_32px_-4px_rgba(16,185,129,0.5)]',
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
                className="border-zinc-700/70 bg-zinc-950/60 pl-7 placeholder:text-zinc-500 focus-visible:ring-emerald-400/30 text-white font-mono"
              />
            </div>
            <p className="text-xs text-zinc-400">Numbers only. Used for position sizing.</p>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              size="lg"
              className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
