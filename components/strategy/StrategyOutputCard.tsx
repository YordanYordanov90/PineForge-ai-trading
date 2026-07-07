'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { GenerationRateLimitError } from '@/hooks/useScriptGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefineChat } from '@/components/strategy/RefineChat';
import { StrategyOutputCardHeader } from '@/components/strategy/StrategyOutputCardHeader';
import { StrategyOutputFooter } from '@/components/strategy/StrategyOutputFooter';
import { StrategyOutputTabs } from '@/components/strategy/StrategyOutputTabs';
import { VariantStrip } from '@/components/strategy/VariantStrip';
import type { VariantCardData } from '@/components/strategy/VariantCard';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';
import type { GrokModel } from '@/lib/config/constants';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';
import { useStrategyOutputExport } from '@/hooks/strategy/useStrategyOutputExport';
import { useStrategySuccessPulse } from '@/hooks/strategy/useStrategySuccessPulse';
import type { OutputTab } from '@/components/strategy/output-tab-types';
import { cn } from '@/lib/utils';

export type { OutputTab } from '@/components/strategy/output-tab-types';

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
  exportTitle?: string;
  exportCreatedAt?: string | null;
  forgeScriptId?: number | null;
  loadedScriptId?: number | null;
  assumptions?: StrategyAssumptions | null;
  variants?: VariantCardData[];
  isGeneratingVariants?: boolean;
  variantsOpen?: boolean;
  onToggleVariants?: () => void;
  onGenerateVariants?: () => void;
  onLoadVariant?: (v: VariantCardData) => void;
  plan?: string;
};

export function StrategyOutputCard(props: StrategyOutputCardProps) {
  const {
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
    loadedScriptId = null,
    assumptions,
    variants = [],
    isGeneratingVariants = false,
    variantsOpen = false,
    onToggleVariants,
    onGenerateVariants,
    onLoadVariant,
    plan = 'free',
  } = props;

  const resetKeysComposite = `${explainCancelKey}::${healthScoreResetKey}::${backtestSummaryResetKey}::${alertTemplatesResetKey}`;

  const exportState = useStrategyOutputExport({
    exportTitle,
    strategyPrompt,
    generatedScript,
    selectedModel,
    structuredInputs,
    accountBalance,
    exportCreatedAt,
    compareBeforeScript,
    resetKeysComposite,
  });

  const successPulse = useStrategySuccessPulse({
    isGenerating,
    isRefining,
    generatedScript,
    generationError,
  });

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
        <StrategyOutputCardHeader
          validationResult={validationResult}
          isOutputBusy={isOutputBusy}
          genElapsed={genElapsed}
          generatedScript={generatedScript}
          copied={copied}
          webhookPanelOpen={webhookPanelOpen}
          exportPanelOpen={exportState.exportPanelOpen}
          markdownCopied={exportState.markdownCopied}
          webhookUrl={webhookUrl}
          forgeScriptId={forgeScriptId}
          plan={plan}
          isGeneratingVariants={isGeneratingVariants}
          breakdownText={exportState.breakdownText}
          hasOptionalExportSections={exportState.hasOptionalExportSections}
          onStop={onStop}
          onCopy={onCopy}
          onDownload={onDownload}
          onOpenInTradingView={onOpenInTradingView}
          onToggleWebhookPanel={onToggleWebhookPanel}
          onToggleExportPanel={() => exportState.setExportPanelOpen((open) => !open)}
          onSnapshotExport={() => void exportState.handleSnapshotExport()}
          onCopyMarkdown={() => void exportState.handleCopyMarkdown()}
          onDownloadMarkdown={exportState.handleDownloadMarkdown}
          onWebhookUrlChange={onWebhookUrlChange}
          onGenerateVariants={onGenerateVariants}
        />
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
        <StrategyOutputTabs
          outputRef={outputRef}
          outputTab={outputTab}
          onOutputTabChange={onOutputTabChange}
          isStreaming={isStreaming}
          isIdle={isIdle}
          isOutputBusy={isOutputBusy}
          validationResult={validationResult}
          generatedScript={generatedScript}
          strategyPrompt={strategyPrompt}
          accountBalance={accountBalance}
          selectedModel={selectedModel}
          structuredInputs={structuredInputs}
          explainCancelKey={explainCancelKey}
          healthScoreResetKey={healthScoreResetKey}
          backtestSummaryResetKey={backtestSummaryResetKey}
          alertTemplatesResetKey={alertTemplatesResetKey}
          compareAvailable={compareAvailable}
          compareBeforeScript={compareBeforeScript}
          compareBeforeLabel={compareBeforeLabel}
          compareAfterLabel={compareAfterLabel}
          compareEmptyHint={compareEmptyHint}
          assumptions={assumptions}
          loadedScriptId={loadedScriptId}
          onGeneratedScriptChange={onGeneratedScriptChange}
          onSuggestionClick={onSuggestionClick}
          onPrefillRefine={onPrefillRefine}
          onBreakdownChange={exportState.setBreakdownText}
          onHealthResultChange={exportState.setHealthExportResult}
          onBacktestResultChange={exportState.setBacktestExportResult}
          onAlertResultChange={exportState.setAlertExportResult}
        />
        {(Boolean(generatedScript) || isRefining) && !isGenerating ? (
          <RefineChat
            busy={isRefining}
            disabled={!historyLineageReady}
            onRefine={onRefine}
            resetKey={refineResetKey}
            prefillInstruction={refinePrefillInstruction}
            prefillNonce={refinePrefillNonce}
          />
        ) : null}
        {onGenerateVariants && (variants.length > 0 || isGeneratingVariants || variantsOpen) ? (
          <VariantStrip
            isOpen={variantsOpen}
            onToggle={onToggleVariants ?? (() => {})}
            variants={variants}
            isGenerating={isGeneratingVariants}
            plan={plan}
            onLoadVariant={onLoadVariant ?? (() => {})}
            onUpgradeClick={() => {
              window.location.assign('/pricing');
            }}
          />
        ) : null}
        <Separator className="bg-zinc-200 dark:bg-zinc-800/70" />
        <StrategyOutputFooter />
      </CardContent>
    </Card>
  );
}