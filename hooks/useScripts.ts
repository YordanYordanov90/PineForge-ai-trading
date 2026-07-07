'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchApiScripts } from '@/lib/scripts/api-history-store';
import type { SavedScript } from '@/lib/types';

type UseScriptsOptions = {
  enabled?: boolean;
};

/**
 * Loads the signed-in user's script list from `GET /api/scripts`.
 * Used by Forge's script picker when no prefetched list is supplied.
 */
export function useScripts({ enabled = true }: UseScriptsOptions = {}) {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setScripts([]);
      return;
    }

    setLoading(true);
    try {
      const list = await fetchApiScripts();
      setScripts(list);
    } catch {
      toast.error('Could not load your script history.');
      setScripts([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { scripts, loading, refresh };
}