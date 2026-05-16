'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildWebhookJsonExport } from '@/lib/scripts/webhook-export';
import { Check, Copy } from 'lucide-react';

type WebhookJsonPanelProps = {
  webhookUrl: string;
  onWebhookUrlChange: (value: string) => void;
};

export function WebhookJsonPanel({ webhookUrl, onWebhookUrlChange }: WebhookJsonPanelProps) {
  const [jsonCopied, setJsonCopied] = useState(false);

  const payload = useMemo(() => buildWebhookJsonExport(webhookUrl), [webhookUrl]);
  const formatted = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setJsonCopied(true);
      toast.success('JSON copied to clipboard.');
      setTimeout(() => setJsonCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Please select and copy manually.');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-json-url" className="text-zinc-300">
          Webhook URL
        </Label>
        <Input
          id="webhook-json-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://your-server.com/webhook"
          value={webhookUrl}
          onChange={(e) => onWebhookUrlChange(e.target.value)}
          className="border-zinc-800 bg-black/40 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-400">JSON preview</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
          >
            {jsonCopied ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy JSON
              </span>
            )}
          </Button>
        </div>
        <pre className="max-h-[min(360px,45vh)] overflow-auto rounded-lg border border-zinc-800/70 bg-black/55 p-3 font-mono text-[11px] leading-relaxed text-emerald-100/90 sm:text-xs">
          {formatted}
        </pre>
      </div>
    </div>
  );
}
