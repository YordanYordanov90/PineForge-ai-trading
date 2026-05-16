'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { validateScript } from '@/components/strategy/ScriptOutput';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import {
  MAX_PROMPT_LENGTH,
  DEFAULT_MODEL,
  GROK_MODELS,
} from '@/lib/config/constants';
import type { GrokModel } from '@/lib/config/constants';
import {
  buildSavedScriptFromGeneration,
  buildSavedScriptFromRefinement,
  useScriptHistory,
} from '@/hooks/useScriptHistory';
import type { SavedScript } from '@/lib/types';
import { usePromptImprover } from '@/hooks/usePromptImprover';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { GeneratorCommandMenu } from '@/components/strategy/GeneratorCommandMenu';
import { StrategyInputsCard } from '@/components/strategy/StrategyInputsCard';
import { StrategyOutputCard, type OutputTab } from '@/components/strategy/StrategyOutputCard';
import { getPreviousVersionScript } from '@/lib/scripts/lineage';

const MODEL_IDS = new Set<GrokModel['id']>(GROK_MODELS.map((m) => m.id));

type LineageState = { rootId: string; lastVersion: number };

export type StrategyFormHandle = {
  loadSavedScript: (entry: SavedScript) => void;
};

export type StrategyFormProps = {
  onRequestOpenHistory?: () => void;
};

