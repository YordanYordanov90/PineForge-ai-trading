import { RevealOnScroll } from './RevealOnScroll';

const SESSION_LINES = [
  {
    prefix: '$',
    text: 'describe "9 EMA crosses 21 EMA, 2% risk"',
    className: 'text-zinc-300',
  },
  {
    prefix: '→',
    text: 'PineForge generating … █',
    className: 'text-neon-400',
  },
  {
    prefix: '✓',
    text: 'Validated Pine v5 • 187 lines • 14s',
    className: 'text-neon-300',
  },
  {
    prefix: '$',
    text: 'copy → TradingView',
    className: 'text-zinc-300',
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="pf-section-band relative mb-20 border-y py-12 sm:mb-32 sm:py-20 lg:mb-40 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-neon-50/30 backdrop-blur-xl dark:bg-zinc-950/50" />

      <RevealOnScroll className="relative z-10 mb-10 text-center sm:mb-14">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          From thought to trade in{' '}
          <span className="text-neon-600 dark:text-neon-500">15 seconds.</span>
        </h2>
        <p className="pf-muted mx-auto mt-3 max-w-xl text-sm sm:text-base">
          One terminal session — describe, generate, validate, deploy.
        </p>
      </RevealOnScroll>

      <RevealOnScroll className="relative z-10 mx-auto max-w-3xl" delay={80}>
        <div className="pf-terminal-window overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/90 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-rose-500/80" />
              <div className="size-2 rounded-full bg-amber-500/80" />
              <div className="size-2 rounded-full bg-neon-500/80" />
            </div>
            <span className="mx-auto font-mono text-[10px] text-zinc-500 sm:text-xs">
              pineforge — session
            </span>
          </div>
          <div className="terminal-code-surface space-y-4 p-5 font-mono text-xs leading-relaxed sm:p-8 sm:text-sm">
            {SESSION_LINES.map((line, i) => (
              <p
                key={line.text}
                className="flex gap-3"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="w-4 shrink-0 text-neon-500">{line.prefix}</span>
                <span className={line.className}>{line.text}</span>
              </p>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
