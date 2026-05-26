'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

type CopyScriptButtonProps = {
  script: string;
};

export function CopyScriptButton({ script }: CopyScriptButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success('Script copied to clipboard');
    } catch {
      toast.error('Could not copy script');
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500"
    >
      <Copy className="h-3.5 w-3.5" /> Copy script
    </button>
  );
}
