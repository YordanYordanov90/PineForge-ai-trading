'use client';

import { FileText } from 'lucide-react';
import { ComparisonReportCard } from '@/components/reports/ComparisonReportCard';
import type { SavedComparisonReport, SavedScript } from '@/lib/types';

type ReportsDetailProps = {
  report: SavedComparisonReport | null;
  scripts: SavedScript[];
  onRefine?: (scriptId: number) => void;
};

export function ReportsDetail({ report, scripts, onRefine }: ReportsDetailProps) {
  if (!report) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#111111]/60 text-center">
        <FileText className="mb-3 h-8 w-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Select a report from the list to view the full analysis.
        </p>
      </div>
    );
  }

  return <ComparisonReportCard report={report} scripts={scripts} onRefine={onRefine} />;
}
