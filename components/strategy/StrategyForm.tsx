'use client';

import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { GeneratorCommandMenu } from '@/components/strategy/GeneratorCommandMenu';
import { StrategyInputsCard } from '@/components/strategy/StrategyInputsCard';
import { StrategyOutputCard } from '@/components/strategy/StrategyOutputCard';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import { useStrategyGenerationSession } from '@/hooks/strategy/useStrategyGenerationSession';
import { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';
import { useUserPlan } from '@/lib/providers/UserPlanContext';
import type { SavedScript } from '@/lib/types';

export type StrategyFormHandle = {
  loadSavedScript: (entry: SavedScript) => void;
};

export type StrategyFormProps = {
  onRequestOpenHistory?: () => void;
};

export const StrategyForm = forwardRef<StrategyFormHandle, StrategyFormProps>(
  function StrategyForm({ onRequestOpenHistory }, ref) {
    const plan = useUserPlan();
    const { entries, addEntry } = useScriptHistory();
    const inputs = useStrategyFormInputs();
    const lineage = useStrategyLineageSync();
    const session = useStrategyGenerationSession({
      inputs,
      lineage,
      entries,
      addEntry,
    });

    const loadSavedScript = useCallback(
      (entry: SavedScript) => {
        lineage.applyLoadedScript(entry, plan, {
          setStrategy: inputs.setStrategy,
          setBalance: inputs.setBalance,
          setSelectedModel: inputs.setSelectedModel,
          setStructuredInputs: inputs.setStructuredInputs,
          setGeneratedScript: session.setGeneratedScript,
          setActivePreset: inputs.setActivePreset,
          setCopied: session.setCopied,
          setGenElapsed: session.setGenElapsed,
          setGenStartTime: session.setGenStartTime,
          resetPanelKeys: session.resetPanelKeys,
          setOutputTab: session.setOutputTab,
        });
      },
      [lineage, plan, inputs, session],
    );

    useImperativeHandle(ref, () => ({ loadSavedScript }), [loadSavedScript]);

    const { compare } = session;

    return (
      <>
        <GeneratorCommandMenu
          open={session.commandOpen}
          onOpenChange={session.setCommandOpen}
          canGenerate={session.canGenerate}
          onGenerate={() => void session.handleGenerate()}
          canImprove={session.canImprove}
          onImprovePrompt={inputs.onImprovePrompt}
          onOpenHistory={() => onRequestOpenHistory?.()}
          hasScript={Boolean(session.generatedScript.trim())}
          isOutputBusy={session.isOutputBusy}
          compareAvailable={compare.compareAvailable}
          onCopy={session.handleCopy}
          onDownload={session.handleDownload}
          onOpenInTradingView={session.handleOpenInTradingView}
          onStop={session.stop}
          outputTab={session.outputTab}
          onOutputTabChange={session.setOutputTab}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <StrategyInputsCard
            strategy={inputs.strategy}
            onStrategyChange={inputs.handleStrategyChange}
            balance={inputs.balance}
            onBalanceChange={inputs.setBalance}
            activePreset={inputs.activePreset}
            onPresetSelect={inputs.handlePresetSelect}
            selectedModel={inputs.selectedModel}
            onModelChange={inputs.setSelectedModel}
            structuredInputs={inputs.structuredInputs}
            onStructuredInputsChange={inputs.setStructuredInputs}
            canGenerate={session.canGenerate}
            isGenerating={session.isGenerating}
            isOutputBusy={session.isOutputBusy}
            isImproving={inputs.isImproving}
            onGenerate={() => void session.handleGenerate()}
            onImprovePrompt={inputs.onImprovePrompt}
          />

          <StrategyOutputCard
            outputRef={session.outputRef}
            validationResult={session.validationResult}
            isOutputBusy={session.isOutputBusy}
            genElapsed={session.genElapsed}
            generatedScript={session.generatedScript}
            generationError={session.generationError}
            webhookPanelOpen={session.webhookPanelOpen}
            onToggleWebhookPanel={() =>
              session.setWebhookPanelOpen((open) => !open)
            }
            onStop={session.stop}
            onDownload={session.handleDownload}
            onCopy={session.handleCopy}
            onOpenInTradingView={session.handleOpenInTradingView}
            copied={session.copied}
            webhookUrl={session.webhookUrl}
            onWebhookUrlChange={session.setWebhookUrl}
            outputTab={session.outputTab}
            onOutputTabChange={session.setOutputTab}
            isStreaming={session.isStreaming}
            isIdle={session.isIdle}
            explainCancelKey={session.explainCancelKey}
            healthScoreResetKey={session.healthScoreResetKey}
            backtestSummaryResetKey={session.backtestSummaryResetKey}
            alertTemplatesResetKey={session.alertTemplatesResetKey}
            strategyPrompt={inputs.strategy}
            accountBalance={inputs.balance}
            selectedModel={inputs.selectedModel}
            structuredInputs={inputs.structuredInputs}
            isGenerating={session.isGenerating}
            isRefining={session.isRefining}
            historyLineageReady={lineage.historyLineageReady}
            onRefine={session.handleRefine}
            refineResetKey={session.refineResetKey}
            compareAvailable={compare.compareAvailable}
            compareBeforeScript={compare.compareBeforeScript}
            compareBeforeLabel={compare.compareBeforeLabel}
            compareAfterLabel={compare.compareAfterLabel}
            compareEmptyHint={compare.compareEmptyHint}
            onGeneratedScriptChange={session.handleGeneratedScriptChange}
            onSuggestionClick={inputs.handleSuggestionClick}
            onPrefillRefine={session.handlePrefillRefine}
            refinePrefillInstruction={session.refinePrefillInstruction}
            refinePrefillNonce={session.refinePrefillNonce}
            exportTitle={lineage.exportTitle}
            exportCreatedAt={lineage.exportCreatedAt}
          />
        </div>
      </>
    );
  },
);

StrategyForm.displayName = 'StrategyForm';
