'use client';

import type { RefObject } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Copy,
  Download,
  Radio,
  ShieldCheck,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExplainScriptPanel } from '@/components/strategy/ExplainScriptPanel';
import { RefineChat } from '@/components/strategy/RefineChat';
import { ScriptComparePanel } from '@/components/strategy/ScriptComparePanel';
import { ScriptOutput } from '@/components/strategy/ScriptOutput';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';
import { WebhookJsonPanel } from '@/components/strategy/WebhookJsonPanel';
import { cn } from '@/lib/utils';

export type OutputTab = 'script' | 'breakdown' | 'checklist' | 'compare';

type StrategyOutputCardProps = {
  outputRef: RefObject<HTMLDivElement | null>;
  validationResult: ValidationResult | null;
  isOutputBusy: boolean;
  genElapsed: number | null;
  generatedScript: string;
  webhookPanelOpen: boolean;
  onToggleWebhookPanel: () => void;
  onStop: () => void;
  onDownload: () => void;
  onCopy: () => void;
  copied: boolean;
  webhookUrl: string;
  onWebhookUrlChange: (value: string) => void;
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  isStreaming: boolean;
  isIdle: boolean;
  explainCancelKey: number;
  isGenerating: boolean;
  isRefining: boolean;
  historyLineageReady: boolean;
  onRefine: (instruction: string) => Promise<void>;
  refineResetKey: number;
  compareAvailable: boolean;
  compareBeforeScript: string;
  compareBeforeLabel: string;
  compareAfterLabel: string;
  compareEmptyHint: string;
  onGeneratedScriptChange: (value: string) => void;
};

