import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { LandingHeroTerminal } from './LandingHeroTerminal';

const STAGGER = 'animate-fade-up opacity-0 [animation-fill-mode:forwards]';

export function LandingHero() {
  return (
    <section className="mb-12 flex flex-col items-center justify-between gap-10 sm:mb-16 sm:gap-14 lg:mb-20 lg:flex-row lg:gap-16">
      <div className="flex-1 space-y-6 text-center sm:space-y-8 lg:text-left">
        <p
          className={`${STAGGER} font-mono text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase sm:text-xs dark:text-zinc-500`}
          style={{ animationDelay: '0ms' }}
        >
          PineForge / Generator / v1.1
        </p>

        <div
          className={`${STAGGER} inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium tracking-wide text-emerald-700 uppercase dark:border-emerald-500/20 dark:text-emerald-400`}
          style={{ animationDelay: '120ms' }}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75 dark:bg-emerald-400" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          v1.1 Live · AI-Powered
        </div>

        <h1
          className={`${STAGGER} font-heading text-balance text-4xl font-extrabold leading-[1.1] tracking-tighter text-zinc-900 dark:text-zinc-100 sm:text-5xl lg:text-7xl xl:text-8xl`}
          style={{ animationDelay: '200ms' }}
        >
          From idea to{' '}
          <span className="bg-linear-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-600">
            Pine Script
          </span>{' '}
          in seconds.
        </h1>

        <p
          className={`${STAGGER} mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg lg:mx-0 lg:text-xl`}
          style={{ animationDelay: '350ms' }}
        >
          Instantly turn natural language into production-ready Pine Script v5. Complete with
          3-tier alerts, dynamic SL/TP, and exact risk sizing.
          <strong className="ml-1 font-medium text-zinc-800 dark:text-zinc-200">
            No coding required.
          </strong>
        </p>

        <div
          className={`${STAGGER} flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4 lg:justify-start`}
          style={{ animationDelay: '450ms' }}
        >
          <Link
            href="/generate"
            className="motion-btn-press group relative flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-600/30 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-[0_0_25px_-6px_rgba(16,185,129,0.5)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_40px_-6px_rgba(16,185,129,0.7)] sm:w-auto sm:py-4 sm:text-lg"
          >
            Start Generating
            <Sparkles className="size-5 transition-transform group-hover:rotate-12" />
          </Link>
          <Link
            href="#examples"
            className="motion-btn-press group flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-8 py-3.5 text-base font-medium text-zinc-700 backdrop-blur-md transition-all hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:hover:border-zinc-700 dark:hover:bg-zinc-800 sm:w-auto sm:py-4 sm:text-lg"
          >
            View Examples
          </Link>
        </div>
      </div>

      <div className={`${STAGGER} w-full flex-1`} style={{ animationDelay: '600ms' }}>
        <LandingHeroTerminal />
      </div>
    </section>
  );
}
