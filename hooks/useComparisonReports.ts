'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { SavedComparisonReport } from '@/lib/types';

type ApiListResponse = {
  success: boolean;
  data?: { reports?: SavedComparisonReport[] } | null;
  error?: string | null;
};

type ApiDeleteResponse = {
  success: boolean;
  error?: string | null;
};

export function useComparisonReports() {
  const { isSignedIn, isLoaded } = useUser();

  const [reports, setReports] = useState<SavedComparisonReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setReports([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/comparison-reports');
      const json = (await res.json()) as ApiListResponse;
      if (json.success && Array.isArray(json.data?.reports)) {
        const next = json.data.reports;
        setReports(next);
        setSelectedId((prev) => (prev == null && next.length > 0 ? next[0].id : prev));
      } else {
        toast.error(json.error ?? 'Failed to load reports');
      }
    } catch {
      toast.error('Could not load comparison reports');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded) void refresh();
  }, [isLoaded, refresh]);

  const deleteReport = useCallback(
    async (id: number) => {
      if (!confirm('Delete this comparison report? This cannot be undone.')) return;
      setDeletingId(id);
      try {
        const res = await fetch(`/api/comparison-reports/${id}`, { method: 'DELETE' });
        const json = (await res.json()) as ApiDeleteResponse;
        if (json.success) {
          setReports((prev) => {
            const next = prev.filter((r) => r.id !== id);
            setSelectedId((current) =>
              current === id ? (next.length > 0 ? next[0].id : null) : current,
            );
            return next;
          });
          toast.success('Report deleted');
        } else {
          toast.error(json.error ?? 'Delete failed');
        }
      } catch {
        toast.error('Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  return {
    reports,
    isLoading,
    selectedId,
    selectedReport,
    setSelectedId,
    deletingId,
    deleteReport,
    refresh,
  };
}
