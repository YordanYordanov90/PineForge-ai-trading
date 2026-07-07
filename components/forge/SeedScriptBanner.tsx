'use client';

import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedScript } from '@/lib/types';

type SeedScriptBannerProps = {
  script: SavedScript;
};

export function SeedScriptBanner({ script }: SeedScriptBannerProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-start gap-3 rounded-sm border border-neon-500/30 border-l-2 border-l-neon-500 bg-neon-500/[0.08] p-3 shadow-lg shadow-black/10 backdrop-blur-md dark:bg-neon-500/[0.12] dark:shadow-black/40">
        <div className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-neon-500/10 text-neon-500 dark:text-neon-400">
          <ScrollText className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neon-700 dark:text-neon-200">
            Forge has loaded your script: {script.name || 'Untitled strategy'}
          </p>
          <p className="pf-muted mt-0.5 text-xs leading-relaxed">
            Ask anything about it — Forge can run a Health Score, refine the script, or generate alerts.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/forge">Dismiss</Link>
        </Button>
      </div>
    </div>
  );
}