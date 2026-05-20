'use client';

import { Check, Copy, Download, ExternalLink, Webhook } from 'lucide-react';
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
  onCopy: () => void;
  onDownload: () => void;
  onOpenInTradingView: () => void;
  onToggleWebhookPanel: () => void;
};

export function OutputActionBar({
  generatedScript,
  isOutputBusy,
  copied,
  webhookPanelOpen,
  onCopy,
  onDownload,
  onOpenInTradingView,
  onToggleWebhookPanel,
}: OutputActionBarProps) {
  const canUseActions = Boolean(generatedScript.trim()) && !isOutputBusy;

  if (!canUseActions) {
    return null;
  }

  return (
    <TooltipProvider>
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        role="toolbar"
        aria-label="Export actions"
      >
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
