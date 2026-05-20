'use client';

import { useState } from 'react';
import { Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LANDING_EXAMPLES } from './landing-examples-data';
import { RevealOnScroll } from './RevealOnScroll';

function renderLine(line: string) {
  if (line === '') return '\u00A0';
  if (line.startsWith('//')) {
    return <span className="text-zinc-500">{line}</span>;
  }
  if (
    line.startsWith('alertcondition') ||
    line.startsWith('plot') ||
    line.startsWith('var')
  ) {
    const [head, ...rest] = line.split('=');
    return (
      <span>
        <span className="text-emerald-300">{head}</span>
        {rest.length > 0 && (
          <span className="text-zinc-300">={rest.join('=')}</span>
        )}
      </span>
    );
  }
  return <span className="text-emerald-300/90">{line}</span>;
}

export function LandingExamples() {
  const [activeId, setActiveId] = useState(LANDING_EXAMPLES[0].id);
  const active = LANDING_EXAMPLES.find((e) => e.id === activeId) ?? LANDING_EXAMPLES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.lines.join('\n'));
      toast.success('Example copied to clipboard!');
    } catch {
      toast.error('Failed to copy code.');
    }
  };

  return (
    <section id="examples" className="relative z-10 mx-auto mb-20 max-w-5xl sm:mb-32 lg:mb-40">
      <RevealOnScroll>
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Example strategies
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:mt-3 sm:text-base">
            Same output shape you get from the generator — alerts, plots, Pine v5.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {LANDING_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setActiveId(ex.id)}
              className={cn(
                'motion-btn-press rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                activeId === ex.id
                  ? 'terminal-active-pill border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                  : 'border-zinc-300 bg-white/70 text-zinc-600 hover:border-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400',
              )}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="pf-terminal-window terminal-code-surface relative overflow-hidden rounded-xl backdrop-blur-md transition-shadow duration-500 hover:shadow-xl dark:hover:shadow-emerald-900/25 sm:rounded-2xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/50 bg-zinc-900/60 px-3 py-2.5 sm:px-5 sm:py-3">
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
              <div className="size-2 rounded-full bg-zinc-700 sm:size-2.5" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-zinc-800/50 px-2 py-1 font-mono text-[10px] text-zinc-500 sm:ml-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              <Terminal className="size-2.5 sm:size-3" />
              {active.filename}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="motion-btn-press flex cursor-pointer items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs"
              aria-label={`Copy ${active.label} example`}
            >
              <Copy className="size-2.5 sm:size-3" />
              Copy
            </button>
          </div>

          <div className="relative p-3 sm:p-6">
            <pre className="text-[10px] leading-relaxed sm:text-sm">
              <code className="font-mono">
                {active.lines.map((line, i) => (
                  <div key={`${active.id}-${i}`} className="flex truncate">
                    <span className="mr-3 inline-block w-4 shrink-0 select-none text-right text-emerald-500/30 sm:mr-6 sm:w-5">
                      {i + 1}
                    </span>
                    <span className="truncate">{renderLine(line)}</span>
                  </div>
                ))}
                <div className="flex">
                  <span className="mr-3 inline-block w-4 shrink-0 select-none text-right text-emerald-500/30 sm:mr-6 sm:w-5">
                    {active.lines.length + 1}
                  </span>
                  <span className="animate-pulse text-emerald-400">▎</span>
                </div>
              </code>
            </pre>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
