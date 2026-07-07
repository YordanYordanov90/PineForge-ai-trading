'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { exportStrategySnapshot } from '@/actions/export-snapshot';
import type {
  AlertTemplatesResult,
  BacktestSummaryResult,
  HealthScoreResult,
} from '@/lib/api/validation';
import type { GrokModel } from '@/lib/config/constants';
import { buildExportMarkdownFromContext } from '@/lib/export/build-export-markdown';
import { downloadBlob, snapshotExportFilename } from '@/lib/export/download';
import { downloadMarkdownFile } from '@/lib/export/download-markdown';
import {
  buildStrategyExportSource,
  DEFAULT_EXPORT_TITLE,
  type StrategyExportSource,
} from '@/lib/export/source';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';

type UseStrategyOutputExportOptions = {
  exportTitle?: string;
  strategyPrompt: string;
  generatedScript: string;
  selectedModel: GrokModel['id'];
  structuredInputs: StructuredInputsValue;
  accountBalance: string;
  exportCreatedAt?: string | null;
  compareBeforeScript: string;
  resetKeysComposite: string;
};

export function useStrategyOutputExport({
  exportTitle,
  strategyPrompt,
  generatedScript,
  selectedModel,
  structuredInputs,
  accountBalance,
  exportCreatedAt = null,
  compareBeforeScript,
  resetKeysComposite,
}: UseStrategyOutputExportOptions) {
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [breakdownText, setBreakdownText] = useState<string | null>(null);
  const [healthExportResult, setHealthExportResult] =
    useState<HealthScoreResult | null>(null);
  const [alertExportResult, setAlertExportResult] =
    useState<AlertTemplatesResult | null>(null);
  const [backtestExportResult, setBacktestExportResult] =
    useState<BacktestSummaryResult | null>(null);

  const [prevResetKeys, setPrevResetKeys] = useState(resetKeysComposite);
  if (prevResetKeys !== resetKeysComposite) {
    setPrevResetKeys(resetKeysComposite);
    setBreakdownText(null);
    setHealthExportResult(null);
    setAlertExportResult(null);
    setBacktestExportResult(null);
    setExportPanelOpen(false);
    setMarkdownCopied(false);
  }

  const buildMarkdown = useCallback(() => {
    return buildExportMarkdownFromContext({
      title: exportTitle?.trim() || DEFAULT_EXPORT_TITLE,
      prompt: strategyPrompt,
      script: generatedScript,
      model: selectedModel,
      structuredInputs: { ...structuredInputs, balance: accountBalance },
      breakdown: breakdownText,
      createdAt: exportCreatedAt,
      healthScore: healthExportResult,
      alertTemplates: alertExportResult,
      backtestSummary: backtestExportResult,
    });
  }, [
    exportTitle,
    strategyPrompt,
    generatedScript,
    selectedModel,
    structuredInputs,
    accountBalance,
    breakdownText,
    exportCreatedAt,
    healthExportResult,
    alertExportResult,
    backtestExportResult,
  ]);

  const handleCopyMarkdown = useCallback(async () => {
    const markdown = buildMarkdown();
    if (!markdown.trim()) {
      toast.error('Nothing to export yet. Generate a script first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(markdown);
      setMarkdownCopied(true);
      toast.success('Markdown copied — paste into Notion or Obsidian.');
      window.setTimeout(() => setMarkdownCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Try Download .md instead.');
    }
  }, [buildMarkdown]);

  const handleDownloadMarkdown = useCallback(() => {
    const markdown = buildMarkdown();
    if (!markdown.trim()) {
      toast.error('Nothing to export yet. Generate a script first.');
      return;
    }
    const title = exportTitle?.trim() || DEFAULT_EXPORT_TITLE;
    downloadMarkdownFile(title, markdown);
    toast.success('Markdown file downloaded.');
  }, [buildMarkdown, exportTitle]);

  const handleSnapshotExport = useCallback(async () => {
    if (!generatedScript.trim()) {
      toast.error('Nothing to export yet. Generate a script first.');
      return;
    }
    const title = exportTitle?.trim() || DEFAULT_EXPORT_TITLE;
    const src: StrategyExportSource = buildStrategyExportSource({
      title,
      prompt: strategyPrompt,
      script: generatedScript,
      model: selectedModel ?? null,
      structuredInputs: { ...structuredInputs, balance: accountBalance },
      breakdown: breakdownText,
      createdAt: exportCreatedAt,
    });

    try {
      const res = await exportStrategySnapshot(src, {
        healthScore: healthExportResult,
        alertTemplates: alertExportResult,
        backtestSummary: backtestExportResult,
        comparisonBaseline: compareBeforeScript || undefined,
      });
      if (!res.success || !res.data?.html) {
        if (res.error?.includes('Pro')) {
          toast.error(res.error, {
            action: { label: 'View pricing', onClick: () => (window.location.href = '/pricing') },
          });
        } else {
          toast.error(res.error || 'Snapshot export failed.');
        }
        return;
      }
      downloadBlob(res.data.html, snapshotExportFilename(title), 'text/html');
      toast.success('Snapshot HTML downloaded. Open in any browser (offline ready).');
    } catch {
      toast.error('Snapshot generation failed. Please try again.');
    }
  }, [
    generatedScript,
    exportTitle,
    strategyPrompt,
    selectedModel,
    structuredInputs,
    accountBalance,
    breakdownText,
    exportCreatedAt,
    healthExportResult,
    alertExportResult,
    backtestExportResult,
    compareBeforeScript,
  ]);

  return {
    exportPanelOpen,
    setExportPanelOpen,
    markdownCopied,
    breakdownText,
    setBreakdownText,
    setHealthExportResult,
    setAlertExportResult,
    setBacktestExportResult,
    handleCopyMarkdown,
    handleDownloadMarkdown,
    handleSnapshotExport,
    hasOptionalExportSections: Boolean(
      healthExportResult || alertExportResult || backtestExportResult,
    ),
  };
}