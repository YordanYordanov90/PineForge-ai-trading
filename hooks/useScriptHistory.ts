'use client';

import { useUser } from '@clerk/nextjs';
import { useApiScriptHistory } from '@/hooks/strategy/useApiScriptHistory';
import { useLocalScriptHistory } from '@/hooks/strategy/useLocalScriptHistory';

export {
  buildSavedScriptFromGeneration,
  buildSavedScriptFromRefinement,
} from '@/lib/scripts/build-saved-script';

export function useScriptHistory() {
  const { isSignedIn, isLoaded } = useUser();
  const useApi = isLoaded && !!isSignedIn;

  const local = useLocalScriptHistory();
  const api = useApiScriptHistory(useApi);

  const active = useApi ? api : local;

  return {
    entries: active.entries,
    addEntry: active.addEntry,
    renameEntry: active.renameEntry,
    deleteEntry: active.deleteEntry,
    toggleStarEntry: active.toggleStarEntry,
    setTagsEntry: active.setTagsEntry,
    setCollectionEntry: active.setCollectionEntry,
    refreshEntries: api.refreshEntries,
  };
}
