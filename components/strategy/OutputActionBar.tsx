'use client';

import Link from 'next/link';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
  Webhook,
} from 'lucide-react';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { terminalActivePressed } from '@/lib/ui/terminal-texture';

const iconActionClass =
  'border border-zinc-800 text-white hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30';

type OutputActionBarProps = {
  generatedScript: string;
  isOutputBusy: boolean;
  copied: boolean;
  webhookPanelOpen: boolean;
  exportPanelOpen: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onOpenInTradingView: () => void;
  onToggleWebhookPanel: () => void;
  onToggleExportPanel: () => void;
  /**
   * DB id of the currently-loaded script. When set, render a
   * "Discuss with Forge" entry point that navigates to
   * `/forge?scriptId=<id>` so the Forge Agent loads this script as
   * initial context (spec 57 § Entry Points → "Discuss with Forge").
   * Hidden when the script hasn't been saved yet (no id) or the
   * user is signed-out / mid-stream — same gating spec defines.
   */
  forgeScriptId?: number | null;
};

export function OutputActionBar({
  generatedScript,
  isOutputBusy,
  copied,
  webhookPanelOpen,
  exportPanelOpen,
  onCopy,
  onDownload,
  onOpenInTradingView,
  onToggleWebhookPanel,
  onToggleExportPanel,
  forgeScriptId,
}: OutputActionBarProps) {
  const canUseActions = Boolean(generatedScript.trim()) && !isOutputBusy;

  if (!canUseActions) {
    return null;
  }

  const canDiscussWithForge =
    typeof forgeScriptId === 'number' && Number.isFinite(forgeScriptId);

  return (
    <TooltipProvider>
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        role="toolbar"
        aria-label="Export actions"
      >
        {canDiscussWithForge ? (
          <ActionTooltip label="Open this script in the Forge Agent">
            <Button
              asChild
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              aria-label="Discuss this script with Forge"
            >
              <Link href={`/forge?scriptId=${forgeScriptId}`}>
                <Sparkles className="size-3.5" aria-hidden />
                Discuss with Forge
              </Link>
            </Button>
          </ActionTooltip>
        ) : null}
        <ActionTooltip label="Copy script to clipboard">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCopy}
            aria-label={copied ? 'Copied to clipboard' : 'Copy script to clipboard'}
            className={iconActionClass}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Download .pine file">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDownload}
            aria-label="Download .pine file"
            className={iconActionClass}
          >
            <Download className="h-4 w-4" aria-hidden />
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Copy script and open Pine Editor" shortcut="t">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onOpenInTradingView}
            aria-label="Open in TradingView"
            className={cn(
              iconActionClass,
              'text-emerald-400 hover:text-emerald-300',
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
        </ActionTooltip>

        <ActionTooltip
          label={exportPanelOpen ? 'Hide Markdown export' : 'Export Markdown for Notion / Obsidian'}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleExportPanel}
            aria-pressed={exportPanelOpen}
            aria-label="Export Markdown note"
            className={cn(iconActionClass, exportPanelOpen && terminalActivePressed)}
          >
            <FileText className="h-4 w-4" aria-hidden />
          </Button>
        </ActionTooltip>

        <ActionTooltip
          label={webhookPanelOpen ? 'Hide webhook JSON' : 'Show webhook JSON export'}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleWebhookPanel}
            aria-pressed={webhookPanelOpen}
            aria-label="Webhook JSON export"
            className={cn(iconActionClass, webhookPanelOpen && terminalActivePressed)}
          >
            <Webhook className="h-4 w-4" aria-hidden />
          </Button>
        </ActionTooltip>
      </div>
    </TooltipProvider>
  );
}
