import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LandingHeroTerminal } from './LandingHeroTerminal';
import { LandingScrollIndicator } from './LandingScrollIndicator';

const STAGGER = 'animate-fade-up opacity-0 [animation-fill-mode:forwards]';

export function LandingHero() {
  return (
    <section
      id="hero"
      className="relative mb-12 flex flex-col items-center justify-between gap-10 sm:mb-16 sm:gap-14 lg:mb-20 lg:flex-row lg:gap-16"
    >
      <div className="flex-1 space-y-6 text-center sm:space-y-8 lg:text-left">
        <p
          className={`${STAGGER} font-mono text-[10px] font-medium tracking-[0.3em] text-neon-500 uppercase sm:text-xs`}
          style={{ animationDelay: '0ms' }}
        >
          PineForge / Generator
        </p>

        <h1
          className={`${STAGGER} font-heading text-balance text-4xl font-extrabold leading-[1.05] tracking-tighter text-zinc-900 sm:text-5xl lg:text-7xl xl:text-8xl dark:text-white`}
          style={{ animationDelay: '120ms' }}
        >
          From idea to <span className="text-neon-500">Pine Script</span> in seconds.
        </h1>

        <p
          className={`${STAGGER} mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg lg:mx-0 lg:text-xl dark:text-zinc-400`}
          style={{ animationDelay: '250ms' }}
        >
          Instantly turn natural language into production-ready Pine Script v5. Complete with
          3-tier alerts, dynamic SL/TP, and exact risk sizing.
          <strong className="ml-1 font-medium text-zinc-800 dark:text-zinc-200">
            No coding required.
          </strong>
        </p>

        <div
          className={`${STAGGER} flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4 lg:justify-start`}
          style={{ animationDelay: '350ms' }}
        >
          <Link
            href="/generate"
            className="motion-btn-press group flex w-full items-center justify-center gap-2 rounded-full border border-neon-500 px-8 py-3.5 text-base font-bold text-neon-500 transition-colors hover:bg-neon-500/10 sm:w-auto sm:py-4 sm:text-lg"
          >
            Start Generating
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#examples"
            className="motion-btn-press flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 px-8 py-3.5 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 sm:w-auto sm:py-4 sm:text-lg dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
          >
            View Examples
          </Link>
        </div>
      </div>

      <div className={`${STAGGER} w-full flex-1`} style={{ animationDelay: '450ms' }}>
        <LandingHeroTerminal />
      </div>
      <LandingScrollIndicator />
    </section>
  );
}
