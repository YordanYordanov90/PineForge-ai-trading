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
          isAuth ? 'opacity-50' : 'opacity-35',
        )}
      />
      {isAuth ? (
        <>
          <div className="terminal-ambient-glow absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.15] blur-[120px]" />
          <div className="terminal-ambient-glow absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[100px]" />
          <div className="terminal-ambient-glow absolute -bottom-1/4 right-0 h-[600px] w-[600px] rounded-full bg-emerald-600/[0.12] blur-[100px]" />
        </>
      ) : (
        <>
          <div className="terminal-ambient-glow terminal-glow-breathe absolute -top-1/4 left-[10%] h-[700px] w-[700px] rounded-full bg-emerald-500/[0.12] blur-[120px]" />
          <div className="terminal-ambient-glow absolute -bottom-1/4 right-[5%] h-[550px] w-[550px] rounded-full bg-emerald-600/[0.08] blur-[100px]" />
        </>
      )}
      <div
        className={cn(
          terminalNoise,
          'absolute inset-0',
          isAuth ? 'opacity-60' : 'opacity-[0.28]',
        )}
      />
    </div>
  );
}
