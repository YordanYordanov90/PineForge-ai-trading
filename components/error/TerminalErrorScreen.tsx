import Link from 'next/link';
import { Zap } from 'lucide-react';
import { brandLogoParts } from '@/lib/brand';
import { ModeToggle } from '@/components/mode-toggle';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';
import { cn } from '@/lib/utils';

export type TerminalErrorAccent = 'emerald' | 'rose';

export type TerminalErrorScreenProps = {
  kind: '404' | 'error';
  routeCode: string;
  glyph?: string;
  title: string;
  metaLine: string;
  description?: string;
  accent: TerminalErrorAccent;
  faultId?: string;
  primaryAction: React.ReactNode;
  secondaryHref: string;
  secondaryLabel: string;
};

function BearishCandleMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 96"
      className={cn('h-20 w-14 opacity-70 sm:h-24 sm:w-16', className)}
      aria-hidden
    >
      <line x1="32" y1="8" x2="32" y2="88" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600" />
      <rect x="22" y="36" width="20" height="40" rx="2" className="fill-rose-500/80" />
      <line x1="32" y1="24" x2="32" y2="36" stroke="currentColor" strokeWidth="1.5" className="text-rose-400/90" />
      <line x1="32" y1="76" x2="32" y2="88" stroke="currentColor" strokeWidth="1.5" className="text-rose-400/90" />
    </svg>
  );
}

function GlitchLineMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 48"
      className={cn('h-10 w-48 opacity-80 sm:h-12 sm:w-56', className)}
      aria-hidden
    >
      <polyline
        points="0,28 24,12 48,32 72,8 96,36 120,16 144,28 168,10 200,24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-rose-500/70"
      />
      <polyline
        points="0,32 24,16 48,36 72,12 96,40 120,20 144,32 168,14 200,28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="text-rose-400/40"
        transform="translate(2, 4)"
      />
    </svg>
  );
}

export function TerminalErrorScreen({
  kind,
  routeCode,
  glyph,
  title,
  metaLine,
  description,
  accent,
  faultId,
  primaryAction,
  secondaryHref,
  secondaryLabel,
}: TerminalErrorScreenProps) {
  const { prefix, accent: brandAccent } = brandLogoParts();
  const isRose = accent === 'rose';

  return (
    <div className="pf-page relative flex min-h-screen flex-col">
      <TerminalAmbientBackground variant="auth" />

      <header className="pf-nav relative z-10 border-b backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15">
              <Zap className="size-4 text-emerald-400" aria-hidden />
            </div>
            <span className="pf-heading font-heading text-base font-bold leading-none tracking-tight sm:text-lg">
              {prefix}
              <span className="text-emerald-500 dark:text-emerald-400">{brandAccent}</span>
            </span>
          </Link>
          <ModeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="animate-fade-up w-full max-w-xl text-center">
          <p className="font-mono text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase sm:text-xs">
            PINEFORGE :: ROUTE //{routeCode}
            <span
              className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-px bg-emerald-500/90 align-baseline animate-blink-cursor dark:bg-emerald-400"
              aria-hidden
            />
          </p>

          <div
            className={cn(
              'terminal-scanlines mx-auto mt-8 rounded-2xl border px-6 py-10 sm:px-10 sm:py-12',
              isRose
                ? 'border-rose-500/30 bg-zinc-950/60 dark:bg-zinc-950/70'
                : 'border-emerald-500/25 bg-zinc-950/50 dark:bg-zinc-950/60',
            )}
          >
            {glyph ? (
              <p
                className={cn(
                  'font-heading text-7xl font-extrabold tracking-tighter sm:text-8xl lg:text-9xl',
                  isRose ? 'text-rose-400/90' : 'text-emerald-500/90 dark:text-emerald-400/95',
                )}
              >
                {glyph}
              </p>
            ) : null}

            <h1 className="pf-heading mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            <p
              className={cn(
                'mt-3 font-mono text-xs tracking-[0.2em] uppercase sm:text-sm',
                isRose ? 'text-rose-400/90' : 'text-emerald-600 dark:text-emerald-400/90',
              )}
            >
              {metaLine}
            </p>

            {description ? (
              <p className="pf-muted mx-auto mt-4 max-w-md text-sm leading-relaxed sm:text-base">
                {description}
              </p>
            ) : null}

            {faultId ? (
              <p className="mt-4 inline-flex rounded-full border border-zinc-800/80 bg-zinc-900/60 px-3 py-1 font-mono text-[10px] tracking-wide text-zinc-400 sm:text-xs">
                FAULT_ID :: {faultId}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              {primaryAction}
              <Link
                href={secondaryHref}
                className="motion-btn-press w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-100 transition-all hover:bg-zinc-800 sm:w-auto dark:border-zinc-700 dark:hover:bg-zinc-800/80"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            {kind === '404' ? (
              <BearishCandleMotif className="text-zinc-500" />
            ) : (
              <GlitchLineMotif />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export function TerminalErrorPrimaryButton({
  children,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="motion-btn-press w-full rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 sm:w-auto"
    >
      {children}
    </button>
  );
}

export function TerminalErrorPrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="motion-btn-press w-full rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 sm:w-auto"
    >
      {children}
    </Link>
  );
}
