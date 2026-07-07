'use client';

import { AlertTriangle, Layers, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { ExportMarkdownPanel } from '@/components/strategy/ExportMarkdownPanel';
import { OutputActionBar } from '@/components/strategy/OutputActionBar';
import { WebhookJsonPanel } from '@/components/strategy/WebhookJsonPanel';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';

type StrategyOutputCardHeaderProps = {
  validationResult: ValidationResult | null;
  isOutputBusy: boolean;
  genElapsed: number | null;
  generatedScript: string;
  copied: boolean;
  webhookPanelOpen: boolean;
  exportPanelOpen: boolean;
  markdownCopied: boolean;
  webhookUrl: string;
  forgeScriptId?: number | null;
  plan: string;
  isGeneratingVariants: boolean;
  breakdownText: string | null;
  hasOptionalExportSections: boolean;
  onStop: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onOpenInTradingView: () => void;
  onToggleWebhookPanel: () => void;
  onToggleExportPanel: () => void;
  onSnapshotExport: () => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onWebhookUrlChange: (value: string) => void;
  onGenerateVariants?: () => void;
};

export function StrategyOutputCardHeader({
  validationResult,
  isOutputBusy,
  genElapsed,
  generatedScript,
  copied,
  webhookPanelOpen,
  exportPanelOpen,
  markdownCopied,
  webhookUrl,
  forgeScriptId = null,
  plan,
  isGeneratingVariants,
  breakdownText,
  hasOptionalExportSections,
  onStop,
  onCopy,
  onDownload,
  onOpenInTradingView,
  onToggleWebhookPanel,
  onToggleExportPanel,
  onSnapshotExport,
  onCopyMarkdown,
  onDownloadMarkdown,
  onWebhookUrlChange,
  onGenerateVariants,
}: StrategyOutputCardHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle className="text-xl">Output</CardTitle>
          {validationResult && !isOutputBusy ? (
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
          ) : null}
          {isOutputBusy ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-500/10 px-2.5 py-0.5 text-xs text-neon-400 border border-neon-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon-400" />
              </span>
              Streaming
            </span>
          ) : null}
          {genElapsed !== null && !isOutputBusy && generatedScript ? (
            <span className="text-xs text-zinc-500 tabular-nums">
              Generated in {genElapsed}s · ~{Math.round(generatedScript.length / 4)} tokens
            </span>
          ) : null}
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
            <>
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
                onToggleExportPanel={onToggleExportPanel}
                forgeScriptId={forgeScriptId}
                plan={plan}
                onSnapshotExport={onSnapshotExport}
              />
              {generatedScript && onGenerateVariants ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onGenerateVariants}
                  disabled={isGeneratingVariants}
                  className="ml-1 h-8 gap-1.5 border border-zinc-800 text-[11px] uppercase tracking-widest text-neon-300 hover:bg-neon-500/10 hover:text-neon-400 hover:border-neon-500/30"
                  aria-label="Generate 1-3 strategy variants"
                >
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  Generate Variants
                </Button>
              ) : null}
            </>
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
          onCopy={onCopyMarkdown}
          onDownload={onDownloadMarkdown}
          includesBreakdown={Boolean(breakdownText)}
          includesOptionalSections={hasOptionalExportSections}
        />
      ) : null}
      {webhookPanelOpen && generatedScript && !isOutputBusy ? (
        <WebhookJsonPanel webhookUrl={webhookUrl} onWebhookUrlChange={onWebhookUrlChange} />
      ) : null}
    </>
  );
}