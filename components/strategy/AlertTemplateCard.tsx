'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { AlertTemplateItem } from '@/lib/api/validation';
import { Button } from '@/components/ui/button';
import {
  pfOutputBody,
  pfOutputBorder,
  pfOutputCard,
  pfOutputCodeBlock,
  pfOutputHeading,
  pfOutputMuted,
  pfOutputSectionLabel,
  pfOutputSubtle,
  terminalActiveCard,
} from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type AlertTemplateCardProps = {
  template: AlertTemplateItem;
  isActive: boolean;
  onSelect: () => void;
};

export function AlertTemplateCard({ template, isActive, onSelect }: AlertTemplateCardProps) {
  const [copied, setCopied] = useState(false);

  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(template.messageJson), null, 2);
    } catch {
      return template.messageJson;
    }
  }, [template.messageJson]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      toast.success(`${template.label} JSON copied.`);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('Copy failed. Select the JSON and copy manually.');
    }
  };

  return (
    <article
      className={cn(
        'transition-colors',
        pfOutputCard,
        isActive && terminalActiveCard,
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isActive}
      >
        <div>
          <h3 className={cn('text-sm font-medium', pfOutputHeading)}>{template.label}</h3>
          <p className={cn('mt-0.5 text-xs', pfOutputMuted)}>{template.description}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            isActive
              ? 'border-neon-500/40 bg-neon-500/10 text-neon-700 dark:text-neon-300'
              : 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-500',
          )}
        >
          {template.provider}
        </span>
      </button>

      {isActive ? (
        <div className={cn('space-y-4 border-t px-4 py-4', pfOutputBorder)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn('text-xs font-medium', pfOutputSubtle)}>Message JSON</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
              aria-label={`Copy ${template.label} JSON`}
              className="border-zinc-300 bg-white text-zinc-900 hover:border-neon-500/30 hover:bg-neon-50 hover:text-neon-800 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:text-neon-300"
            >
              {copied ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-neon-400" />
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

          <pre
            className={cn(
              'max-h-[min(280px,40vh)] overflow-auto',
              pfOutputCodeBlock,
            )}
          >
            {formattedJson}
          </pre>

          <section>
            <h4 className={cn('mb-2', pfOutputSectionLabel)}>Replace placeholders</h4>
            <ul className="flex flex-wrap gap-1.5">
              {template.placeholders.map((placeholder) => (
                <li key={placeholder}>
                  <code className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-900/90 dark:text-amber-200/90">
                    {placeholder}
                  </code>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className={cn('mb-2', pfOutputSectionLabel)}>Notes</h4>
            <ul className={cn('space-y-1.5 text-sm', pfOutputSubtle)}>
              {template.notes.map((note, index) => (
                <li key={`${template.provider}-note-${index}`} className="flex gap-2 leading-relaxed">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </article>
  );
}