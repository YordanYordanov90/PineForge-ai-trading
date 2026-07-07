'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConversationRenameRowProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  busy: boolean;
};

export function ConversationRenameRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy,
}: ConversationRenameRowProps) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void onSubmit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={200}
        disabled={busy}
        aria-label="Rename conversation"
        className="pf-input h-7 px-2 text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => void onSubmit()}
        disabled={busy}
        aria-label="Save rename"
      >
        <Check className="size-3" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onCancel}
        disabled={busy}
        aria-label="Cancel rename"
      >
        <X className="size-3" aria-hidden />
      </Button>
    </div>
  );
}