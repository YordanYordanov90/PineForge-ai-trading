"use client";

import { useEffect, useState } from "react";

const BASE_TRADERS = 2847;

export function TerminalActivityHud() {
  const [secondsAgo, setSecondsAgo] = useState(14);
  const [traders, setTraders] = useState(BASE_TRADERS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsAgo((s) => (s >= 58 ? Math.floor(9 + Math.random() * 20) : s + 1));
      setTraders((t) => {
        const delta = Math.random() < 0.55 ? 1 : -1;
        return Math.min(2999, Math.max(2720, t + delta));
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-800/40 bg-zinc-950/90 px-3 py-2 font-mono text-[10px] text-zinc-500 backdrop-blur-sm sm:px-4 sm:text-[11px]"
      aria-live="polite"
    >
      <span className="sr-only">
        Demo atmosphere: simulated activity counts and timestamps, not real
        users or events.
      </span>
      <span className="inline-flex items-center gap-2 text-zinc-400">
        <span
          className="relative flex h-2 w-2 shrink-0"
          aria-hidden
        >
          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-emerald-400/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
        </span>
        <span className="tabular-nums text-zinc-300">
          ~{traders.toLocaleString()}{" "}
          <span className="text-zinc-500">traders online</span>
        </span>
      </span>
      <span className="hidden h-3 w-px bg-zinc-700/80 sm:inline" aria-hidden />
      <span className="text-zinc-500">
        Last strategy generated{" "}
        <span className="tabular-nums text-emerald-400/90">
          {secondsAgo}s
        </span>{" "}
        ago
      </span>
    </div>
  );
}
