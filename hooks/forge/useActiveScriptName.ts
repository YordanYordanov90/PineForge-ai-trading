'use client';

import { useEffect } from 'react';
import { fetchApiScripts } from '@/lib/scripts/api-history-store';

type UseActiveScriptNameOptions = {
  activeScriptId: number | null;
  activeScriptName: string | null;
  setActiveScriptName: (name: string | null) => void;
};

/**
 * Resolves the display name for an attached research script when hydration
 * only provides the numeric `scriptId`.
 */
export function useActiveScriptName({
  activeScriptId,
  activeScriptName,
  setActiveScriptName,
}: UseActiveScriptNameOptions) {
  useEffect(() => {
    if (activeScriptId == null || activeScriptName != null) return;

    let cancelled = false;

    void (async () => {
      try {
        const list = await fetchApiScripts();
        if (cancelled) return;

        const match = list.find(
          (script) => Number.parseInt(script.id, 10) === activeScriptId,
        );
        if (match) {
          setActiveScriptName(match.name ?? null);
        }
      } catch {
        /* banner falls back to "Untitled strategy" */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeScriptId, activeScriptName, setActiveScriptName]);
}