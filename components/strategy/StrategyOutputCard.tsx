'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Code2,
  FlaskConical,
  GitCompareArrows,
  ListChecks,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import type { GenerationRateLimitError } from '@/hooks/useScriptGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExplainScriptPanel } from '@/components/strategy/ExplainScriptPanel';
import { AlertTemplatesPanel } from '@/components/strategy/AlertTemplatesPanel';
import { BacktestSummaryPanel } from '@/components/strategy/BacktestSummaryPanel';
import { HealthScorePanel } from '@/components/strategy/HealthScorePanel';
import { ExportMarkdownPanel } from '@/components/strategy/ExportMarkdownPanel';
import { OutputActionBar } from '@/components/strategy/OutputActionBar';
import { BreakdownTab } from '@/components/strategy/BreakdownTab';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';
import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import { buildExportMarkdownFromContext } from '@/lib/export/build-export-markdown';
import { downloadMarkdownFile } from '@/lib/export/download-markdown';
import { DEFAULT_EXPORT_TITLE } from '@/lib/export/source';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { GrokModel } from '@/lib/config/constants';
import { RefineChat } from '@/components/strategy/RefineChat';
import { ScriptComparePanel } from '@/components/strategy/ScriptComparePanel';
import { ScriptOutput } from '@/components/strategy/ScriptOutput';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';
import { TerminalOutputChrome } from '@/components/strategy/TerminalOutputChrome';
import { WebhookJsonPanel } from '@/components/strategy/WebhookJsonPanel';
import { cn } from '@/lib/utils';
import {
  pfOutputMuted,
  terminalCodeSurface,
  terminalCodeSurfacePanel,
  terminalCodeSurfaceStreaming,
  terminalTabActive,
} from '@/lib/ui/terminal-texture';

export type OutputTab =
  | 'script'
  | 'breakdown'
  | 'checklist'
  | 'health'
  | 'backtest'
  | 'alerts'
  | 'compare';

const OUTPUT_TAB_TRIGGER_CLASS =
  'pf-tab-trigger inline-flex shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs font-medium shadow-none disabled:pointer-events-none disabled:opacity-40 sm:px-4';

type OutputTabTriggerProps = {
  value: OutputTab;
  icon: typeof Code2;
  label: string;
  disabled?: boolean;
};

function OutputTabTrigger({ value, icon: Icon, label, disabled }: OutputTabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      data-terminal-tab=""
      className={cn(OUTPUT_TAB_TRIGGER_CLASS, terminalTabActive)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
    </TabsTrigger>
  );
}

type StrategyOutputCardProps = {
  outputRef: RefObject<HTMLDivElement | null>;
  validationResult: ValidationResult | null;
  isOutputBusy: boolean;
  genElapsed: number | null;
  generatedScript: string;
  generationError: GenerationRateLimitError | null;
  webhookPanelOpen: boolean;
  onToggleWebhookPanel: () => void;
  onStop: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onOpenInTradingView: () => void;
  copied: boolean;
  webhookUrl: string;
  onWebhookUrlChange: (value: string) => void;
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  isStreaming: boolean;
  isIdle: boolean;
  explainCancelKey: number;
  healthScoreResetKey: number;
  backtestSummaryResetKey: number;
  alertTemplatesResetKey: number;
  strategyPrompt: string;
  accountBalance: string;
  selectedModel: GrokModel['id'];
  structuredInputs: StructuredInputsValue;
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
  onSuggestionClick?: (prompt: string) => void;
  onPrefillRefine?: (instruction: string) => void;
  refinePrefillInstruction?: string;
  refinePrefillNonce?: number;
  /** Display title for Markdown export (history name or prompt excerpt). */
  exportTitle?: string;
  /** ISO createdAt when loaded from history; omitted for fresh drafts. */
  exportCreatedAt?: string | null;
  /**
   * DB id of the currently-loaded script lineage root, when the user
   * is signed in and the script has been persisted. Surfaces the
   * "Discuss with Forge" entry point in the action bar (spec 57).
   */
  forgeScriptId?: number | null;
  /** Spec 60: assumptions parsed from the current generation / loaded script. */
  assumptions?: StrategyAssumptions | null;
};

