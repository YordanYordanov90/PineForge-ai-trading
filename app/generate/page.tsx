import { StrategyForm } from '@/components/strategy/StrategyForm';

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_15%_10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_15%,rgba(59,130,246,0.14),transparent_52%),radial-gradient(900px_circle_at_55%_95%,rgba(244,63,94,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.20]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.08]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <header className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            Pine Script v5 · Alerts + SL/TP · Copy‑ready output
          </div>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Grok Trading Strategy Generator
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
            Describe entries, filters, and risk rules. Get Pine Script with 3 alert tiers and automatic Stop‑Loss / Take‑Profit lines.
          </p>
        </header>

        <StrategyForm />
      </div>
    </div>
  );
}