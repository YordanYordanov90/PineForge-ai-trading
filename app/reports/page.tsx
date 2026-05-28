'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { ComparisonReportCard } from '@/components/reports/ComparisonReportCard';
import { Button } from '@/components/ui/button';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import type { SavedComparisonReport, SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { entries, refreshEntries } = useScriptHistory();

  const [reports, setReports] = useState<SavedComparisonReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  // Scripts relevant to the selected report (for fingerprints + coverage)
  const relevantScripts = selectedReport
    ? entries.filter((e) => selectedReport.scriptIds.includes(Number(e.id)))
    : [];

  const loadReports = useCallback(async () => {
    if (!isSignedIn) {
      setReports([]);
      setIsLoadingReports(false);
      return;
    }
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/comparison-reports');
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.reports)) {
        setReports(json.data.reports);
        // Auto-select most recent on first load
        if (json.data.reports.length > 0 && selectedId == null) {
          setSelectedId(json.data.reports[0].id);
        }
      } else {
        toast.error(json.error ?? 'Failed to load reports');
      }
    } catch {
      toast.error('Could not load comparison reports');
    } finally {
      setIsLoadingReports(false);
    }
  }, [isSignedIn, selectedId]);

  useEffect(() => {
    if (isLoaded) {
      void loadReports();
    }
  }, [isLoaded, isSignedIn, loadReports]);

  // Ensure we have script metadata for fingerprints when a report is selected
  useEffect(() => {
    if (selectedReport && relevantScripts.length !== selectedReport.scriptIds.length) {
      // History may be stale or empty — refresh once
      void refreshEntries();
    }
  }, [selectedReport, relevantScripts.length, refreshEntries]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this comparison report? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/comparison-reports/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (selectedId === id) {
          const remaining = reports.filter((r) => r.id !== id);
          setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success('Report deleted');
      } else {
        toast.error(json.error ?? 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefine = (scriptId: number) => {
    // Minimal: navigate to generate with a hint (future: prefill via query or Forge)
    window.location.href = `/generate?fromReport=1#strategy`;
    toast.info('Open a script in history and use Refine, or start a new generation');
  };

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
        <p className="mt-3 text-zinc-400">Sign in to view and create comparison reports between your strategies.</p>
        <a href="/sign-in" className="mt-6 inline-block text-neon-400 underline">Sign in</a>
      </div>
    );
  }

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
            // Open history drawer if the generator is the main surface (best effort)
            window.location.href = '/generate';
          }}
          className="hidden md:inline-flex"
        >
          Open History to compare
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        {/* List sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-zinc-400">
            <span>Your reports</span>
            <span>{reports.length}</span>
          </div>

          {isLoadingReports ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-zinc-800 bg-[#111111]/60">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-[#111111]/60 p-4 text-sm text-zinc-400">
              No reports yet. Check 2–3 scripts in the History drawer and click “Compare Selected”.
            </div>
          ) : (
            <ul className="space-y-1">
              {reports.map((r) => {
                const active = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                        active
                          ? 'bg-neon-500/10 text-neon-300'
                          : 'hover:bg-zinc-900/60 text-zinc-200',
                      )}
                    >
                      <span className="truncate pr-2">{r.title}</span>
                      <span className="shrink-0 text-[10px] text-zinc-500 group-hover:text-zinc-400">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="ml-3 mt-0.5 text-[10px] text-rose-400/70 hover:text-rose-400 disabled:opacity-50"
                      aria-label={`Delete report ${r.title}`}
                    >
                      {deletingId === r.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <main>
          {selectedReport ? (
            <ComparisonReportCard
              report={selectedReport}
              scripts={relevantScripts.length ? relevantScripts : entries.slice(0, 3)} // graceful fallback
              onRefine={handleRefine}
            />
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#111111]/60 text-center">
              <FileText className="mb-3 h-8 w-8 text-zinc-500" />
              <p className="text-sm text-zinc-400">Select a report from the list to view the full analysis.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
