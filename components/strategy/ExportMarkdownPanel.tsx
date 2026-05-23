'use client';

import { Check, Copy, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pfOutputMuted } from '@/lib/ui/terminal-texture';

type ExportMarkdownPanelProps = {
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  includesBreakdown: boolean;
  includesOptionalSections: boolean;
};

export function ExportMarkdownPanel({
  copied,
  onCopy,
  onDownload,
  includesBreakdown,
  includesOptionalSections,
}: ExportMarkdownPanelProps) {
  return (
    <div
      className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/70 dark:bg-zinc-950/50"
      role="region"
      aria-label="Markdown export for Notion and Obsidian"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <FileText
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400/90"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
              Export note (Notion / Obsidian)
            </p>
            <p className={cn('text-xs leading-relaxed', pfOutputMuted)}>
              Copy or download clean Markdown with your prompt, metadata, Pine
              Script, and any loaded tabs.
              {!includesBreakdown ? (
                <>
                  {' '}
                  Open the <span className="text-zinc-600 dark:text-zinc-400">Breakdown</span>{' '}
                  tab first to include that section.
                </>
              ) : null}
              {includesOptionalSections ? (
                <> Health, Alerts, and Backtest summaries are included when loaded.</>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-zinc-300 bg-white hover:bg-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950/40"
            onClick={onCopy}
            aria-label={copied ? 'Markdown copied' : 'Copy Markdown to clipboard'}
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" aria-hidden />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy Markdown'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-zinc-300 bg-white hover:bg-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950/40"
            onClick={onDownload}
            aria-label="Download Markdown file"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Download .md
          </Button>
        </div>
      </div>
    </div>
  );
}