export function StrategyOutputCard({
  outputRef,
  validationResult,
  isOutputBusy,
  genElapsed,
  generatedScript,
  webhookPanelOpen,
  onToggleWebhookPanel,
  onStop,
  onDownload,
  onCopy,
  copied,
  webhookUrl,
  onWebhookUrlChange,
  outputTab,
  onOutputTabChange,
  isStreaming,
  isIdle,
  explainCancelKey,
  isGenerating,
  isRefining,
  historyLineageReady,
  onRefine,
  refineResetKey,
  compareAvailable,
  compareBeforeScript,
  compareBeforeLabel,
  compareAfterLabel,
  compareEmptyHint,
  onGeneratedScriptChange,
}: StrategyOutputCardProps) {
  return (
    <Card
      className={`border-zinc-800/70 backdrop-blur transition-all duration-500 ${
        isOutputBusy
          ? 'border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] animate-border-glow bg-zinc-950/40'
          : 'bg-zinc-950/35'
      }`}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle className="text-xl">Output</CardTitle>
            {validationResult && !isOutputBusy && (
              validationResult.isValid ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 animate-fade-in">
                  <ShieldCheck className="h-3 w-3" />
                  Valid Pine Script v5 ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 animate-fade-in">
                  <AlertTriangle className="h-3 w-3" />
                  Review needed
                </span>
              )
            )}
            {isOutputBusy && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Streaming
              </span>
            )}
            {genElapsed !== null && !isOutputBusy && generatedScript && (
              <span className="text-xs text-zinc-500 tabular-nums">
                Generated in {genElapsed}s · ~{Math.round(generatedScript.length / 4)} tokens
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOutputBusy && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/50"
                onClick={onStop}
              >
                Stop
              </Button>
            )}
            {generatedScript && !isOutputBusy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="border border-zinc-800 text-white hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download .pine
                </span>
              </Button>
            )}
            {generatedScript && !isOutputBusy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleWebhookPanel}
                aria-pressed={webhookPanelOpen}
                className={cn(
                  'border border-zinc-800 text-white hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30',
                  webhookPanelOpen && 'border-emerald-500/40 bg-emerald-500/5',
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Webhook className="h-3.5 w-3.5" />
                  Webhook JSON
                </span>
              </Button>
            )}
            {generatedScript && !isOutputBusy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCopy}
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
          Streams live while PineForge writes. Edit the Script tab directly when idle; use Compare to see edits vs
          the last generated output or the previous version. Paste into TradingView &rarr; Pine Editor &rarr; Add to chart.
        </CardDescription>
        {webhookPanelOpen && generatedScript && !isOutputBusy && (
          <WebhookJsonPanel webhookUrl={webhookUrl} onWebhookUrlChange={onWebhookUrlChange} />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={outputRef}
          className="relative overflow-hidden rounded-2xl border border-zinc-800/70 bg-black/55 min-h-[280px]"
          aria-live="polite"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_10%_0%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(650px_circle_at_90%_30%,rgba(59,130,246,0.10),transparent_50%)]" />
          <Tabs
            value={outputTab}
            onValueChange={(v) => {
              if (
                v === 'script' ||
                v === 'breakdown' ||
                v === 'checklist' ||
                v === 'compare'
              ) {
                onOutputTabChange(v);
              }
            }}
            className="gap-0"
          >
            <TabsList
              variant="line"
              className="relative z-10 w-full min-w-0 justify-start gap-0 rounded-none border-b border-zinc-700/80 bg-zinc-900/90 px-1 pt-0"
            >
              <TabsTrigger
                value="script"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 shadow-none hover:bg-zinc-800/40 hover:text-zinc-100 data-[state=active]:border-emerald-500 data-[state=active]:bg-zinc-950/50 data-[state=active]:text-emerald-300 data-[state=inactive]:text-zinc-500"
              >
                Script
              </TabsTrigger>
              <TabsTrigger
                value="breakdown"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 shadow-none hover:bg-zinc-800/40 hover:text-zinc-100 data-[state=active]:border-emerald-500 data-[state=active]:bg-zinc-950/50 data-[state=active]:text-emerald-300 data-[state=inactive]:text-zinc-500"
              >
                Breakdown
              </TabsTrigger>
              <TabsTrigger
                value="checklist"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 shadow-none hover:bg-zinc-800/40 hover:text-zinc-100 data-[state=active]:border-emerald-500 data-[state=active]:bg-zinc-950/50 data-[state=active]:text-emerald-300 data-[state=inactive]:text-zinc-500"
              >
                Checklist
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                disabled={!compareAvailable}
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 shadow-none hover:bg-zinc-800/40 hover:text-zinc-100 data-[state=active]:border-emerald-500 data-[state=active]:bg-zinc-950/50 data-[state=active]:text-emerald-300 data-[state=inactive]:text-zinc-500 disabled:pointer-events-none disabled:opacity-40"
              >
                Compare
              </TabsTrigger>
            </TabsList>
            <TabsContent value="script" forceMount className="mt-0 data-[state=inactive]:hidden">
              <ScriptOutput
                script={generatedScript}
                isGenerating={isOutputBusy}
                isStreaming={isStreaming}
                isIdle={isIdle}
                onScriptChange={onGeneratedScriptChange}
              />
            </TabsContent>
            <TabsContent value="breakdown" forceMount className="mt-0 data-[state=inactive]:hidden">
              <ExplainScriptPanel
                mode="breakdown"
                script={generatedScript}
                isTabActive={outputTab === 'breakdown'}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                cancelKey={explainCancelKey}
              />
            </TabsContent>
            <TabsContent value="checklist" forceMount className="mt-0 data-[state=inactive]:hidden">
              <ExplainScriptPanel
                mode="checklist"
                script={generatedScript}
                isTabActive={outputTab === 'checklist'}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                cancelKey={explainCancelKey}
              />
            </TabsContent>
            <TabsContent value="compare" forceMount className="mt-0 data-[state=inactive]:hidden">
              {!compareAvailable ? (
                <p className="px-6 py-6 text-sm text-zinc-500">{compareEmptyHint}</p>
              ) : isOutputBusy ? (
                <p className="px-6 py-6 text-sm text-zinc-500">
                  Finish streaming to see the side-by-side diff.
                </p>
              ) : compareBeforeScript !== '' ? (
                <ScriptComparePanel
                  beforeScript={compareBeforeScript}
                  afterScript={generatedScript}
                  beforeLabel={compareBeforeLabel}
                  afterLabel={compareAfterLabel}
                  isReady
                />
              ) : (
                <p className="px-6 py-6 text-sm text-zinc-500">{compareEmptyHint}</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {(Boolean(generatedScript) || isRefining) && !isGenerating && (
          <RefineChat
            busy={isRefining}
            disabled={!historyLineageReady}
            onRefine={onRefine}
            resetKey={refineResetKey}
          />
        )}

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
  );
}
