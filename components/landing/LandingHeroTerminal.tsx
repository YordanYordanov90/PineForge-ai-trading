'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROMPT = '"9 EMA crosses 21 EMA, 2% risk"';
const CODE_LINES = [
  { n: 1, parts: [{ t: '//@version=5', c: 'comment' }] },
  {
    n: 2,
    parts: [
      { t: 'indicator', c: 'kw' },
      { t: '(', c: 'punc' },
      { t: '"EMA Cross"', c: 'str' },
      { t: ', ', c: 'punc' },
      { t: 'overlay', c: 'kw' },
      { t: ' = true)', c: 'punc' },
    ],
  },
  { n: 3, parts: [] },
  { n: 4, parts: [{ t: '// Risk Mgmt', c: 'comment' }] },
  {
    n: 5,
    parts: [
      { t: 'float', c: 'kw' },
      { t: ' bal = ', c: 'punc' },
      { t: '10000.0', c: 'num' },
    ],
  },
  {
    n: 6,
    parts: [
      { t: 'float', c: 'kw' },
      { t: ' risk = ', c: 'punc' },
      { t: '0.02', c: 'num' },
    ],
  },
  {
    n: 7,
    parts: [
      { t: 'float', c: 'kw' },
      { t: ' amt = bal * risk', c: 'punc' },
    ],
  },
  { n: 8, parts: [] },
  { n: 9, parts: [{ t: '// Logic... █', c: 'comment' }] },
] as const;

function Token({ part }: { part: { t: string; c: string } }) {
  const cls =
    part.c === 'comment'
      ? 'text-zinc-600'
      : part.c === 'kw'
        ? 'text-blue-400'
        : part.c === 'str'
          ? 'text-emerald-200'
          : part.c === 'num'
            ? 'text-orange-300'
            : 'text-emerald-300/90';
  return <span className={cls}>{part.t}</span>;
}

export function LandingHeroTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);

    if (mq.matches) {
      setVisible(true);
      return () => mq.removeEventListener('change', onChange);
    }

    const el = ref.current;
    if (!el) {
      return () => mq.removeEventListener('change', onChange);
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md flex-1 sm:max-w-lg lg:perspective-[2000px]">
      <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-emerald-500/20 to-transparent blur-2xl" />
      <div
        className={cn(
          'pf-terminal-window group relative h-full overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-700 ease-out lg:-rotate-y-12 lg:rotate-x-[5deg] lg:hover:rotate-y-0 lg:hover:rotate-x-0',
          visible && !reduceMotion && 'landing-hero-terminal-active',
        )}
      >
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex gap-1.5 sm:gap-2">
            <div className="size-2.5 rounded-full bg-rose-500/80 sm:size-3" />
            <div className="size-2.5 rounded-full bg-amber-500/80 sm:size-3" />
            <div className="size-2.5 rounded-full bg-emerald-500/80 sm:size-3" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 sm:gap-2 sm:text-xs">
            <Activity className="size-2.5 sm:size-3" /> strategy.pine
          </div>
        </div>
        <div className="terminal-code-surface relative p-3 font-mono text-[10px] leading-relaxed sm:p-6 sm:text-sm">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-size-[100%_24px]" />
          <div
            className={cn(
              'mb-3 text-zinc-400 sm:mb-4',
              visible && !reduceMotion && 'landing-hero-prompt',
            )}
          >
            <span className="text-emerald-500">❯</span> User:{' '}
            <span className="truncate text-zinc-200">{PROMPT}</span>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            {CODE_LINES.map((line) => (
              <p
                key={line.n}
                className={cn(
                  'truncate',
                  visible && !reduceMotion && 'landing-hero-code-line',
                )}
                style={
                  visible && !reduceMotion
                    ? ({ '--line-delay': `${0.8 + line.n * 0.35}s` } as CSSProperties)
                    : undefined
                }
              >
                <span className="text-zinc-500">{line.n}</span>{' '}
                {line.parts.length === 0 ? (
                  ' '
                ) : (
                  line.parts.map((p, i) => <Token key={i} part={p} />)
                )}
              </p>
            ))}
          </div>
          <p
            className={cn(
              'mt-3 font-mono text-[10px] text-zinc-500 sm:text-xs',
              visible && !reduceMotion && 'landing-hero-status',
            )}
          >
            <span className="text-emerald-500">●</span> live • 0.3s • 24 tokens
          </p>
        </div>
      </div>
    </div>
  );
}