export function StrategyOutputCard({
  outputRef,
  validationResult,
  isOutputBusy,
  genElapsed,
  generatedScript,
  generationError,
  webhookPanelOpen,
  onToggleWebhookPanel,
  onStop,
  onDownload,
  onCopy,
  onOpenInTradingView,
  copied,
  webhookUrl,
  onWebhookUrlChange,
  outputTab,
  onOutputTabChange,
  isStreaming,
  isIdle,
  explainCancelKey,
  healthScoreResetKey,
  backtestSummaryResetKey,
  alertTemplatesResetKey,
  strategyPrompt,
  accountBalance,
  selectedModel,
  structuredInputs,
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
  onSuggestionClick,
  onPrefillRefine,
  refinePrefillInstruction,
  refinePrefillNonce,
  exportTitle,
  exportCreatedAt = null,
  forgeScriptId = null,
  assumptions,
}: StrategyOutputCardProps) {
  const [successPulse, setSuccessPulse] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [breakdownText, setBreakdownText] = useState<string | null>(null);
  const [healthExportResult, setHealthExportResult] =
    useState<HealthScoreResult | null>(null);
  const [alertExportResult, setAlertExportResult] =
    useState<AlertTemplatesResult | null>(null);
  const [backtestExportResult, setBacktestExportResult] =
    useState<BacktestSummaryResult | null>(null);

  // React-docs pattern for "adjusting state when a prop changes": detect
  // reset-key changes during render via a tracked composite, no effect.
  const resetKeysComposite = `${explainCancelKey}::${healthScoreResetKey}::${backtestSummaryResetKey}::${alertTemplatesResetKey}`;
  const [prevResetKeys, setPrevResetKeys] = useState(resetKeysComposite);
  if (prevResetKeys !== resetKeysComposite) {
    setPrevResetKeys(resetKeysComposite);
    setBreakdownText(null);
    setHealthExportResult(null);
    setAlertExportResult(null);
    setBacktestExportResult(null);
    setExportPanelOpen(false);
    setMarkdownCopied(false);
  }

  const buildMarkdown = useCallback(() => {
    return buildExportMarkdownFromContext({
      title: exportTitle?.trim() || DEFAULT_EXPORT_TITLE,
      prompt: strategyPrompt,
      script: generatedScript,
      model: selectedModel,
      structuredInputs: {
        ...structuredInputs,
        balance: accountBalance,
      },
      breakdown: breakdownText,
      createdAt: exportCreatedAt,
      healthScore: healthExportResult,
      alertTemplates: alertExportResult,
      backtestSummary: backtestExportResult,
    });
  }, [
    exportTitle,
    strategyPrompt,
    generatedScript,
    selectedModel,
    structuredInputs,
    accountBalance,
    breakdownText,
    exportCreatedAt,
    healthExportResult,
    alertExportResult,
    backtestExportResult,
  ]);

  const handleCopyMarkdown = useCallback(async () => {
    const markdown = buildMarkdown();
    if (!markdown.trim()) {
      toast.error('Nothing to export yet. Generate a script first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(markdown);
      setMarkdownCopied(true);
      toast.success('Markdown copied — paste into Notion or Obsidian.');
      window.setTimeout(() => setMarkdownCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Try Download .md instead.');
    }
  }, [buildMarkdown]);

  const handleDownloadMarkdown = useCallback(() => {
    const markdown = buildMarkdown();
    if (!markdown.trim()) {
      toast.error('Nothing to export yet. Generate a script first.');
      return;
    }
    const title = exportTitle?.trim() || DEFAULT_EXPORT_TITLE;
    downloadMarkdownFile(title, markdown);
    toast.success('Markdown file downloaded.');
  }, [buildMarkdown, exportTitle]);

  // Detect the `isGenerating: true → false` transition during render so
  // we don't `setState` inside `useEffect`. The follow-up timer that
  // turns the pulse off lives in an effect that depends on the pulse
  // itself (cleanup-only setState happens inside `setTimeout`, which
  // the lint rule allows).
  const [prevIsGenerating, setPrevIsGenerating] = useState(isGenerating);
  if (prevIsGenerating !== isGenerating) {
    setPrevIsGenerating(isGenerating);
    const finishedGenerate =
      prevIsGenerating &&
      !isGenerating &&
      !isRefining &&
      Boolean(generatedScript.trim()) &&
      !generationError;
    if (finishedGenerate && !successPulse) setSuccessPulse(true);
  }

  useEffect(() => {
    if (!successPulse) return;
    const timer = window.setTimeout(() => setSuccessPulse(false), 720);
    return () => window.clearTimeout(timer);
  }, [successPulse]);

  return (
    <Card
      className={cn(
        'pf-card transition-all duration-500',
        isOutputBusy &&
          'border-neon-500/40 shadow-[0_0_30px_-5px_rgba(200,255,0,0.15)] animate-border-glow dark:bg-zinc-950/40',
        successPulse && 'animate-success-pulse',
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle className="text-xl">Output</CardTitle>
            {validationResult && !isOutputBusy && (
              validationResult.isValid ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-500/30 bg-neon-500/10 px-2.5 py-0.5 text-xs font-medium text-neon-400 animate-fade-in">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-500/10 px-2.5 py-0.5 text-xs text-neon-400 border border-neon-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon-400" />
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
            {isOutputBusy ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/50"
                onClick={onStop}
              >
                Stop
              </Button>
            ) : (
              <OutputActionBar
                generatedScript={generatedScript}
                isOutputBusy={isOutputBusy}
                copied={copied}
                webhookPanelOpen={webhookPanelOpen}
                exportPanelOpen={exportPanelOpen}
                onCopy={onCopy}
                onDownload={onDownload}
                onOpenInTradingView={onOpenInTradingView}
                onToggleWebhookPanel={onToggleWebhookPanel}
                onToggleExportPanel={() => setExportPanelOpen((open) => !open)}
                forgeScriptId={forgeScriptId}
              />
            )}
          </div>
        </div>
        <CardDescription className="pf-muted">
          Streams live while PineForge writes. Edit the Script tab directly when idle; use Compare to see edits vs
          the last generated output or the previous version. Paste into TradingView &rarr; Pine Editor &rarr; Add to chart.
        </CardDescription>
        {exportPanelOpen && generatedScript && !isOutputBusy ? (
          <ExportMarkdownPanel
            copied={markdownCopied}
            onCopy={() => void handleCopyMarkdown()}
            onDownload={handleDownloadMarkdown}
            includesBreakdown={Boolean(breakdownText)}
            includesOptionalSections={Boolean(
              healthExportResult || alertExportResult || backtestExportResult,
            )}
          />
        ) : null}
        {webhookPanelOpen && generatedScript && !isOutputBusy && (
          <WebhookJsonPanel webhookUrl={webhookUrl} onWebhookUrlChange={onWebhookUrlChange} />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {generationError && !isOutputBusy ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          >
            <p>{generationError.message}</p>
            {generationError.showUpgradeCta ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 border-neon-500/40 text-neon-300 hover:bg-neon-500/10"
              >
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        <div
          ref={outputRef}
          className={cn(
            'relative max-h-[min(72vh,720px)] min-h-[280px] overscroll-contain rounded-2xl border border-zinc-200/90 dark:border-zinc-800/70',
            terminalCodeSurface,
            terminalCodeSurfacePanel,
            isStreaming && terminalCodeSurfaceStreaming,
          )}
          aria-live="polite"
        >
          <TerminalOutputChrome
            activeTab={outputTab}
            isStreaming={isStreaming}
            validationResult={validationResult}
            isOutputBusy={isOutputBusy}
          />
          <Tabs
            value={outputTab}
            onValueChange={(v) => {
              if (
                v === 'script' ||
                v === 'breakdown' ||
                v === 'checklist' ||
                v === 'health' ||
                v === 'backtest' ||
                v === 'alerts' ||
                v === 'compare'
              ) {
                onOutputTabChange(v);
              }
            }}
            className="relative min-h-0 gap-0"
          >
            <TabsList
              variant="line"
              className="pf-tabs-bar sticky top-0 z-20 w-full min-w-0 justify-start gap-0 overflow-x-auto rounded-none border-b px-1 pt-0 backdrop-blur-md supports-backdrop-filter:bg-zinc-50/95 dark:supports-backdrop-filter:bg-zinc-900/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <OutputTabTrigger value="script" icon={Code2} label="Script" />
              <OutputTabTrigger value="breakdown" icon={BarChart3} label="Breakdown" />
              <OutputTabTrigger value="checklist" icon={ListChecks} label="Checklist" />
              {generatedScript.trim() ? (
                <OutputTabTrigger value="health" icon={Activity} label="Health" />
              ) : null}
              {generatedScript.trim() ? (
                <OutputTabTrigger value="backtest" icon={FlaskConical} label="Backtest" />
              ) : null}
              {generatedScript.trim() ? (
                <OutputTabTrigger value="alerts" icon={Bell} label="Alerts" />
              ) : null}
              <OutputTabTrigger
                value="compare"
                icon={GitCompareArrows}
                label="Compare"
                disabled={!compareAvailable}
              />
            </TabsList>
            <TabsContent value="script" forceMount className="mt-0 min-h-0 data-[state=inactive]:hidden">
              <ScriptOutput
                script={generatedScript}
                isGenerating={isOutputBusy}
                isStreaming={isStreaming}
                isIdle={isIdle}
                onScriptChange={onGeneratedScriptChange}
                onSuggestionClick={onSuggestionClick}
              />
            </TabsContent>
            <TabsContent value="breakdown" forceMount className="mt-0 min-h-0 data-[state=inactive]:hidden">
              <BreakdownTab
                script={generatedScript}
                isTabActive={outputTab === 'breakdown'}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                cancelKey={explainCancelKey}
                containedScroll={false}
                onBreakdownChange={setBreakdownText}
                assumptions={assumptions ?? null}
              />
            </TabsContent>
            <TabsContent value="checklist" forceMount className="mt-0 min-h-0 data-[state=inactive]:hidden">
              <ExplainScriptPanel
                mode="checklist"
                script={generatedScript}
                isTabActive={outputTab === 'checklist'}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                cancelKey={explainCancelKey}
                containedScroll={false}
              />
            </TabsContent>
            <TabsContent value="health" forceMount className="mt-0 data-[state=inactive]:hidden">
              <HealthScorePanel
                prompt={strategyPrompt}
                script={generatedScript}
                model={selectedModel}
                balance={accountBalance}
                structuredInputs={structuredInputs}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                resetKey={healthScoreResetKey}
                onPrefillRefine={onPrefillRefine}
                onResultChange={setHealthExportResult}
                assumptions={assumptions ?? null}
              />
            </TabsContent>
            <TabsContent value="backtest" forceMount className="mt-0 data-[state=inactive]:hidden">
              <BacktestSummaryPanel
                prompt={strategyPrompt}
                script={generatedScript}
                model={selectedModel}
                balance={accountBalance}
                structuredInputs={structuredInputs}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                resetKey={backtestSummaryResetKey}
                onResultChange={setBacktestExportResult}
              />
            </TabsContent>
            <TabsContent value="alerts" forceMount className="mt-0 data-[state=inactive]:hidden">
              <AlertTemplatesPanel
                prompt={strategyPrompt}
                script={generatedScript}
                model={selectedModel}
                balance={accountBalance}
                structuredInputs={structuredInputs}
                isScriptFinal={!isOutputBusy && Boolean(generatedScript.trim())}
                resetKey={alertTemplatesResetKey}
                onResultChange={setAlertExportResult}
              />
            </TabsContent>
            <TabsContent value="compare" forceMount className="mt-0 data-[state=inactive]:hidden">
              {!compareAvailable ? (
                <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>{compareEmptyHint}</p>
              ) : isOutputBusy ? (
                <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>
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
                <p className={cn('px-6 py-6 text-sm', pfOutputMuted)}>{compareEmptyHint}</p>
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
            prefillInstruction={refinePrefillInstruction}
            prefillNonce={refinePrefillNonce}
          />
        )}

        <Separator className="bg-zinc-200 dark:bg-zinc-800/70" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
            <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-600 dark:text-neon-500/70" />
            <div>
              <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Alert tiers</div>
              <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">Getting Ready &middot; Average &middot; Strong</div>
            </div>
          </div>
          <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-500/70" />
            <div>
              <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Auto lines</div>
              <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">SL / TP drawn with labels</div>
            </div>
          </div>
          <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
            <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-500/70" />
            <div>
              <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Risk rules</div>
              <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">Sized from account balance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
