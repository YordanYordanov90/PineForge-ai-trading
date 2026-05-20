import { Activity, Code2, LineChart, ShieldAlert, TerminalSquare } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

const cardClass =
  "pf-feature-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 sm:rounded-3xl sm:p-8";
const iconBoxClass =
  "mb-4 flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:shadow-inner sm:mb-6 sm:size-12 sm:rounded-xl";
const headingClass = "pf-heading mb-2 font-heading text-lg font-bold sm:text-xl";
const headingLargeClass = "pf-heading mb-2 font-heading text-xl font-bold sm:mb-3 sm:text-2xl";
const bodyClass = "pf-muted text-sm leading-relaxed sm:text-base";
const bodySmClass = "pf-muted text-xs sm:text-sm";

export function LandingFeatureGrid() {
  return (
    <section className="mb-20 sm:mb-32 lg:mb-40">
      <RevealOnScroll className="mb-10 text-center sm:mb-16">
        <h2 className="pf-heading mb-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Trading infrastructure,{" "}
          <span className="text-emerald-600 dark:text-emerald-500">instantly.</span>
        </h2>
        <p className="pf-muted mx-auto max-w-2xl text-sm sm:text-base">
          Stop copy-pasting broken scripts from forums. Generate bespoke, production-ready
          indicators with institutional-grade risk management built in.
        </p>
      </RevealOnScroll>

      <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RevealOnScroll className="md:col-span-2" delay={0}>
          <div className={cardClass}>
            <div className="absolute -top-4 -right-4 text-emerald-500 opacity-[0.07] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.12] sm:top-0 sm:right-0 sm:p-8 dark:opacity-20 dark:group-hover:opacity-100">
              <Code2 className="size-24 sm:size-32" />
            </div>
            <div className="relative z-10 flex h-full max-w-md flex-col justify-end">
              <div className={`${iconBoxClass} text-emerald-600 dark:text-emerald-400`}>
                <TerminalSquare className="size-5 sm:size-6" />
              </div>
              <h3 className={headingLargeClass}>Streaming AI Generation</h3>
              <p className={bodyClass}>
                Watch the script write itself in real-time. Powered by xAI Grok with streaming output
                outputs clean, strictly validated Pine Script v5 code in seconds.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className={cardClass}>
            <div className="absolute -bottom-8 -right-8 text-emerald-500 opacity-[0.07] transition-all duration-500 group-hover:rotate-12 group-hover:opacity-[0.12] sm:opacity-[0.08] dark:sm:opacity-20 dark:sm:group-hover:opacity-30">
              <ShieldAlert className="size-24 sm:size-48" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className={`${iconBoxClass} text-amber-600 dark:text-amber-400`}>
                <ShieldAlert className="size-5 sm:size-6" />
              </div>
              <div>
                <h3 className={headingClass}>3-Tier Alerts</h3>
                <p className={bodySmClass}>
                  Automatically structured TradingView alerts:{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Getting Ready</span>,{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Average</span>, and{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Strong</span> conviction signals.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <div className={cardClass}>
            <div className="absolute -top-2 -right-2 text-emerald-500 opacity-[0.07] transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-[0.12] sm:top-0 sm:right-0 sm:p-8 dark:opacity-20 dark:sm:group-hover:opacity-100">
              <LineChart className="size-20 sm:size-24" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className={`${iconBoxClass} text-blue-600 dark:text-blue-400`}>
                <LineChart className="size-5 sm:size-6" />
              </div>
              <div>
                <h3 className={headingClass}>Dynamic SL & TP</h3>
                <p className={bodySmClass}>
                  Every script includes automatic, chart-plotted Stop Loss and Take Profit levels
                  based on ATR or strict percentages.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="md:col-span-2" delay={240}>
          <div className={cardClass}>
            <div className="absolute top-1/2 right-6 hidden h-48 w-48 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-500/20 transition-transform duration-700 group-hover:scale-105 sm:flex">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-emerald-500/30">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 blur-xl" />
              </div>
            </div>

            <div className="relative z-10 flex h-full max-w-md flex-col justify-end">
              <div className={`${iconBoxClass} text-rose-600 dark:text-rose-400`}>
                <Activity className="size-5 sm:size-6" />
              </div>
              <h3 className={headingLargeClass}>Exact Risk Sizing</h3>
              <p className={bodyClass}>
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
