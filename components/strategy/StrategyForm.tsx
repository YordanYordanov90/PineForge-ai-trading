'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GeneratorCommandMenu } from '@/components/strategy/GeneratorCommandMenu';
import { StrategyInputsCard } from '@/components/strategy/StrategyInputsCard';
import { StrategyOutputCard } from '@/components/strategy/StrategyOutputCard';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import { useStrategyFormInputs } from '@/hooks/strategy/useStrategyFormInputs';
import { useStrategyGenerationSession } from '@/hooks/strategy/useStrategyGenerationSession';
import { useStrategyLineageSync } from '@/hooks/strategy/useStrategyLineageSync';
import { useUserPlan } from '@/lib/providers/UserPlanContext';
import type { SavedScript } from '@/lib/types';
import { getTemplateById } from '@/lib/templates/templates';
import type { StrategyTemplate } from '@/lib/templates/templates';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export type StrategyFormHandle = {
  loadSavedScript: (entry: SavedScript) => void;
};

export type StrategyFormProps = {
  onRequestOpenHistory?: () => void;
  initialTemplateId?: string | null;
};

export const StrategyForm = forwardRef<StrategyFormHandle, StrategyFormProps>(
  function StrategyForm({ onRequestOpenHistory, initialTemplateId }, ref) {
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
          // Spec 60
          setAssumptions: session.setAssumptions,
        });
        // Ensure assumptions surface for the loaded script (defensive).
        session.setAssumptions?.(entry.assumptions ?? null);
      },
      [lineage, plan, inputs, session],
    );

    useImperativeHandle(ref, () => ({ loadSavedScript }), [loadSavedScript]);

    // Template preload from ?templateId (spec 59)
    const [loadedTemplate, setLoadedTemplate] = useState<StrategyTemplate | null>(null);
    const [templateBannerDismissed, setTemplateBannerDismissed] = useState(false);
    const handledTemplateRef = useRef<string | null>(null);

    useEffect(() => {
      if (!initialTemplateId || handledTemplateRef.current === initialTemplateId) return;

      const t = getTemplateById(initialTemplateId);
      if (!t) return;

      // Guard: free users cannot load Pro templates (client enforcement; server on generate POST)
      if (t.isPro && plan !== 'pro') {
        toast.error('This is a Pro-only template. Upgrade to load it into the generator.');
        handledTemplateRef.current = initialTemplateId; // don't keep retrying
        return;
      }

      // Prefill inputs + script (no new AI call)
      inputs.setStrategy(t.prompt);
      inputs.setActivePreset(null);
      inputs.setStructuredInputs({
        market: t.structuredInputs.market,
        timeframe: t.structuredInputs.timeframe,
        direction: t.structuredInputs.direction,
        indicators: t.structuredInputs.indicators,
        rr: t.structuredInputs.rr,
      });

      // Pre-load the script into output panel (ready to refine)
      session.setGeneratedScript(t.script);
      session.resetPanelKeys();

      setLoadedTemplate(t);
      setTemplateBannerDismissed(false);
      handledTemplateRef.current = initialTemplateId;

      // Optional: friendly success hint
      toast.success(`Loaded template: ${t.title}`);
    }, [initialTemplateId, plan, inputs, session]); // safe because setters are stable from the hooks

    const dismissTemplateBanner = () => {
      setTemplateBannerDismissed(true);
      // Clear the loaded template state but keep the prefilled content (user can edit)
      setLoadedTemplate(null);
    };

    const { compare } = session;

    return (
      <>
        {/* Template preload banner (spec 59) */}
        {loadedTemplate && !templateBannerDismissed && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm">
            <span>
              Loaded from template: <span className="font-medium text-emerald-400">{loadedTemplate.title}</span>. Script and inputs are pre-filled — ready to refine or edit.
            </span>
            <button
              type="button"
              onClick={dismissTemplateBanner}
              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"
              aria-label="Dismiss template banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
            forgeScriptId={parseForgeScriptId(lineage.lineageState?.rootId)}
            // Spec 60
            assumptions={session.assumptions}
          />
        </div>
      </>
    );
  },
);

StrategyForm.displayName = 'StrategyForm';

/**
 * `lineageState.rootId` is typed as `string` because the localStorage
 * history (Phase 1–3) used opaque ids; DB-backed rows convert their
 * numeric id via `String(row.id)`. The Forge entry point only makes
 * sense for DB-backed scripts (signed-in users) — anything that
 * doesn't parse to a positive int falls back to `null` so the
 * "Discuss with Forge" button hides on local-only entries.
 */
function parseForgeScriptId(rootId: string | undefined): number | null {
  if (!rootId) return null;
  const parsed = Number.parseInt(rootId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}
