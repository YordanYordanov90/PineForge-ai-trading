import { RevealOnScroll } from "./RevealOnScroll";

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="relative mb-20 border-y border-zinc-900 py-12 sm:mb-32 sm:py-20 lg:mb-40 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-zinc-950/50 backdrop-blur-xl" />

      <RevealOnScroll className="relative z-10 mb-10 text-center sm:mb-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          From thought to trade in <span className="text-emerald-500">15 seconds.</span>
        </h2>
      </RevealOnScroll>

      <div className="relative z-10 mx-auto grid max-w-5xl gap-8 sm:gap-12 md:grid-cols-3">
        <div className="absolute top-12 left-[16%] right-[16%] hidden h-px bg-linear-to-r from-zinc-800 via-emerald-500/50 to-zinc-800 md:block" />

        <RevealOnScroll className="group relative flex flex-col items-center text-center" delay={0}>
          <div className="relative z-10 mb-4 flex size-16 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-950 transition-all group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] sm:mb-6 sm:size-24">
            <span className="font-heading text-xl font-bold text-zinc-500 transition-colors group-hover:text-emerald-400 sm:text-2xl">
              1
            </span>
          </div>
          <h4 className="mb-2 font-heading text-lg font-semibold text-white sm:mb-3 sm:text-xl">Describe It</h4>
          <p className="max-w-xs text-xs text-zinc-400 sm:text-sm">
            Type your strategy ideas in plain English. Add your account size and preferred
            timeframe.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="group relative flex flex-col items-center text-center" delay={90}>
          <div className="relative z-10 mb-4 flex size-16 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.15)] sm:mb-6 sm:size-24">
            <span className="font-heading text-xl font-bold text-emerald-400 sm:text-2xl">2</span>
          </div>
          <h4 className="mb-2 font-heading text-lg font-semibold text-white sm:mb-3 sm:text-xl">PineForge Writes It</h4>
          <p className="max-w-xs text-xs text-zinc-400 sm:text-sm">
            Our custom AI instantly streams out validated, commented, and structured Pine Script
            v5.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="group relative flex flex-col items-center text-center" delay={180}>
          <div className="relative z-10 mb-4 flex size-16 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-950 transition-all group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] sm:mb-6 sm:size-24">
            <span className="font-heading text-xl font-bold text-zinc-500 transition-colors group-hover:text-emerald-400 sm:text-2xl">
              3
            </span>
          </div>
          <h4 className="mb-2 font-heading text-lg font-semibold text-white sm:mb-3 sm:text-xl">You Trade It</h4>
          <p className="max-w-xs text-xs text-zinc-400 sm:text-sm">
            Copy the code into TradingView, set up your alerts, and let your automated strategy
            run.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}