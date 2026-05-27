'use client';

import { useSyncExternalStore } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

const SCROLL_FADE_THRESHOLD = 200;
const NEXT_SECTION_ID = 'features';

function scrollToNextSection() {
  const el = document.getElementById(NEXT_SECTION_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function subscribeScroll(callback: () => void): () => void {
  window.addEventListener('scroll', callback, { passive: true });
  return () => window.removeEventListener('scroll', callback);
}

function getVisibleSnapshot(): boolean {
  return window.scrollY <= SCROLL_FADE_THRESHOLD;
}

function getVisibleServerSnapshot(): boolean {
  return true;
}

export function LandingScrollIndicator() {
  const reducedMotion = usePrefersReducedMotion();
  const visible = useSyncExternalStore(
    subscribeScroll,
    getVisibleSnapshot,
    getVisibleServerSnapshot,
  );

  if (reducedMotion) return null;

  return (
    <button
      type="button"
      onClick={scrollToNextSection}
      aria-label="Scroll to features section"
      className={cn(
        'absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500',
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <span className="font-mono text-[10px] font-medium tracking-[0.3em] text-zinc-500 uppercase">
        Scroll
      </span>
      <ChevronDown
        className="size-4 text-zinc-500 scroll-cue-bounce"
        aria-hidden
      />
    </button>
  );
}
