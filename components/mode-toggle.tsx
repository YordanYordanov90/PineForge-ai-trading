'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toggleThemeWithTransition } from '@/lib/theme/theme-transition';
import { cn } from '@/lib/utils';

type ModeToggleProps = {
  className?: string;
};

export function ModeToggle({ className }: ModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme !== 'light';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const handleToggle = useCallback(async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    try {
      await toggleThemeWithTransition(resolvedTheme, setTheme);
    } finally {
      setIsTransitioning(false);
    }
  }, [resolvedTheme, setTheme, isTransitioning]);

  return (
    <TooltipProvider>
    <ActionTooltip label={label} side="bottom">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn('relative pf-nav-muted shrink-0', className)}
        onClick={handleToggle}
        aria-label={label}
        disabled={!mounted || isTransitioning}
      >
        <Sun
          className={cn(
            'h-4 w-4 transition-all',
            isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90',
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            'absolute h-4 w-4 transition-all',
            isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0',
          )}
          aria-hidden
        />
        <span className="sr-only">{label}</span>
      </Button>
    </ActionTooltip>
    </TooltipProvider>
  );
}
