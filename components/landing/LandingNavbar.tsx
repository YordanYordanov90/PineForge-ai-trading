"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { brandLogoParts } from "@/lib/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { useClerkAppearance } from "@/hooks/useClerkAppearance";

export function LandingNavbar() {
  const { prefix, accent } = brandLogoParts();
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isSignedIn, isLoaded } = useAuth();
  const clerkAppearance = useClerkAppearance();

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
    <nav className="pf-nav sticky top-0 z-50 border-b backdrop-blur-md supports-backdrop-filter:bg-zinc-950/80 dark:supports-backdrop-filter:bg-zinc-950/80">
      {/* Single row: fixed min-height + items-center keeps logo and CTA on one optical line on mobile */}
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:gap-4 sm:px-6 sm:py-3.5 sm:pt-3.5">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neon-500/25 bg-neon-500/15">
            <Zap className="size-4 text-neon-400" />
          </div>
          <span className="pf-heading font-heading text-base font-bold leading-none tracking-tight sm:text-lg">
            {prefix}<span className="text-neon-500">{accent}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ModeToggle />
          {isLoaded && isSignedIn ? (
            <UserButton appearance={clerkAppearance} />
          ) : null}
          {isLoaded && !isSignedIn ? (
            <Link
              href="/sign-in"
              className="pf-nav-muted whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all hover:border-neon-500/40 hover:bg-neon-500/10 hover:text-neon-600 dark:hover:text-neon-300 sm:px-4 sm:text-sm"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href="/generate"
            className="pf-nav-muted group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-medium backdrop-blur-sm transition-all hover:border-neon-500/40 hover:bg-neon-500/10 hover:text-neon-600 dark:hover:text-neon-300 sm:gap-2 sm:px-5 sm:text-sm"
          >
            Open App
            <ArrowRight className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5 sm:size-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress track: full viewport width, flush under row (no extra flex gap) */}
      <div
        className="relative h-0.5 w-full bg-zinc-200/80 dark:bg-zinc-800/60"
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
      >
        <div
          className="h-full bg-neon-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </nav>
  );
}
