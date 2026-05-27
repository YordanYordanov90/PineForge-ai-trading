"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** Applied when the element becomes visible (stagger siblings) */
  delay?: number;
};

export function RevealOnScroll({ children, className, delay = 0 }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [intersected, setIntersected] = useState(false);
  const visible = reduceMotion || intersected;

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersected(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    obs.observe(el);

    return () => obs.disconnect();
  }, [reduceMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        !reduceMotion && !visible && "translate-y-8 opacity-0",
        (reduceMotion || visible) && "translate-y-0 opacity-100",
        className,
      )}
      style={
        visible && !reduceMotion && delay > 0
          ? { transitionDelay: `${delay}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
