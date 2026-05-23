'use client';

import { useCallback, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { copyAndOpenTradingView } from '@/lib/scripts/tradingview';

type UseStrategyOutputActionsOptions = {
  generatedScript: string;
  outputRef: RefObject<HTMLDivElement | null>;
};

export function useStrategyOutputActions({
  generatedScript,
  outputRef,
}: UseStrategyOutputActionsOptions) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success('Copied to clipboard.');
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Please copy manually from the output.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-${Date.now()}.pine`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script downloaded.');
  };

  const handleOpenInTradingView = useCallback(() => {
    void copyAndOpenTradingView(generatedScript).then(() => {
      toast.success('Script copied — paste it in Pine Editor');
    });
  }, [generatedScript]);

  return {
    outputRef,
    copied,
    setCopied,
    handleCopy,
    handleDownload,
    handleOpenInTradingView,
  };
}
