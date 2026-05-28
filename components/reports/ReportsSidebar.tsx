'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SavedComparisonReport } from '@/lib/types';

type ReportsSidebarProps = {
  reports: SavedComparisonReport[];
  selectedId: number | null;
  deletingId: number | null;
  isLoading: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
};

export function ReportsSidebar({
  reports,
  selectedId,
  deletingId,
  isLoading,
  onSelect,
  onDelete,
}: ReportsSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-wider text-zinc-400">
        <span>Your reports</span>
        <span>{reports.length}</span>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-zinc-800 bg-[#111111]/60">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#111111]/60 p-4 text-sm text-zinc-400">
          No reports yet. Check 2–3 scripts in the History drawer and click “Compare Selected”.
        </div>
      ) : (
        <ul className="space-y-1">
          {reports.map((r) => (
            <ReportsSidebarItem
              key={r.id}
              report={r}
              active={r.id === selectedId}
              deleting={deletingId === r.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

type ReportsSidebarItemProps = {
  report: SavedComparisonReport;
  active: boolean;
  deleting: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
};

function ReportsSidebarItem({
  report,
  active,
  deleting,
  onSelect,
  onDelete,
}: ReportsSidebarItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(report.id)}
        className={cn(
          'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
          active
            ? 'bg-neon-500/10 text-neon-300'
            : 'hover:bg-zinc-900/60 text-zinc-200',
        )}
      >
        <span className="truncate pr-2">{report.title}</span>
        <span className="shrink-0 text-[10px] text-zinc-500 group-hover:text-zinc-400">
          {new Date(report.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(report.id)}
        disabled={deleting}
        className="ml-3 mt-0.5 text-[10px] text-rose-400/70 hover:text-rose-400 disabled:opacity-50"
        aria-label={`Delete report ${report.title}`}
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </li>
  );
}
