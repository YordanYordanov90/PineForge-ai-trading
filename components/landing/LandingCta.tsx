import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_CTA_SUBTEXT } from "@/lib/config/constants";
import { RevealOnScroll } from "./RevealOnScroll";

export function LandingCta() {
  return (
    <RevealOnScroll>
      <section className="pf-cta-panel relative overflow-hidden rounded-2xl border border-zinc-800 p-6 text-center sm:rounded-3xl sm:p-12 lg:p-24 dark:border-zinc-800">
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="pf-heading mb-4 font-heading text-2xl font-bold tracking-tighter sm:mb-6 sm:text-4xl lg:text-5xl">
            Ready to script smarter?
          </h2>
          <p className="pf-muted mb-8 max-w-2xl text-base sm:mb-10 sm:text-xl">
            Stop writing boilerplate. Start trading strategies. Experience the fastest way to build
            on TradingView.
          </p>

          <Link
            href="/generate"
            className="motion-btn-press group flex items-center justify-center gap-2 rounded-full border border-neon-500 px-8 py-4 text-base font-bold text-neon-500 transition-colors hover:bg-neon-500/10 sm:px-10 sm:py-5 sm:text-xl"
          >
            Launch Generator Now
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1 sm:size-6" />
          </Link>
          <p className="mt-4 text-xs text-zinc-500 sm:mt-6 sm:text-sm">{LANDING_CTA_SUBTEXT}</p>
        </div>
      </section>
    </RevealOnScroll>
  );
}
