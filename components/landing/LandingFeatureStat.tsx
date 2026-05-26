import { LANDING_AVG_GENERATION_LABEL } from '@/lib/config/constants';
import { RevealOnScroll } from './RevealOnScroll';

export function LandingFeatureStat() {
  return (
    <RevealOnScroll className="mb-20 sm:mb-32 lg:mb-40">
      <section
        aria-label="Average generation time"
        className="relative isolate mx-auto max-w-5xl overflow-x-clip px-2 sm:px-6"
      >
        <div
          className="pointer-events-none absolute -left-12 top-1/2 -z-10 size-72 -translate-y-1/2 rounded-full bg-neon-500/15 blur-3xl dark:bg-neon-500/10"
          aria-hidden
        />

        <p className="mb-4 flex items-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-neon-700 sm:text-xs dark:text-neon-400">
          <span className="h-px w-8 bg-neon-600/60 sm:w-12 dark:bg-neon-400/50" />
          Stat 01 / Generation time
        </p>

        <div className="grid items-end gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <p
            className="font-heading text-[clamp(5rem,16vw,10rem)] font-extrabold leading-[0.9] tracking-tight bg-linear-to-br from-neon-600 via-neon-700 to-neon-900 bg-clip-text text-transparent dark:from-neon-300 dark:via-neon-400 dark:to-neon-600"
            aria-label={`${LANDING_AVG_GENERATION_LABEL} average from prompt to validated Pine`}
          >
            {LANDING_AVG_GENERATION_LABEL}
          </p>

          <div className="flex flex-col gap-3 pb-2 sm:pb-6">
            <p className="font-heading text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-100">
              From prompt to{' '}
              <span className="text-neon-700 dark:text-neon-400">validated Pine</span>.
            </p>
            <p className="max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              Streaming output from xAI Grok via the Vercel AI SDK. Most strategies finish
              before your coffee gets cold.
            </p>
          </div>
        </div>

        <div
          className="mt-6 h-px w-full bg-linear-to-r from-neon-600/40 via-zinc-300 to-transparent dark:from-neon-400/40 dark:via-zinc-800"
          aria-hidden
        />
      </section>
    </RevealOnScroll>
  );
}
