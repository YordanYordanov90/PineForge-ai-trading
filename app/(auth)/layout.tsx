import Link from "next/link";
import { Zap } from "lucide-react";
import { brandLogoParts } from "@/lib/brand";
import { TerminalActivityHud } from "@/components/auth/TerminalActivityHud";
import { TerminalPriceTicker } from "@/components/auth/TerminalPriceTicker";
import { ModeToggle } from "@/components/mode-toggle";
import { TerminalAmbientBackground } from "@/components/ui/terminal-ambient-background";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { prefix, accent } = brandLogoParts();

  return (
    <div className="pf-page relative flex min-h-full flex-col">
      <TerminalAmbientBackground variant="auth" />

      <header className="pf-nav relative z-10 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-2 transition-opacity hover:opacity-90 sm:gap-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neon-500/35 bg-neon-500/15 shadow-[0_0_0_1px_rgba(200,255,0,0.12)] transition-shadow group-hover:border-neon-400/50 group-hover:shadow-[0_0_20px_-4px_rgba(200,255,0,0.35)]">
              <Zap className="size-4 text-neon-400" aria-hidden />
            </div>
            <span className="pf-heading font-heading text-base font-bold leading-none tracking-tight sm:text-lg">
              {prefix}<span className="text-neon-500 dark:text-neon-400">{accent}</span>
            </span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      <div
        className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-neon-500/45 to-transparent"
        aria-hidden
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 pb-28 sm:px-6 sm:py-12 sm:pb-32">
        <div className="w-full max-w-[min(100%,480px)] animate-fade-up sm:max-w-[460px]">
          {children}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col">
        <TerminalActivityHud />
        <TerminalPriceTicker />
      </div>
    </div>
  );
}
