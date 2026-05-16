import Link from "next/link";
import { Zap } from "lucide-react";
import { brandLogoParts } from "@/lib/brand";
import { TerminalActivityHud } from "@/components/auth/TerminalActivityHud";
import { TerminalPriceTicker } from "@/components/auth/TerminalPriceTicker";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { prefix, accent } = brandLogoParts();

  return (
    <div className="relative flex min-h-full flex-col bg-zinc-950">
      {/* Ambient glow + terminal grid — behind all content */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="terminal-grid-bg absolute inset-0 opacity-50"
          aria-hidden
        />
        {/* Stronger top glow */}
        <div className="absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.15] blur-[120px]" />
        {/* Central ambient glow to highlight the form */}
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[100px]" />
        {/* Stronger bottom-right glow */}
        <div className="absolute -bottom-1/4 right-0 h-[600px] w-[600px] rounded-full bg-emerald-600/[0.12] blur-[100px]" />
        {/* Increased noise opacity */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-60" />
      </div>

      <header className="relative z-10 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-2 transition-opacity hover:opacity-90 sm:gap-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.12)] transition-shadow group-hover:border-emerald-400/50 group-hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.35)]">
              <Zap className="size-4 text-emerald-400" aria-hidden />
            </div>
            <span className="font-heading text-base font-bold leading-none tracking-tight text-white sm:text-lg">
              {prefix}<span className="text-emerald-400">{accent}</span>
            </span>
          </Link>
        </div>
      </header>
      <div
        className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/45 to-transparent"
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
