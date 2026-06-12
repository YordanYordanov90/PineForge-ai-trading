'use client';

import { useRouter } from 'next/navigation';
import { useModKeyLabel } from '@/hooks/useShortcutLabel';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';

export type GeneratorCommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canGenerate: boolean;
  onGenerate: () => void;
  canImprove: boolean;
  onImprovePrompt: () => void;
  onOpenHistory: () => void;
  hasScript: boolean;
  isOutputBusy: boolean;
  compareAvailable: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onOpenInTradingView: () => void;
  onStop: () => void;
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  onRunHealthScore?: () => void;
  onRunBacktestSummary?: () => void;
  onRunAlertTemplates?: () => void;
};

const itemClass =
  'rounded-xl text-zinc-200 data-[selected=true]:bg-neon-500/15 data-[selected=true]:text-neon-100';

export function GeneratorCommandMenu({
  open,
  onOpenChange,
  canGenerate,
  onGenerate,
  canImprove,
  onImprovePrompt,
  onOpenHistory,
  hasScript,
  isOutputBusy,
  compareAvailable,
  onCopy,
  onDownload,
  onOpenInTradingView,
  onStop,
  outputTab,
  onOutputTabChange,
  onRunHealthScore,
  onRunBacktestSummary,
  onRunAlertTemplates,
}: GeneratorCommandMenuProps) {
  const router = useRouter();
  const mod = useModKeyLabel();

  const canCopyOrDownload = hasScript && !isOutputBusy;
  const canStop = isOutputBusy;
  const canOpenCompare = compareAvailable && !isOutputBusy;

  const closeThen = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Commands"
      description="Search actions for the strategy generator"
      showCloseButton={false}
      className={cn(
        'top-[20%] max-h-[min(480px,85vh)] translate-y-0 gap-0 border border-zinc-800/70 bg-zinc-950 p-0 text-zinc-100 shadow-2xl shadow-black/50 sm:max-w-lg',
        '[&_[data-slot=dialog-header]]:sr-only',
      )}
    >
      <Command
        className="max-h-[min(440px,80vh)] rounded-none border-0 bg-zinc-950 text-zinc-100 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500"
        shouldFilter
      >
        <CommandInput
          placeholder="Search commands…"
          className="border-0 bg-transparent text-zinc-100 placeholder:text-zinc-500"
        />
        <CommandList className="max-h-[min(360px,65vh)]">
          <CommandEmpty className="text-zinc-500">No matching commands.</CommandEmpty>

          <CommandGroup heading="Generate">
            <CommandItem
              disabled={!canGenerate}
              className={itemClass}
              onSelect={() => {
                if (!canGenerate) return;
                closeThen(() => void onGenerate());
              }}
              value="generate pine script"
            >
              Generate Pine Script
              <CommandShortcut className="font-mono text-zinc-500">{mod}+↵</CommandShortcut>
            </CommandItem>
            <CommandItem
              disabled={!canImprove}
              className={itemClass}
              onSelect={() => {
                if (!canImprove) return;
                closeThen(() => onImprovePrompt());
              }}
              value="improve my prompt"
            >
              Improve My Prompt
            </CommandItem>
            <CommandItem
              className={itemClass}
              onSelect={() => {
                closeThen(() => onOpenHistory());
              }}
              value="open script history"
            >
              Open Script History
              <CommandShortcut className="font-mono text-zinc-500">{mod}+H</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-zinc-800/70" />

          <CommandGroup heading="Output">
            <CommandItem
              disabled={!canStop}
              className={itemClass}
              onSelect={() => {
                if (!canStop) return;
                closeThen(() => onStop());
              }}
              value="stop streaming"
            >
              Stop generation
            </CommandItem>
            <CommandItem
              disabled={!canCopyOrDownload}
              className={itemClass}
              onSelect={() => {
                if (!canCopyOrDownload) return;
                closeThen(() => void onCopy());
              }}
              value="copy script"
            >
              Copy script
            </CommandItem>
            <CommandItem
              disabled={!canCopyOrDownload}
              className={itemClass}
              onSelect={() => {
                if (!canCopyOrDownload) return;
                closeThen(() => onDownload());
              }}
              value="download pine"
            >
              Download .pine
            </CommandItem>
            <CommandItem
              disabled={!canCopyOrDownload}
              className={itemClass}
              onSelect={() => {
                if (!canCopyOrDownload) return;
                closeThen(() => void onOpenInTradingView());
              }}
              value="open in tradingview pine editor"
            >
              Open in TradingView
              <CommandShortcut className="font-mono text-zinc-500">{mod}+T</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-zinc-800/70" />

          <CommandGroup heading="View">
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('script'));
              }}
              value="tab script"
            >
              Script tab
              {outputTab === 'script' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('breakdown'));
              }}
              value="tab breakdown"
            >
              Breakdown tab
              {outputTab === 'breakdown' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('checklist'));
              }}
              value="tab checklist"
            >
              Checklist tab
              {outputTab === 'checklist' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('health'));
              }}
              value="tab health score"
            >
              Health tab
              {outputTab === 'health' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('alerts'));
              }}
              value="tab alert templates"
            >
              Alerts tab
              {outputTab === 'alerts' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!canOpenCompare}
              className={itemClass}
              onSelect={() => {
                if (!canOpenCompare) return;
                closeThen(() => onOutputTabChange('compare'));
              }}
              value="tab compare diff"
            >
              Compare tab
              {outputTab === 'compare' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                closeThen(() => onOutputTabChange('backtest'));
              }}
              value="tab backtest"
            >
              Backtest tab
              {outputTab === 'backtest' ? (
                <CommandShortcut className="text-neon-400/90">Active</CommandShortcut>
              ) : null}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-zinc-800/70" />

          <CommandGroup heading="Run">
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                if (onRunHealthScore) closeThen(onRunHealthScore);
                else closeThen(() => onOutputTabChange('health'));
              }}
              value="run health score"
            >
              Run Health Score
              <CommandShortcut className="font-mono text-zinc-500">{mod}+⇧H</CommandShortcut>
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                if (onRunBacktestSummary) closeThen(onRunBacktestSummary);
                else closeThen(() => onOutputTabChange('backtest'));
              }}
              value="run backtest summary"
            >
              Run Backtest Summary
              <CommandShortcut className="font-mono text-zinc-500">{mod}+⇧B</CommandShortcut>
            </CommandItem>
            <CommandItem
              disabled={!hasScript}
              className={itemClass}
              onSelect={() => {
                if (!hasScript) return;
                if (onRunAlertTemplates) closeThen(onRunAlertTemplates);
                else closeThen(() => onOutputTabChange('alerts'));
              }}
              value="run alert templates"
            >
              Run Alert Templates
              <CommandShortcut className="font-mono text-zinc-500">{mod}+⇧A</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-zinc-800/70" />

          <CommandGroup heading="Navigate">
            <CommandItem
              className={itemClass}
              onSelect={() => {
                closeThen(() => {
                  const el = document.getElementById('strategy');
                  el?.focus();
                });
              }}
              value="focus strategy description"
            >
              Focus strategy description
            </CommandItem>
            <CommandItem
              className={itemClass}
              onSelect={() => {
                closeThen(() => router.push('/'));
              }}
              value="go to home landing"
            >
              Go to landing page
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-zinc-800/70" />

          <CommandGroup heading="Keyboard Shortcuts">
            <div className="px-2 py-1 text-[11px] leading-snug text-zinc-500">
              [1–7] Switch tabs · [⌘H] History · [⌘D] Download · [⌘⇧H/B/A] Run Health/Backtest/Alerts · [j/k] nav history (open) · [⌘.] Stop
            </div>
          </CommandGroup>
        </CommandList>

        <div className="border-t border-zinc-800/70 px-3 py-2 text-center text-[10px] text-zinc-500">
          {mod}+K toggle · Escape to close
        </div>
      </Command>
    </CommandDialog>
  );
}
