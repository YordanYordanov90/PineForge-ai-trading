'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ResearchSummaryPayload } from '@/lib/api/validation';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';

export function useForgeResearchHandoff(activeConversationId: number | null) {
  const router = useRouter();
  const [isGeneratingFromResearch, setIsGeneratingFromResearch] = useState(false);

  const handleGenerateFromResearch = useCallback(async () => {
    if (!activeConversationId) return;
    setIsGeneratingFromResearch(true);
    try {
      const res = await fetch('/api/forge/research-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId }),
      });
      const json: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          messageFromApiErrorJson(
            json,
            'Could not generate research summary.',
            'Research handoff failed. Please try again.',
          ),
        );
        return;
      }

      const summary = (json as { data?: { summary?: ResearchSummaryPayload } })?.data?.summary;
      if (!summary || typeof summary.description !== 'string') {
        toast.error('Received an invalid research summary from Forge.');
        return;
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('pineforge_research_handoff', JSON.stringify(summary));
      }

      router.push('/generate');
    } catch {
      toast.error('Network error — could not reach Forge summariser.');
    } finally {
      setIsGeneratingFromResearch(false);
    }
  }, [activeConversationId, router]);

  return { isGeneratingFromResearch, handleGenerateFromResearch };
}