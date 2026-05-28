'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ReportsSidebar } from '@/components/reports/ReportsSidebar';
import { ReportsDetail } from '@/components/reports/ReportsDetail';
import { useComparisonReports } from '@/hooks/useComparisonReports';
import { useScriptHistory } from '@/hooks/useScriptHistory';

export default function ReportsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { entries, refreshEntries } = useScriptHistory();
  const {
    reports,
    isLoading,
    selectedId,
    selectedReport,
    setSelectedId,
    deletingId,
    deleteReport,
  } = useComparisonReports();

  const relevantScripts = selectedReport
    ? entries.filter((e) => selectedReport.scriptIds.includes(Number(e.id)))
    : [];

  useEffect(() => {
    if (selectedReport && relevantScripts.length !== selectedReport.scriptIds.length) {
      void refreshEntries();
    }
  }, [selectedReport, relevantScripts.length, refreshEntries]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <FileText className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
        <h1 className="pf-heading text-3xl">Strategy Comparison Reports</h1>
        <p className="mt-3 text-zinc-400">
          Sign in to view and create comparison reports between your strategies.
        </p>
        <Link href="/sign-in" className="mt-6 inline-block text-neon-400 underline">
          Sign in
        </Link>
      </div>
    );
  }

  const handleRefine = () => {
    window.location.href = `/generate?fromReport=1#strategy`;
    toast.info('Open a script in history and use Refine, or start a new generation');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="pf-heading text-3xl">Comparison Reports</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Side-by-side analysis of 2–3 strategies from your library. Select scripts in History → Compare Selected.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = '/generate';
          }}
          className="hidden md:inline-flex"
        >
          Open History to compare
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <ReportsSidebar
          reports={reports}
          selectedId={selectedId}
          deletingId={deletingId}
          isLoading={isLoading}
          onSelect={setSelectedId}
          onDelete={deleteReport}
        />
        <main>
          <ReportsDetail
            report={selectedReport}
            scripts={relevantScripts.length ? relevantScripts : entries.slice(0, 3)}
            onRefine={handleRefine}
          />
        </main>
      </div>
    </div>
  );
}
