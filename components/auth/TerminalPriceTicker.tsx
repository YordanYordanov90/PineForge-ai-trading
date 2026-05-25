"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Row = { sym: string; price: string; delta: number };

const BASE_ROWS: Row[] = [
  { sym: "BTC", price: "97,842.10", delta: 0.18 },
  { sym: "ETH", price: "3,421.55", delta: -0.06 },
  { sym: "NQ", price: "21,104.25", delta: 0.09 },
  { sym: "ES", price: "6,012.50", delta: -0.03 },
  { sym: "GOLD", price: "2,684.30", delta: 0.11 },
  { sym: "VIX", price: "14.82", delta: -0.14 },
];

function jitterDelta(prev: number): number {
  const step = (Math.random() - 0.5) * 0.08;
  const next = Math.round((prev + step) * 100) / 100;
  return Math.min(0.35, Math.max(-0.35, next));
}

function formatDelta(d: number): string {
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(2)}%`;
}

type TerminalPriceTickerProps = {
  variant?: "auth" | "generate" | "landing";
};

export function TerminalPriceTicker({
  variant = "auth",
}: TerminalPriceTickerProps) {
  const isGenerate = variant === "generate";
  const isLanding = variant === "landing";
  const jitterMs = isLanding ? 4500 : isGenerate ? 3800 : 2800;
  const [rows, setRows] = useState<Row[]>(BASE_ROWS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r) => ({ ...r, delta: jitterDelta(r.delta) })),
      );
    }, jitterMs);
    return () => window.clearInterval(id);
  }, [jitterMs]);

  const renderQuote = (r: Row, copy: "a" | "b", index: number) => (
    <span
      key={`${copy}-${r.sym}-${index}`}
      className="inline-flex shrink-0 items-baseline gap-1.5 px-5"
    >
      <span
        className={
          isLanding ? "text-zinc-500" : isGenerate ? "text-zinc-600" : "text-white/85"
        }
      >
        {r.sym}
      </span>
      <span
        className={
          isLanding ? "text-zinc-400" : isGenerate ? "text-zinc-400" : "text-white"
        }
      >
        {r.price}
      </span>
      <span
        className={
          isLanding
            ? "text-zinc-500"
            : r.delta >= 0
              ? isGenerate
                ? "text-neon-500/70"
                : "text-neon-400"
              : isGenerate
                ? "text-rose-500/70"
                : "text-rose-400"
        }
      >
        {formatDelta(r.delta)}
      </span>
    </span>
  );

  return (
    <div
      className={cn(
        "pointer-events-none relative min-h-[2.25rem] w-full min-w-0 overflow-hidden border-t border-zinc-800/50 backdrop-blur-sm",
        isLanding
          ? "border-zinc-200/60 bg-zinc-100/90 dark:border-zinc-800/50 dark:bg-zinc-950/70"
          : isGenerate
            ? "bg-zinc-950/60"
            : "bg-zinc-950/85",
      )}
    >
      <p className="sr-only">
        Demo: decorative simulated market data for atmosphere only. Not a live
        price feed.
      </p>
      <div aria-hidden className="flex h-9 items-center">
        <div
          className={cn(
            "whitespace-nowrap font-mono text-[11px] tracking-tight sm:text-xs",
            isLanding
              ? "animate-terminal-ticker-landing"
              : isGenerate
                ? "animate-terminal-ticker-slow"
                : "animate-terminal-ticker",
          )}
        >
          {rows.map((r, i) => renderQuote(r, "a", i))}
          {rows.map((r, i) => renderQuote(r, "b", i))}
        </div>
      </div>
    </div>
  );
}