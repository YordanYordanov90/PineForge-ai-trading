"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function LandingNavbar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      const top = el.scrollTop;
      setScrollProgress(
        scrollable > 0 ? Math.min(100, Math.max(0, (top / scrollable) * 100)) : 0,
      );
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/40 bg-zinc-950/90 backdrop-blur-md supports-backdrop-filter:bg-zinc-950/80">
      {/* Single row: fixed min-height + items-center keeps logo and CTA on one optical line on mobile */}
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:gap-4 sm:px-6 sm:py-3.5 sm:pt-3.5">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15">
            <Zap className="size-4 text-emerald-400" />
          </div>
          <span className="font-heading text-base font-bold leading-none tracking-tight text-white sm:text-lg">
            Grok<span className="text-emerald-500">Trade</span>
          </span>
        </Link>

        <Link
          href="/generate"
          className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 sm:gap-2 sm:px-5 sm:text-sm"
        >
          Open App
          <ArrowRight className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5 sm:size-3.5" />
        </Link>
      </div>

      {/* Progress track: full viewport width, flush under row (no extra flex gap) */}
      <div className="relative h-0.5 w-full bg-zinc-800/60">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </nav>
  );
}
