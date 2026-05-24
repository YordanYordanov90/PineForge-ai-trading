'use client';

import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ForgeScrollToBottomFabProps = {
  visible: boolean;
  onClick: () => void;
};

export function ForgeScrollToBottomFab({
  visible,
  onClick,
}: ForgeScrollToBottomFabProps) {
  if (!visible) return null;

  return (
    <Button
      type="button"
      size="icon-sm"
      aria-label="Scroll to latest messages"
      onClick={onClick}
      className={cn(
        'absolute bottom-4 right-4 z-20 rounded-sm border border-emerald-500/40',
        'bg-white/90 shadow-lg backdrop-blur-sm hover:bg-emerald-500/10',
        'dark:bg-zinc-900/90 dark:hover:bg-emerald-500/15',
      )}
    >
      <ArrowDown className="size-4 text-emerald-600 dark:text-emerald-400" />
    </Button>
  );
}
