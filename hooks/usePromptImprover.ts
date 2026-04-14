'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';

type UsePromptImproverOptions = {
  onSuccess: (improvedPrompt: string) => void;
};

export function usePromptImprover(options: UsePromptImproverOptions) {
  const [isImproving, setIsImproving] = useState(false);
  const improveInFlightRef = useRef(false);

  const handleImprovePrompt = useCallback(
    async (strategy: string, structuredInputs: StructuredInputsValue) => {
      if (!strategy.trim() || improveInFlightRef.current) return;
      improveInFlightRef.current = true;
      setIsImproving(true);

      try {
        const res = await fetch('/api/improve-prompt', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            prompt: strategy,
            ...structuredInputs,
          }),
        });

        if (!res.ok) {
          toast.error('Could not improve prompt. Try again.');
          return;
        }

        const data: unknown = await res.json();
        if (typeof data === 'object' && data && 'improvedPrompt' in data) {
          options.onSuccess((data as { improvedPrompt: string }).improvedPrompt.slice(0, 1500));
          toast.success('Prompt improved!');
          return;
        }
        toast.error('Unexpected response. Please try again.');
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        improveInFlightRef.current = false;
        setIsImproving(false);
      }
    },
    [options],
  );

  return { isImproving, handleImprovePrompt };
}
