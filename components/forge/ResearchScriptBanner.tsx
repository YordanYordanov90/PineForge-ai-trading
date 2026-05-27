'use client';

import { useState } from 'react';
import { FlaskConical, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedScript } from '@/lib/types';
import { ScriptPickerDialog } from './ScriptPickerDialog';

type AttachedScript = {
  id: number;
  name: string | null;
};

type ResearchScriptBannerProps = {
  variant: 'empty' | 'active';
  attachedScript: AttachedScript | null;
  onUpdateScript: (
    scriptId: number | null,
    scriptName?: string | null,
  ) => Promise<boolean>;
  className?: string;
};

export function ResearchScriptBanner({
  variant,
  attachedScript,
  onUpdateScript,
  className,
}: ResearchScriptBannerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isEmpty = variant === 'empty';
  const hasScript = attachedScript != null;

  const handleAttachOrChange = async (script: SavedScript) => {
    const numericId = Number.parseInt(script.id, 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return false;
    }
    return onUpdateScript(numericId, script.name ?? null);
  };

  const handleDetach = async () => {
    return onUpdateScript(null, null);
  };

  const containerClass = isEmpty
    ? `mx-auto mb-8 w-full max-w-3xl rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 ${className ?? ''}`
    : `mb-3 flex items-center gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 ${className ?? ''}`;

  if (!hasScript) {
    return (
      <>
        <div className={containerClass}>
          <div className="flex items-start gap-3">
            <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">No script attached to this research thread.</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  className="h-auto px-2 py-0.5 text-amber-400 underline decoration-amber-500/50 underline-offset-2 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  Load from history
                </Button>
                <span className="pf-muted">to give Forge script context for this thread.</span>
              </div>
            </div>
          </div>
        </div>

        <ScriptPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleAttachOrChange}
        />
      </>
    );
  }

  // Attached state
  const displayName = attachedScript.name || 'Untitled strategy';

  return (
    <>
      <div className={containerClass}>
        <div className="flex w-full items-center gap-2">
          <FlaskConical className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">
            Script: <span className="text-amber-300">{displayName}</span>
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="h-auto gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <RefreshCw className="size-3" aria-hidden />
              change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleDetach()}
              className="h-auto gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <X className="size-3" aria-hidden />
              detach
            </Button>
          </div>
        </div>
      </div>

      <ScriptPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAttachOrChange}
      />
    </>
  );
}
