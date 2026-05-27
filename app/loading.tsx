import { Zap } from 'lucide-react';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';

const STAGGER = 'animate-fade-up opacity-0 [animation-fill-mode:forwards]';

export default function RootLoading() {
  return (
    <div className="pf-page relative flex min-h-screen flex-col">
      <TerminalAmbientBackground variant="auth" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="animate-fade-up w-full max-w-md text-center">
          <p className="font-mono text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase sm:text-xs">
            PINEFORGE :: ROUTE //LOADING
            <span
              className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-px animate-blink-cursor bg-neon-500/90 align-baseline dark:bg-neon-400"
              aria-hidden
            />
          </p>

          <div className="terminal-scanlines mt-8 rounded-2xl border border-neon-500/25 bg-zinc-950/60 px-6 py-10 sm:px-10 sm:py-12">
            <div className="animate-pulse-glow mx-auto inline-flex size-14 items-center justify-center rounded-xl border border-neon-500/40 bg-neon-500/15">
              <Zap className="size-6 text-neon-400" aria-hidden />
            </div>

            <h1 className="pf-heading mt-6 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              SYNCING FEED
            </h1>

            <p className="mt-2 font-mono text-xs tracking-[0.2em] text-neon-600 uppercase dark:text-neon-400/90">
              {'// ESTABLISHING CONNECTION'}
            </p>

            <div className="mx-auto mt-8 h-1 max-w-xs overflow-hidden rounded-full bg-zinc-900/70 ring-1 ring-neon-500/10">
              <div className="animate-shimmer h-full w-full rounded-full bg-gradient-to-r from-transparent via-neon-400 to-transparent" />
            </div>

            <ul className="mx-auto mt-8 max-w-xs space-y-1.5 text-left font-mono text-[11px] text-zinc-400">
              <li
                className={`${STAGGER} flex items-center gap-2`}
                style={{ animationDelay: '0ms' }}
              >
                <span className="text-neon-400">{'>'}</span>
                <span className="flex-1">AUTH</span>
                <span className="text-neon-400/80">OK</span>
              </li>
              <li
                className={`${STAGGER} flex items-center gap-2`}
                style={{ animationDelay: '300ms' }}
              >
                <span className="text-neon-400">{'>'}</span>
                <span className="flex-1">TICKERS</span>
                <span className="text-neon-400/80">STREAMING</span>
              </li>
              <li
                className={`${STAGGER} flex items-center gap-2`}
                style={{ animationDelay: '600ms' }}
              >
                <span className="text-neon-400/70">{'>'}</span>
                <span className="flex-1 text-zinc-500">COMPILING</span>
                <span className="inline-flex items-center gap-0.5">
                  <span
                    className="h-1 w-1 animate-pulse rounded-full bg-neon-400/80"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-1 w-1 animate-pulse rounded-full bg-neon-400/80"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-1 w-1 animate-pulse rounded-full bg-neon-400/80"
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
