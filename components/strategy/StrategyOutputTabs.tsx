'use client';

import {
  Activity,
  BarChart3,
  Bell,
  Code2,
  FlaskConical,
  GitCompareArrows,
  ListChecks,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AlertTemplatesPanel } from '@/components/strategy/AlertTemplatesPanel';
import { BacktestSummaryPanel } from '@/components/strategy/BacktestSummaryPanel';
import { BreakdownTab } from '@/components/strategy/BreakdownTab';
import { ExplainScriptPanel } from '@/components/strategy/ExplainScriptPanel';
import { HealthScorePanel } from '@/components/strategy/HealthScorePanel';
import { OutputTabTrigger } from '@/components/strategy/OutputTabTrigger';
import { ScriptComparePanel } from '@/components/strategy/ScriptComparePanel';
import { ScriptOutput } from '@/components/strategy/ScriptOutput';
import { TerminalOutputChrome } from '@/components/strategy/TerminalOutputChrome';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';
import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import type { GrokModel } from '@/lib/config/constants';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import { isOutputTab, type OutputTab } from '@/components/strategy/output-tab-types';
import { cn } from '@/lib/utils';
import {
  pfOutputMuted,
  terminalCodeSurface,
  terminalCodeSurfacePanel,
  terminalCodeSurfaceStreaming,
} from '@/lib/ui/terminal-texture';
import type { RefObject } from 'react';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';

type StrategyOutputTabsProps = {
  outputRef: RefObject<HTMLDivElement | null>;
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  isStreaming: boolean;
  isIdle: boolean;
  isOutputBusy: boolean;
  validationResult: ValidationResult | null;
  generatedScript: string;
  strategyPrompt: string;
  accountBalance: string;
  selectedModel: GrokModel['id'];
  structuredInputs: StructuredInputsValue;
  explainCancelKey: number;
  healthScoreResetKey: number;
  backtestSummaryResetKey: number;
  alertTemplatesResetKey: number;
  compareAvailable: boolean;
  compareBeforeScript: string;
  compareBeforeLabel: string;
  compareAfterLabel: string;
  compareEmptyHint: string;
  assumptions?: StrategyAssumptions | null;
  loadedScriptId?: number | null;
  onGeneratedScriptChange: (value: string) => void;
  onSuggestionClick?: (prompt: string) => void;
  onPrefillRefine?: (instruction: string) => void;
  onBreakdownChange: (text: string | null) => void;
  onHealthResultChange: (result: HealthScoreResult | null) => void;
  onBacktestResultChange: (result: BacktestSummaryResult | null) => void;
  onAlertResultChange: (result: AlertTemplatesResult | null) => void;
};

export function StrategyOutputTabs({
  outputRef,
  outputTab,
  onOutputTabChange,
  isStreaming,
  isIdle,
  isOutputBusy,
  validationResult,
  generatedScript,
  strategyPrompt,
  accountBalance,
  selectedModel,
  structuredInputs,
  explainCancelKey,
  healthScoreResetKey,
  backtestSummaryResetKey,
  alertTemplatesResetKey,
  compareAvailable,
  compareBeforeScript,
  compareBeforeLabel,
  compareAfterLabel,
  compareEmptyHint,
  assumptions,
  loadedScriptId = null,
  onGeneratedScriptChange,
  onSuggestionClick,
  onPrefillRefine,
  onBreakdownChange,
  onHealthResultChange,
  onBacktestResultChange,
  onAlertResultChange,
}: StrategyOutputTabsProps) {
  const isScriptFinal = !isOutputBusy && Boolean(generatedScript.trim());
  const hasScript = Boolean(generatedScript.trim());

  return (
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
          if (isOutputTab(v)) onOutputTabChange(v);
        }}
        className="relative min-h-0 gap-0"
      >
        <TabsList
          variant="line"
          className="pf-tabs-bar sticky top-0 z-20 w-full min-w-0 justify-start gap-0 overflow-x-auto rounded-none border-b px-1 pt-0 backdrop-blur-md supports-backdrop-filter:bg-zinc-50/95 dark:supports-backdrop-filter:bg-zinc-900/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <TooltipProvider>
            <ActionTooltip label="Script (1)">
              <OutputTabTrigger value="script" icon={Code2} label="Script" />
            </ActionTooltip>
            <ActionTooltip label="Breakdown (2)">
              <OutputTabTrigger value="breakdown" icon={BarChart3} label="Breakdown" />
            </ActionTooltip>
            <ActionTooltip label="Checklist (3)">
              <OutputTabTrigger value="checklist" icon={ListChecks} label="Checklist" />
            </ActionTooltip>
            {hasScript ? (
              <ActionTooltip label="Health (4)">
                <OutputTabTrigger value="health" icon={Activity} label="Health" />
              </ActionTooltip>
            ) : null}
            {hasScript ? (
              <ActionTooltip label="Backtest (6)">
                <OutputTabTrigger value="backtest" icon={FlaskConical} label="Backtest" />
              </ActionTooltip>
            ) : null}
            {hasScript ? (
              <ActionTooltip label="Alerts (5)">
                <OutputTabTrigger value="alerts" icon={Bell} label="Alerts" />
              </ActionTooltip>
            ) : null}
            <ActionTooltip label="Compare (7)">
              <OutputTabTrigger
                value="compare"
                icon={GitCompareArrows}
                label="Compare"
                disabled={!compareAvailable}
              />
            </ActionTooltip>
          </TooltipProvider>
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
            isScriptFinal={isScriptFinal}
            cancelKey={explainCancelKey}
            containedScroll={false}
            onBreakdownChange={onBreakdownChange}
            assumptions={assumptions ?? null}
          />
        </TabsContent>
        <TabsContent value="checklist" forceMount className="mt-0 min-h-0 data-[state=inactive]:hidden">
          <ExplainScriptPanel
            mode="checklist"
            script={generatedScript}
            isTabActive={outputTab === 'checklist'}
            isScriptFinal={isScriptFinal}
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
            isScriptFinal={isScriptFinal}
            resetKey={healthScoreResetKey}
            onPrefillRefine={onPrefillRefine}
            onResultChange={onHealthResultChange}
            assumptions={assumptions ?? null}
            scriptId={loadedScriptId ?? undefined}
          />
        </TabsContent>
        <TabsContent value="backtest" forceMount className="mt-0 data-[state=inactive]:hidden">
          <BacktestSummaryPanel
            prompt={strategyPrompt}
            script={generatedScript}
            model={selectedModel}
            balance={accountBalance}
            structuredInputs={structuredInputs}
            isScriptFinal={isScriptFinal}
            resetKey={backtestSummaryResetKey}
            onResultChange={onBacktestResultChange}
          />
        </TabsContent>
        <TabsContent value="alerts" forceMount className="mt-0 data-[state=inactive]:hidden">
          <AlertTemplatesPanel
            prompt={strategyPrompt}
            script={generatedScript}
            model={selectedModel}
            balance={accountBalance}
            structuredInputs={structuredInputs}
            isScriptFinal={isScriptFinal}
            resetKey={alertTemplatesResetKey}
            onResultChange={onAlertResultChange}
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
  );
}