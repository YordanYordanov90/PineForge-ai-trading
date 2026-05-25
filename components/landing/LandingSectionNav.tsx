'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'hero', label: 'Top' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'examples', label: 'Examples' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingSectionNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const sectionIds = SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.intersectionRatio);
        });

        let bestId = sectionIds[0];
        let bestRatio = 0;
        for (const id of sectionIds) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestRatio > 0) {
          setActiveId(bestId);
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.45, 0.5, 0.75, 1],
        rootMargin: '-72px 0px -45% 0px',
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 md:flex"
    >
      {SECTIONS.map(({ id, label }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={`Navigate to ${label}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => scrollToSection(id)}
            className={cn(
              'group relative rounded-full border-none bg-zinc-700/70 transition-colors duration-300 hover:bg-neon-500 motion-reduce:transition-none',
              isActive
                ? 'size-2.5 scale-125 bg-neon-500 shadow-[0_0_8px_rgba(200,255,0,0.5)] motion-reduce:scale-100'
                : 'size-2',
            )}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-6 -translate-y-1/2 whitespace-nowrap font-mono text-[0.7rem] text-zinc-500 opacity-0 transition-opacity duration-300 group-hover:text-zinc-100 group-hover:opacity-100"
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
