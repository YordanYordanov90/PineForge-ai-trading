'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type HistoryTagEditorProps = {
  entryId: string;
  value: string;
  pending: boolean;
  onValueChange: (value: string) => void;
  onCommit: (id: string) => void;
  onCancel: () => void;
};

export function HistoryTagEditor({
  entryId,
  value,
  pending,
  onValueChange,
  onCommit,
  onCancel,
}: HistoryTagEditorProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit(entryId);
          if (e.key === 'Escape') onCancel();
        }}
        disabled={pending}
        placeholder="btc, scalp, momentum"
        className="pf-input h-7 flex-1 text-xs"
        aria-label="Edit tags (comma-separated)"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="pf-history-action h-7 px-2 text-xs"
        disabled={pending}
        onClick={() => onCommit(entryId)}
        aria-label="Save tags"
      >
        Save
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="pf-history-action-muted h-7 px-2 text-xs"
        disabled={pending}
        onClick={onCancel}
        aria-label="Cancel tag edit"
      >
        Cancel
      </Button>
    </div>
  );
}
