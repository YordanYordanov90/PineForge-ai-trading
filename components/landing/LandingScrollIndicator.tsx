'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SCROLL_FADE_THRESHOLD = 200;
const NEXT_SECTION_ID = 'features';

function scrollToNextSection() {
  const el = document.getElementById(NEXT_SECTION_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingScrollIndicator() {
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const onMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    mq.addEventListener('change', onMotionChange);

    const onScroll = () => {
      setVisible(window.scrollY <= SCROLL_FADE_THRESHOLD);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mq.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

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
