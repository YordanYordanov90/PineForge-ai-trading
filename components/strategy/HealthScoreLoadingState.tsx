import { Loader2 } from 'lucide-react';
import { pfOutputBody, pfOutputMuted } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

export function HealthScoreLoadingState() {
  return (
    <div className="px-6 py-10" role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" aria-hidden />
        <p className={cn('text-sm', pfOutputBody)}>Analyzing strategy structure…</p>
        <p className={cn('text-xs', pfOutputMuted)}>Usually takes a few seconds</p>
      </div>
    </div>
  );
}
