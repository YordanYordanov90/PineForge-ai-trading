'use client';

import { useCallback, useState } from 'react';

function bumpKey(setter: (fn: (k: number) => number) => void) {
  setter((k) => k + 1);
}

export function useStrategyRefineSession() {
  const [refineResetKey, setRefineResetKey] = useState(0);
  const [refinePrefillInstruction, setRefinePrefillInstruction] = useState('');
  const [refinePrefillNonce, setRefinePrefillNonce] = useState(0);

  const bumpRefineResetKey = useCallback(() => {
    bumpKey(setRefineResetKey);
  }, []);

  const handlePrefillRefine = useCallback((instruction: string) => {
    setRefinePrefillInstruction(instruction);
    setRefinePrefillNonce((n) => n + 1);
  }, []);

  return {
    refineResetKey,
    refinePrefillInstruction,
    refinePrefillNonce,
    bumpRefineResetKey,
    handlePrefillRefine,
  };
}
