'use client';

import { Copy, Terminal } from "lucide-react";
import { LANDING_CODE_LINES } from "./landing-code-sample";
import { RevealOnScroll } from "./RevealOnScroll";
import { toast } from "sonner";

export function LandingCodePreview() {
  const handleCopy = async () => {
    try {
      const code = LANDING_CODE_LINES.join("\n");
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch {
      toast.error("Failed to copy code.");
    }
  };

  return (
    <section className="relative z-10 mx-auto mb-20 max-w-5xl sm:mb-32 lg:mb-40">
      <RevealOnScroll>
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Production-ready output
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:mt-3 sm:text-base">
            Copy-paste into TradingView. Clean, validated, ready to trade.
          </p>
        </div>

        <div className="pf-terminal-window relative overflow-hidden rounded-xl backdrop-blur-md transition-shadow duration-500 hover:shadow-xl dark:hover:shadow-neon-900/25 sm:rounded-2xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/50 bg-zinc-900/60 px-3 py-2.5 sm:px-5 sm:py-3">
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-zinc-800/50 px-2 py-1 text-[10px] text-zinc-500 sm:ml-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              <Terminal className="size-2.5 sm:size-3" />
              Pine Editor — TradingView
            </div>
            <button 
              onClick={handleCopy}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-neon-500/20 bg-neon-500/10 px-2 py-0.5 text-[10px] text-neon-400 transition-colors hover:bg-neon-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/30 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs"
              aria-label="Copy sample Pine Script"
            >
              <Copy className="size-2.5 sm:size-3" />
              Copy
            </button>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_10%_0%,rgba(200,255,0,0.08),transparent_45%),radial-gradient(600px_circle_at_90%_20%,rgba(59,130,246,0.06),transparent_40%)]" />
            <div className="relative p-3 sm:p-6">
              <pre className="text-[10px] leading-relaxed sm:text-sm">
                <code className="font-mono">
                  {LANDING_CODE_LINES.map((line, i) => (
                    <div key={i} className="flex truncate">
                      <span className="mr-3 inline-block w-4 shrink-0 select-none text-right text-neon-500/30 sm:mr-6 sm:w-5">
                        {i + 1}
                      </span>
                      <span className="truncate">
                        {line === "" ? (
                          "\u00A0"
                        ) : line.startsWith("//") ? (
                          <span className="text-zinc-500">{line}</span>
                        ) : line.startsWith("alertcondition") ||
                          line.startsWith("plot") ||
                          line.startsWith("var") ? (
                          <span>
                            <span className="text-neon-300">{line.split("=")[0]}</span>
                            {line.includes("=") && (
                              <span className="text-zinc-300">
                                ={line.split("=").slice(1).join("=")}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-neon-300/90">{line}</span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex">
                    <span className="mr-3 inline-block w-4 shrink-0 select-none text-right text-neon-500/30 sm:mr-6 sm:w-5">
                      {LANDING_CODE_LINES.length + 1}
                    </span>
                    <span className="animate-pulse text-neon-400">▎</span>
                  </div>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
