'use client';

import { useErrorLogger } from '@/hooks/useErrorLogger';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useErrorLogger(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0,
              transparent 47px,
              rgba(16, 185, 129, 0.08) 47px,
              rgba(16, 185, 129, 0.08) 48px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 47px,
              rgba(16, 185, 129, 0.08) 47px,
              rgba(16, 185, 129, 0.08) 48px
            )`,
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none fixed -top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
          aria-hidden
        />

        <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
          <p className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
            PINEFORGE :: ROUTE //CRITICAL
            <span className="ml-0.5 inline-block h-[1em] w-[0.55em] bg-emerald-500/90 align-baseline" />
          </p>

          <div className="mt-10 max-w-lg rounded-2xl border border-rose-500/30 bg-zinc-950/80 px-8 py-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
              SYSTEM HALT
            </h1>
            <p className="mt-3 font-mono text-xs tracking-[0.2em] text-rose-400/90 uppercase">
              // ROOT LAYOUT FAULT
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Core services failed to initialize. Retry or return to the homepage.
            </p>
            {error.digest ? (
              <p className="mt-4 font-mono text-[10px] tracking-wide text-zinc-500">
                FAULT_ID :: {error.digest}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400 sm:w-auto"
              >
                Try again
              </button>
              <a
                href="/"
                className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 sm:w-auto"
              >
                Back to home
              </a>
            </div>
          </div>

          <svg
            viewBox="0 0 200 48"
            className="mt-10 h-10 w-48 opacity-70"
            aria-hidden
          >
            <polyline
              points="0,28 24,12 48,32 72,8 96,36 120,16 144,28 168,10 200,24"
              fill="none"
              stroke="rgb(244 63 94 / 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </main>
      </body>
    </html>
  );
}
