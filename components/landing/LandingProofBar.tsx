import { LANDING_TRADER_COUNT_LABEL } from '@/lib/config/constants';

const PROOF_ITEMS = [
  { live: true, label: LANDING_TRADER_COUNT_LABEL },
  { live: false, label: 'Pine v5 validated' },
  { live: false, label: '3-tier alerts ready' },
  { live: false, label: 'Powered by xAI Grok' },
] as const;

export function LandingProofBar() {
  return (
    <section
      aria-label="Product highlights"
      className="mb-16 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:mb-24 sm:gap-x-6"
    >
      {PROOF_ITEMS.map((item) => (
        <span
          key={item.label}
          className="pf-badge inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide uppercase sm:text-xs"
        >
          {item.live ? (
            <span className="relative flex size-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-neon-500" />
            </span>
          ) : (
            <span
              className="size-1.5 shrink-0 rounded-full bg-neon-500/70"
              aria-hidden
            />
          )}
          {item.label}
        </span>
      ))}
    </section>
  );
}