export const StrategyForm = forwardRef<StrategyFormHandle, StrategyFormProps>(
  function StrategyForm({ onRequestOpenHistory }, ref) {
  const { entries, addEntry } = useScriptHistory();
  const [strategy, setStrategy] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedModel, setSelectedModel] = useState<GrokModel['id']>(DEFAULT_MODEL);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [structuredInputs, setStructuredInputs] = useState<StructuredInputsValue>({});
  const [refineResetKey, setRefineResetKey] = useState(0);
  const [historyLineageReady, setHistoryLineageReady] = useState(false);
  const [outputTab, setOutputTab] = useState<OutputTab>('script');
  const [explainCancelKey, setExplainCancelKey] = useState(0);
  const [webhookPanelOpen, setWebhookPanelOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const lineageRef = useRef<LineageState | null>(null);
  const [lineageState, setLineageState] = useState<LineageState | null>(null);
  /** Last AI-settled script (generate / refine / load); Compare vs manual edits uses this. */
  const [scriptCompareBaseline, setScriptCompareBaseline] = useState<string | null>(null);
  const sessionHistoryNameRef = useRef('');

  const { isImproving, handleImprovePrompt } = usePromptImprover({
    onSuccess: setStrategy,
  });

  const {
    generatedScript,
    setGeneratedScript,
    isGenerating,
    isRefining,
    isOutputBusy,
    setGenStartTime,
    genElapsed,
    setGenElapsed,
    stop,
    generate,
    refine,
  } = useScriptGeneration({
    onChunk: () => {
      requestAnimationFrame(() => {
        const el = outputRef.current?.querySelector('pre, textarea');
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    onGenerationComplete: (finalScript, payload) => {
      void (async () => {
        const entry = buildSavedScriptFromGeneration({
          prompt: payload.prompt,
          balance: payload.balance,
          script: finalScript,
          model: payload.model,
          market: payload.structuredInputs.market,
          timeframe: payload.structuredInputs.timeframe,
          direction: payload.structuredInputs.direction,
          indicators: payload.structuredInputs.indicators,
          rr: payload.structuredInputs.rr,
        });
        const saved = await addEntry(entry);
        setScriptCompareBaseline(finalScript);
        if (!saved) {
          return;
        }
        const nextLineage: LineageState = { rootId: saved.id, lastVersion: 1 };
        lineageRef.current = nextLineage;
        setLineageState(nextLineage);
        sessionHistoryNameRef.current = saved.name;
        setHistoryLineageReady(true);
      })();
    },
    onRefineComplete: (finalScript) => {
      const lineage = lineageRef.current;
      if (!lineage) return;
      const nextVersion = lineage.lastVersion + 1;
      void (async () => {
        const saved = await addEntry(
          buildSavedScriptFromRefinement({
            name: sessionHistoryNameRef.current,
            prompt: strategy,
            balance,
            script: finalScript,
            model: selectedModel,
            version: nextVersion,
            parentId: lineage.rootId,
            market: structuredInputs.market,
            timeframe: structuredInputs.timeframe,
            direction: structuredInputs.direction,
            indicators: structuredInputs.indicators,
            rr: structuredInputs.rr,
          }),
        );
        if (!saved) {
          return;
        }
        const nextLineage: LineageState = {
          rootId: lineage.rootId,
          lastVersion: nextVersion,
        };
        lineageRef.current = nextLineage;
        setLineageState(nextLineage);
        setScriptCompareBaseline(finalScript);
        setRefineResetKey((k) => k + 1);
      })();
    },
  });

  useImperativeHandle(ref, () => ({
    loadSavedScript(entry: SavedScript) {
      setStrategy(entry.prompt);
      setBalance(entry.balance);
      setSelectedModel(
        entry.model && MODEL_IDS.has(entry.model) ? entry.model : DEFAULT_MODEL,
      );
      setStructuredInputs({
        market: entry.market,
        timeframe: entry.timeframe,
        direction: entry.direction,
        indicators: entry.indicators,
        rr: entry.rr,
      });
      setGeneratedScript(entry.script);
      setActivePreset(null);
      setCopied(false);
      setGenElapsed(null);
      setGenStartTime(null);
      const nextLineage: LineageState = {
        rootId: entry.parentId ?? entry.id,
        lastVersion: entry.version,
      };
      lineageRef.current = nextLineage;
      setLineageState(nextLineage);
      sessionHistoryNameRef.current = entry.name;
      setHistoryLineageReady(true);
      setScriptCompareBaseline(entry.script);
      setOutputTab('script');
      setExplainCancelKey((k) => k + 1);
    },
  }));

  const canGenerate =
    Boolean(strategy.trim()) &&
    Boolean(balance.trim()) &&
    !isOutputBusy &&
    strategy.length <= MAX_PROMPT_LENGTH;

  const canImprove = useMemo(
    () => Boolean(strategy.trim()) && !isOutputBusy && !isImproving,
    [strategy, isOutputBusy, isImproving],
  );

  const validationResult: ValidationResult | null = useMemo(
    () => (!isOutputBusy && generatedScript ? validateScript(generatedScript) : null),
    [isOutputBusy, generatedScript],
  );

  const comparePreviousScript = useMemo(() => {
    if (!lineageState || lineageState.lastVersion < 2) return null;
    return getPreviousVersionScript(
      entries,
      lineageState.rootId,
      lineageState.lastVersion,
    );
  }, [entries, lineageState]);

  const lineageCompareAvailable = useMemo(
    () =>
      Boolean(
        historyLineageReady &&
          lineageState &&
          lineageState.lastVersion >= 2 &&
          comparePreviousScript != null,
      ),
    [historyLineageReady, lineageState, comparePreviousScript],
  );

  const hasManualEdits = useMemo(
    () =>
      Boolean(
        scriptCompareBaseline !== null && generatedScript !== scriptCompareBaseline,
      ),
    [scriptCompareBaseline, generatedScript],
  );

  const compareAvailable = useMemo(
    () =>
      Boolean(
        !isOutputBusy &&
          historyLineageReady &&
          generatedScript.trim() &&
          (lineageCompareAvailable || hasManualEdits),
      ),
    [
      isOutputBusy,
      historyLineageReady,
      generatedScript,
      lineageCompareAvailable,
      hasManualEdits,
    ],
  );

  const compareBeforeScript = useMemo(() => {
    if (hasManualEdits && scriptCompareBaseline !== null) return scriptCompareBaseline;
    if (lineageCompareAvailable && comparePreviousScript != null) return comparePreviousScript;
    return '';
  }, [
    hasManualEdits,
    scriptCompareBaseline,
    lineageCompareAvailable,
    comparePreviousScript,
  ]);

  const compareBeforeLabel = hasManualEdits
    ? 'Last generated output'
    : `v${(lineageState?.lastVersion ?? 1) - 1} (previous)`;

  const compareAfterLabel = hasManualEdits
    ? 'Current (edited)'
    : `v${lineageState?.lastVersion ?? 1} (current)`;

  const compareEmptyHint = useMemo(() => {
    if (!historyLineageReady) {
      return 'Generate or load a script from History to use Compare.';
    }
    if (!generatedScript.trim()) {
      return 'Generate a script first.';
    }
    if (lineageState && lineageState.lastVersion >= 2 && comparePreviousScript == null) {
      return 'The previous version is not in Script History anymore (older entries may be dropped).';
    }
    return 'Edit the Pine Script in the Script tab, or refine once, to enable Compare.';
  }, [
    historyLineageReady,
    generatedScript,
    lineageState,
    comparePreviousScript,
  ]);

  const handleGeneratedScriptChange = useCallback((value: string) => {
    setGeneratedScript(value);
  }, [setGeneratedScript]);

  useEffect(() => {
    if (outputTab !== 'compare' || compareAvailable) return;
    queueMicrotask(() => {
      setOutputTab('script');
    });
  }, [outputTab, compareAvailable]);

  const handlePresetSelect = (prompt: string, presetId: string) => {
    setStrategy(prompt);
    setActivePreset(presetId);
  };

  const handleStrategyChange = useCallback((value: string) => {
    setStrategy(value);
    setActivePreset(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setOutputTab('script');
    setExplainCancelKey((k) => k + 1);
    setHistoryLineageReady(false);
    lineageRef.current = null;
    setLineageState(null);
    setScriptCompareBaseline(null);
    setActivePreset(null);
    setWebhookPanelOpen(false);
    await generate({
      prompt: strategy,
      balance,
      model: selectedModel,
      structuredInputs,
    });
  }, [canGenerate, strategy, balance, selectedModel, structuredInputs, generate]);

  const handleRefine = useCallback(
    async (instruction: string) => {
      const lineage = lineageRef.current;
      if (!lineage) {
        toast.error('Could not link refinement. Generate or load a script from History.');
        return;
      }
      const previousScript = generatedScript;
      if (!previousScript.trim()) return;

      setOutputTab('script');
      setExplainCancelKey((k) => k + 1);
      setWebhookPanelOpen(false);
      await refine({
        script: previousScript,
        instruction,
        model: selectedModel,
      });
    },
    [generatedScript, selectedModel, refine],
  );

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

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-${Date.now()}.pine`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script downloaded.');
  };

  const onImprovePrompt = useCallback(() => {
    void handleImprovePrompt(strategy, structuredInputs);
  }, [handleImprovePrompt, strategy, structuredInputs]);

  const handleGenerateRef = useRef(handleGenerate);
  const commandOpenRef = useRef(commandOpen);

  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
    commandOpenRef.current = commandOpen;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }
      if (mod && e.key === 'Enter') {
        if (commandOpenRef.current) return;
        e.preventDefault();
        void handleGenerateRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isStreaming = isOutputBusy && Boolean(generatedScript);
  const isIdle = !isOutputBusy && !generatedScript;

  return (
    <>
      <GeneratorCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        canGenerate={canGenerate}
        onGenerate={() => void handleGenerate()}
        canImprove={canImprove}
        onImprovePrompt={onImprovePrompt}
        onOpenHistory={() => onRequestOpenHistory?.()}
        hasScript={Boolean(generatedScript.trim())}
        isOutputBusy={isOutputBusy}
        compareAvailable={compareAvailable}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onStop={stop}
        outputTab={outputTab}
        onOutputTabChange={setOutputTab}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <StrategyInputsCard
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        balance={balance}
        onBalanceChange={setBalance}
        activePreset={activePreset}
        onPresetSelect={handlePresetSelect}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        structuredInputs={structuredInputs}
        onStructuredInputsChange={setStructuredInputs}
        canGenerate={canGenerate}
        isGenerating={isGenerating}
        isOutputBusy={isOutputBusy}
        isImproving={isImproving}
        onGenerate={() => void handleGenerate()}
        onImprovePrompt={onImprovePrompt}
      />

      <StrategyOutputCard
        outputRef={outputRef}
        validationResult={validationResult}
        isOutputBusy={isOutputBusy}
        genElapsed={genElapsed}
        generatedScript={generatedScript}
        webhookPanelOpen={webhookPanelOpen}
        onToggleWebhookPanel={() => setWebhookPanelOpen((open) => !open)}
        onStop={stop}
        onDownload={handleDownload}
        onCopy={handleCopy}
        copied={copied}
        webhookUrl={webhookUrl}
        onWebhookUrlChange={setWebhookUrl}
        outputTab={outputTab}
        onOutputTabChange={setOutputTab}
        isStreaming={isStreaming}
        isIdle={isIdle}
        explainCancelKey={explainCancelKey}
        isGenerating={isGenerating}
        isRefining={isRefining}
        historyLineageReady={historyLineageReady}
        onRefine={handleRefine}
        refineResetKey={refineResetKey}
        compareAvailable={compareAvailable}
        compareBeforeScript={compareBeforeScript}
        compareBeforeLabel={compareBeforeLabel}
        compareAfterLabel={compareAfterLabel}
        compareEmptyHint={compareEmptyHint}
        onGeneratedScriptChange={handleGeneratedScriptChange}
      />
      </div>
    </>
  );
  },
);

StrategyForm.displayName = 'StrategyForm';
