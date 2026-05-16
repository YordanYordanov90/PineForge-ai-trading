import { Zap } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function LandingFooter() {
  return (
    <RevealOnScroll>
      <footer className="relative z-10 border-t border-zinc-800/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Zap className="size-3.5 text-emerald-500/60" />
            <span>Built for traders, powered by xAI Grok</span>
          </div>
          <div className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} PineForge
          </div>
        </div>
      </footer>
    </RevealOnScroll>
  );
}
