import { Skeleton } from '@/components/ui/skeleton';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';

const PILL_WIDTHS = ['w-14', 'w-16', 'w-20', 'w-24', 'w-28', 'w-16', 'w-[5.5rem]', 'w-20'] as const;

function codeLineWidth(index: number): string {
  const pct = 50 + ((index * 23) % 50);
  return `${pct}%`;
}

function GenerateRouteHeader() {
  return (
    <p className="mb-8 font-mono text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase sm:text-xs">
      PINEFORGE :: ROUTE //GENERATE
      <span
        className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-px animate-blink-cursor bg-emerald-500/90 align-baseline dark:bg-emerald-400"
        aria-hidden
      />
    </p>
  );
}

function GenerateHeaderSkeleton() {
  return (
    <header className="mb-10 sm:mb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-4">
          <Skeleton className="h-7 w-56 rounded-full" />
          <Skeleton className="h-10 w-48 max-w-full rounded-md sm:h-12 sm:w-56" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-xl rounded-md" />
            <Skeleton className="h-4 w-[85%] max-w-lg rounded-md" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 sm:pt-1">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function InputsCardSkeleton() {
  return (
    <div className="pf-card terminal-scanlines rounded-xl border p-4 sm:p-5">
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
        // GENERATOR :: SYNCING
      </p>
      <div className="mt-4 space-y-1">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-4 w-full max-w-sm rounded-md" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {PILL_WIDTHS.map((width, i) => (
          <Skeleton key={i} className={`h-7 ${width} rounded-full`} />
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-36 w-full rounded-md" />
        <Skeleton className="h-3 w-3/4 max-w-xs rounded-sm" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-full rounded-full sm:w-36" />
      </div>
    </div>
  );
}

function OutputCardSkeleton() {
  return (
    <div className="pf-card terminal-scanlines rounded-xl border p-4 sm:p-5">
      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
        // OUTPUT :: STANDBY
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-[4.5rem] rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800/40 bg-black/30 p-4 dark:border-zinc-800/70">
        <div className="space-y-2.5">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-3 rounded-sm"
              style={{ width: codeLineWidth(i) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GenerateLoading() {
  return (
    <div className="pf-page relative min-h-screen">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 py-10 pb-28 sm:py-14 sm:pb-32">
        <GenerateRouteHeader />
        <GenerateHeaderSkeleton />

        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <InputsCardSkeleton />
          <OutputCardSkeleton />
        </div>
      </div>
    </div>
  );
}
