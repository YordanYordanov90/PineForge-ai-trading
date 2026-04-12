'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PromptTemplates } from '@/components/strategy/PromptTemplates';
import { ScriptOutput } from '@/components/strategy/ScriptOutput';
import {
  Copy,
  Check,
  Radio,
  ShieldCheck,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  MAX_PROMPT_LENGTH,
  CHAR_WARNING_THRESHOLD,
  CHAR_DANGER_THRESHOLD,
  DEFAULT_MODEL,
} from '@/lib/constants';
import { ModelSelector } from '@/components/strategy/ModelSelector';
import type { GrokModel } from '@/lib/constants';

export function StrategyForm() {
  const [strategy, setStrategy] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedModel, setSelectedModel] = useState<GrokModel['id']>(DEFAULT_MODEL);
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [genElapsed, setGenElapsed] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const charCount = strategy.length;
  const charColor =
    charCount > CHAR_DANGER_THRESHOLD
      ? 'text-rose-400'
      : charCount > CHAR_WARNING_THRESHOLD
        ? 'text-amber-400'
        : 'text-zinc-500';

  const canGenerate =
    Boolean(strategy.trim()) &&
    Boolean(balance.trim()) &&
    !isGenerating &&
    charCount <= MAX_PROMPT_LENGTH;

  const handlePresetSelect = (prompt: string, presetId: string) => {
    setStrategy(prompt);
    setActivePreset(presetId);
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const generate = useCallback(async () => {
    if (!canGenerate) return;

    setGeneratedScript('');
    setIsGenerating(true);
    const startTime = Date.now();
    setGenStartTime(startTime);
    setGenElapsed(null);
    setActivePreset(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: strategy, balance, model: selectedModel }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const maybeJson: unknown = await res.json().catch(() => null);
        const message =
          typeof maybeJson === 'object' && maybeJson && 'error' in maybeJson
            ? 'Invalid input. Please check your fields.'
            : 'Request failed. Please try again.';
        toast.error(message);
        return;
      }

      if (!res.body) {
        setGeneratedScript(await res.text());
        setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          setGeneratedScript((prev) => prev + decoder.decode(value, { stream: true }));
          requestAnimationFrame(() => {
            const pre = outputRef.current?.querySelector('pre');
            if (pre) pre.scrollTop = pre.scrollHeight;
          });
        }
      }

      setGenElapsed(Math.round((Date.now() - startTime) / 100) / 10);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        toast.message('Generation stopped.');
        if (genStartTime) {
          setGenElapsed(Math.round((Date.now() - genStartTime) / 100) / 10);
        }
        return;
      }
      toast.error('Something went wrong while generating. Please try again.');
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [canGenerate, strategy, balance, selectedModel, genStartTime]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success('Copied to clipboard.');
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Please copy manually from the output.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      generate();
    }
  };

  const isStreaming = isGenerating && Boolean(generatedScript);
  const isIdle = !isGenerating && !generatedScript;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8" onKeyDown={handleKeyDown}>
      {/* ── Left Panel: Inputs ── */}
      <Card className="border-zinc-800/70 bg-zinc-950/35 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Inputs</CardTitle>
          <CardDescription className="text-zinc-400">
            Tight prompt in, clean script out. Include timeframe, market, triggers, and invalidation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PromptTemplates
            activePreset={activePreset}
            onSelect={handlePresetSelect}
          />

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
              onChange={(e) => {
                setStrategy(e.target.value);
                setActivePreset(null);
              }}
              rows={8}
              className="resize-none border-zinc-700/70 bg-zinc-950/60 leading-relaxed placeholder:text-zinc-500 focus-visible:ring-emerald-400/30 text-white"
            />
            <p className="text-xs text-zinc-400">
              Tip: mention exact alert conditions (e.g. &ldquo;Average&rdquo; vs &ldquo;Strong&rdquo; trigger).{' '}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                Ctrl
              </kbd>{' '}
              +{' '}
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 text-[10px] text-zinc-300">
                Enter
              </kbd>{' '}
              to generate
            </p>
          </div>

          <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />

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
                  onChange={(e) => setBalance(e.target.value)}
                  className="border-zinc-700/70 bg-zinc-950/60 pl-7 placeholder:text-zinc-500 focus-visible:ring-emerald-400/30 text-white"
                />
              </div>
              <p className="text-xs text-zinc-400">Numbers only. Used for position sizing.</p>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={generate}
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

      {/* ── Right Panel: Output ── */}
      <Card
        className={`border-zinc-800/70 backdrop-blur transition-all duration-500 ${
          isGenerating
            ? 'border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] bg-zinc-950/40'
            : 'bg-zinc-950/35'
        }`}
      >
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-xl">Output</CardTitle>
              {isGenerating && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Streaming
                </span>
              )}
              {genElapsed !== null && !isGenerating && generatedScript && (
                <span className="text-xs text-zinc-500 tabular-nums">
                  {genElapsed}s &middot; ~{generatedScript.split(/\s+/).length} tokens
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && generatedScript && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/50"
                  onClick={() => stop()}
                >
                  Stop
                </Button>
              )}
              {generatedScript && !isGenerating && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="border border-zinc-800 text-white hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
                >
                  {copied ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-zinc-400">
            Streams live while Grok writes. Paste into TradingView &rarr; Pine Editor &rarr; Add to chart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={outputRef}
            className="relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-black/55 min-h-[280px]"
            aria-live="polite"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_10%_0%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(650px_circle_at_90%_30%,rgba(59,130,246,0.10),transparent_50%)]" />
            <ScriptOutput
              script={generatedScript}
              isGenerating={isGenerating}
              isStreaming={isStreaming}
              isIdle={isIdle}
            />
          </div>

          <Separator className="bg-zinc-800/70" />
          <div className="grid gap-3 text-xs sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
              <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
              <div>
                <div className="text-zinc-200">Alert tiers</div>
                <div className="text-zinc-500">Getting Ready &middot; Average &middot; Strong</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500/70" />
              <div>
                <div className="text-zinc-200">Auto lines</div>
                <div className="text-zinc-500">SL / TP drawn with labels</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
              <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500/70" />
              <div>
                <div className="text-zinc-200">Risk rules</div>
                <div className="text-zinc-500">Sized from account balance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}