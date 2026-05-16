import Link from "next/link";
import { Activity, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="mb-20 flex flex-col items-center justify-between gap-10 sm:mb-32 sm:gap-14 lg:mb-40 lg:flex-row lg:gap-16">
      <div className="flex-1 space-y-6 text-center sm:space-y-8 lg:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium tracking-wide text-emerald-400 uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          v1.1 Live · AI-Powered
        </div>

        <h1 className="font-heading text-balance text-4xl font-extrabold leading-[1.15] tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
          From idea to{" "}
          <span className="bg-linear-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Pine Script
          </span>{" "}
          in seconds.
        </h1>

        <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0 lg:text-xl">
          Instantly turn natural language into production-ready Pine Script v5. Complete with
          3-tier alerts, dynamic SL/TP, and exact risk sizing.
          <strong className="ml-1 font-medium text-zinc-200">No coding required.</strong>
        </p>

        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4 lg:justify-start">
          <Link
            href="/generate"
            className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-base font-bold text-zinc-950 shadow-[0_0_25px_-6px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_40px_-6px_rgba(16,185,129,0.7)] sm:w-auto sm:py-4 sm:text-lg sm:shadow-[0_0_40px_-10px_rgba(16,185,129,0.6)] sm:hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.8)]"
          >
            Start Generating
            <Sparkles className="size-5 transition-transform group-hover:rotate-12" />
          </Link>
          <Link
            href="#how-it-works"
            className="group flex w-full items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-white backdrop-blur-md transition-all hover:border-zinc-700 hover:bg-zinc-800 sm:w-auto sm:py-4 sm:text-lg"
          >
            View Examples
          </Link>
        </div>
      </div>

      <div className="relative w-full max-w-md flex-1 sm:max-w-lg lg:perspective-[2000px]">
        <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-emerald-500/20 to-transparent blur-2xl" />
        <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-2xl backdrop-blur-xl transition-all duration-700 ease-out lg:-rotate-y-12 lg:rotate-x-[5deg] lg:hover:rotate-y-0 lg:hover:rotate-x-0">
          <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex gap-1.5 sm:gap-2">
              <div className="size-2.5 rounded-full bg-rose-500/80 sm:size-3" />
              <div className="size-2.5 rounded-full bg-amber-500/80 sm:size-3" />
              <div className="size-2.5 rounded-full bg-emerald-500/80 sm:size-3" />
            </div>
            <div className="mx-auto flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 sm:gap-2 sm:text-xs">
              <Activity className="size-2.5 sm:size-3" /> strategy.pine
            </div>
          </div>
          <div className="relative p-3 font-mono text-[10px] leading-relaxed sm:p-6 sm:text-sm">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-size-[100%_24px]" />
            <div className="mb-3 text-zinc-400 sm:mb-4">
              <span className="text-emerald-500">❯</span> User:{" "}
              <span className="truncate text-zinc-200">
                &quot;9 EMA crosses 21 EMA, 2% risk&quot;
              </span>
            </div>
            <div className="space-y-0.5 sm:space-y-1 text-emerald-300/90 opacity-90">
              <p className="truncate">
                <span className="text-zinc-500">1</span>{" "}
                <span className="text-purple-400">{"//@version=5"}</span>
              </p>
              <p className="truncate">
                <span className="text-zinc-500">2</span>{" "}
                <span className="text-blue-400">indicator</span>(
                <span className="text-emerald-200">&quot;EMA Cross&quot;</span>,{" "}
                <span className="text-orange-300">overlay</span>{" "}
                <span className="text-blue-400">=</span>{" "}
                <span className="text-orange-300">true</span>)
              </p>
              <p>
                <span className="text-zinc-500">3</span>{" "}
              </p>
              <p className="truncate">
                <span className="text-zinc-500">4</span>{" "}
                <span className="text-zinc-600">{"// Risk Mgmt"}</span>
              </p>
              <p className="truncate">
                <span className="text-zinc-500">5</span>{" "}
                <span className="text-blue-400">float</span> bal{" "}
                <span className="text-blue-400">=</span>{" "}
                <span className="text-orange-300">10000.0</span>
              </p>
              <p className="truncate">
                <span className="text-zinc-500">6</span>{" "}
                <span className="text-blue-400">float</span> risk{" "}
                <span className="text-blue-400">=</span>{" "}
                <span className="text-orange-300">0.02</span>
              </p>
              <p className="truncate">
                <span className="text-zinc-500">7</span>{" "}
                <span className="text-blue-400">float</span> amt{" "}
                <span className="text-blue-400">=</span> bal{" "}
                <span className="text-blue-400">*</span> risk
              </p>
              <p>
                <span className="text-zinc-500">8</span>{" "}
              </p>
              <p className="animate-pulse truncate duration-1000">
                <span className="text-zinc-500">9</span>{" "}
                <span className="text-zinc-600">{"// Logic... █"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}