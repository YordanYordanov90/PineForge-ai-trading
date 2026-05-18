'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
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
};

function useModLabel() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return 'Ctrl';
    return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
  }, []);
}

const itemClass =
  'rounded-xl text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-100';

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
}: GeneratorCommandMenuProps) {
  const router = useRouter();
  const mod = useModLabel();

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
                <CommandShortcut className="text-emerald-400/90">Active</CommandShortcut>
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
                <CommandShortcut className="text-emerald-400/90">Active</CommandShortcut>
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
                <CommandShortcut className="text-emerald-400/90">Active</CommandShortcut>
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
                <CommandShortcut className="text-emerald-400/90">Active</CommandShortcut>
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
                <CommandShortcut className="text-emerald-400/90">Active</CommandShortcut>
              ) : null}
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
        </CommandList>

        <div className="border-t border-zinc-800/70 px-3 py-2 text-center text-[10px] text-zinc-500">
          {mod}+K toggle · Escape to close
        </div>
      </Command>
    </CommandDialog>
  );
}
