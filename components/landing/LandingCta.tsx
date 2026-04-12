import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function LandingCta() {
  return (
    <RevealOnScroll>
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center sm:rounded-[3rem] sm:p-12 lg:p-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-linear-to-t from-emerald-900/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="mb-4 font-heading text-2xl font-bold tracking-tight text-white sm:mb-6 sm:text-4xl lg:text-5xl">
            Ready to script smarter?
          </h2>
          <p className="mb-8 max-w-2xl text-base text-zinc-400 sm:mb-10 sm:text-xl">
            Stop writing boilerplate. Start trading strategies. Experience the fastest way to build
            on TradingView.
          </p>

          <Link
            href="/generate"
            className="animate-pulse-glow group relative flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-zinc-950 shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 hover:bg-emerald-400 hover:shadow-[0_0_50px_-8px_rgba(16,185,129,0.8)] sm:px-10 sm:py-5 sm:text-xl sm:shadow-[0_0_50px_-10px_rgba(16,185,129,0.8)] sm:hover:shadow-[0_0_80px_-10px_rgba(16,185,129,1)]"
          >
            Launch Generator Now
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-2 sm:size-6" />
          </Link>
          <p className="mt-4 text-xs text-zinc-500 sm:mt-6 sm:text-sm">No sign-up required for v1. Free to use.</p>
        </div>
      </section>
    </RevealOnScroll>
  );
}