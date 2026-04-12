import { Activity, Code2, LineChart, ShieldAlert, TerminalSquare } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function LandingFeatureGrid() {
  return (
    <section className="mb-20 sm:mb-32 lg:mb-40">
      <RevealOnScroll className="mb-10 text-center sm:mb-16">
        <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Trading infrastructure, <span className="text-emerald-500">instantly.</span>
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-zinc-400 sm:text-base">
          Stop copy-pasting broken scripts from forums. Generate bespoke, production-ready
          indicators with institutional-grade risk management built in.
        </p>
      </RevealOnScroll>

      <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RevealOnScroll className="md:col-span-2" delay={0}>
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 sm:rounded-3xl sm:p-8">
            <div className="absolute -top-4 -right-4 text-emerald-500 opacity-5 transition-all duration-500 group-hover:scale-110 group-hover:opacity-10 sm:top-0 sm:right-0 sm:p-8 sm:opacity-20 sm:group-hover:opacity-100">
              <Code2 className="size-24 sm:size-32" />
            </div>
            <div className="relative z-10 flex h-full max-w-md flex-col justify-end">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-emerald-400 shadow-inner sm:mb-6 sm:size-12 sm:rounded-xl">
                <TerminalSquare className="size-5 sm:size-6" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-white sm:mb-3 sm:text-2xl">
                Streaming AI Generation
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Watch the script write itself in real-time. Our custom-tuned Grok-3 integration
                outputs clean, strictly validated Pine Script v5 code in seconds.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 sm:rounded-3xl sm:p-8">
            <div className="absolute -bottom-8 -right-8 text-emerald-500 opacity-5 transition-all duration-500 group-hover:rotate-12 group-hover:opacity-10 sm:-bottom-8 sm:-right-8 sm:opacity-20 sm:group-hover:opacity-30">
              <ShieldAlert className="size-24 sm:size-48" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-amber-400 shadow-inner sm:mb-6 sm:size-12 sm:rounded-xl">
                <ShieldAlert className="size-5 sm:size-6" />
              </div>
              <div>
                <h3 className="mb-2 font-heading text-lg font-bold text-white sm:text-xl">3-Tier Alerts</h3>
                <p className="text-xs text-zinc-400 sm:text-sm">
                  Automatically structured TradingView alerts:{" "}
                  <span className="text-zinc-200">Getting Ready</span>,{" "}
                  <span className="text-zinc-200">Average</span>, and{" "}
                  <span className="text-zinc-200">Strong</span> conviction signals.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 sm:rounded-3xl sm:p-8">
            <div className="absolute -top-2 -right-2 text-emerald-500 opacity-5 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-10 sm:top-0 sm:right-0 sm:p-8 sm:opacity-20 sm:group-hover:opacity-100">
              <LineChart className="size-20 sm:size-24" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-blue-400 shadow-inner sm:mb-6 sm:size-12 sm:rounded-xl">
                <LineChart className="size-5 sm:size-6" />
              </div>
              <div>
                <h3 className="mb-2 font-heading text-lg font-bold text-white sm:text-xl">Dynamic SL & TP</h3>
                <p className="text-xs text-zinc-400 sm:text-sm">
                  Every script includes automatic, chart-plotted Stop Loss and Take Profit levels
                  based on ATR or strict percentages.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="md:col-span-2" delay={240}>
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 sm:rounded-3xl sm:p-8">
            <div className="absolute top-1/2 right-6 hidden h-48 w-48 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-500/20 transition-transform duration-700 group-hover:scale-105 sm:flex">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-emerald-500/30">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 blur-xl" />
              </div>
            </div>

            <div className="relative z-10 flex h-full max-w-md flex-col justify-end">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-rose-400 shadow-inner sm:mb-6 sm:size-12 sm:rounded-xl">
                <Activity className="size-5 sm:size-6" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-white sm:mb-3 sm:text-2xl">Exact Risk Sizing</h3>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Enter your account balance. The generator embeds dynamic position sizing logic into
                the script so you never risk more than your chosen percentage per trade.
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}