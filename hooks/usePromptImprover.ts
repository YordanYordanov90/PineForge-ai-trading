'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { parseApiSuccessEnvelope } from '@/lib/api/parse-envelope';
import { z } from 'zod';

const improvePromptDataSchema = z.object({
  improvedPrompt: z.string(),
});

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
          const maybeJson: unknown = await res.json().catch(() => null);
          toast.error(
            messageFromApiErrorJson(
              maybeJson,
              'Invalid input. Try again.',
              'Could not improve prompt. Try again.',
            ),
          );
          return;
        }

        const data: unknown = await res.json();
        const parsed = parseApiSuccessEnvelope(data, improvePromptDataSchema);
        if (!parsed) {
          toast.error('Unexpected response. Please try again.');
          return;
        }
        options.onSuccess(parsed.improvedPrompt.slice(0, 1500));
        toast.success('Prompt improved!');
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
