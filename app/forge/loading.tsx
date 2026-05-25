import { Skeleton } from '@/components/ui/skeleton';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';

export default function ForgeLoading() {
  return (
    <div className="pf-page relative flex min-h-screen flex-col">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="border-b border-zinc-200/70 bg-zinc-50/80 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-full" />
            </div>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <aside className="hidden w-72 shrink-0 border-r border-zinc-200/70 bg-zinc-50/60 p-3 lg:block dark:border-zinc-800/70 dark:bg-zinc-950/40">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          </aside>

          <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
            <p className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase sm:text-xs">
              PINEFORGE :: ROUTE //FORGE
              <span
                className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-px animate-blink-cursor bg-neon-500/90 align-baseline dark:bg-neon-400"
                aria-hidden
              />
            </p>
            <div className="mx-auto w-full max-w-3xl space-y-4">
              <Skeleton className="h-8 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <div className="mt-8 space-y-3">
                {[60, 80, 70, 50].map((width, i) => (
                  <Skeleton
                    key={i}
                    className="h-4 rounded-sm"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mx-auto mt-auto w-full max-w-3xl">
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
