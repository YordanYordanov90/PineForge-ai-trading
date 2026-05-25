import { cn } from '@/lib/utils';
import { terminalNoise } from '@/lib/ui/terminal-texture';

type TerminalAmbientBackgroundProps = {
  variant: 'auth' | 'generate';
  className?: string;
};

export function TerminalAmbientBackground({
  variant,
  className,
}: TerminalAmbientBackgroundProps) {
  const isAuth = variant === 'auth';

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'terminal-grid-bg absolute inset-0',
          isAuth ? 'opacity-[0.08]' : 'opacity-[0.05]',
        )}
      />
      <div
        className={cn(
          terminalNoise,
          'absolute inset-0',
          isAuth ? 'opacity-[0.18]' : 'opacity-[0.12]',
        )}
      />
    </div>
  );
}
