'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import type { SavedComparisonReport } from '@/lib/types';

function hasReport(json: unknown): json is { data: { report: SavedComparisonReport } } {
  if (typeof json !== 'object' || json === null) return false;
  const data = (json as Record<string, unknown>).data;
  return typeof data === 'object' && data !== null && 'report' in data;
}

type UseScriptComparisonSelectionOptions = {
  onOpenChange: (open: boolean) => void;
};

/**
 * Multi-select state + POST `/api/comparison-reports` for the history drawer (spec 63).
 */
export function useScriptComparisonSelection({
  onOpenChange,
}: UseScriptComparisonSelectionOptions) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isComparing, setIsComparing] = useState(false);

  const selectedCount = selectedIds.size;
  const canCompare = selectedCount >= 2 && selectedCount <= 3;

  const toggleSelect = useCallback(
    (id: number) => {
      if (isComparing) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (next.size >= 3) {
            toast.info('Compare up to 3 strategies at a time');
            return prev;
          }
          next.add(id);
        }
        return next;
      });
    },
    [isComparing],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCompareSelected = useCallback(async () => {
    if (!canCompare || isComparing) return;

    const scriptIds = Array.from(selectedIds).sort((a, b) => a - b);
    setIsComparing(true);
    const toastId = toast.loading('Generating comparison report…', {
      description: 'Forge is analysing your strategies. This usually takes 10–30 seconds.',
    });

    try {
      const res = await fetch('/api/comparison-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptIds }),
      });
      const json: unknown = await res.json().catch(() => null);
      if (res.ok && hasReport(json)) {
        toast.success('Comparison report generated', { id: toastId });
        clearSelection();
        onOpenChange(false);
        router.push('/reports');
      } else {
        toast.error(
          messageFromApiErrorJson(
            json,
            'Failed to create comparison report.',
            'Failed to create comparison report.',
          ),
          { id: toastId },
        );
      }
    } catch {
      toast.error('Comparison failed. Please try again.', { id: toastId });
    } finally {
      setIsComparing(false);
    }
  }, [canCompare, isComparing, selectedIds, clearSelection, onOpenChange, router]);

  return {
    selectedIds,
    selectedCount,
    canCompare,
    isComparing,
    toggleSelect,
    clearSelection,
    handleCompareSelected,
  };
}