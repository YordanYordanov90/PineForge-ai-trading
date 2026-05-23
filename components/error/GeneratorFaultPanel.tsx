import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type GeneratorFaultPanelProps = {
  variant: 'not-found' | 'error';
  title: string;
  description: string;
  faultId?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  primaryAction?: React.ReactNode;
};

export function GeneratorFaultPanel({
  variant,
  title,
  description,
  faultId,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  primaryAction,
}: GeneratorFaultPanelProps) {
  const isError = variant === 'error';

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-2 py-12 sm:px-4">
      <div
        className={cn(
          'pf-card terminal-scanlines w-full max-w-lg rounded-2xl border p-6 text-center sm:p-8',
          isError ? 'border-rose-500/30' : 'border-emerald-500/20',
        )}
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
          // GENERATOR :: {isError ? 'FAULT' : 'NOT_FOUND'}
          <span
            className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-px bg-emerald-500/90 align-baseline animate-blink-cursor"
            aria-hidden
          />
        </p>

        <div
          className={cn(
            'mx-auto mt-5 inline-flex h-12 w-12 items-center justify-center rounded-full border',
            isError
              ? 'border-rose-500/40 bg-rose-500/10'
              : 'border-emerald-500/35 bg-emerald-500/10',
          )}
        >
          <AlertTriangle
            className={cn('h-6 w-6', isError ? 'text-rose-300' : 'text-emerald-400')}
            aria-hidden
          />
        </div>

        <h2 className="pf-heading mt-4 text-xl font-semibold sm:text-2xl">{title}</h2>
        <p className="pf-muted mt-2 text-sm leading-relaxed">{description}</p>

        {faultId ? (
          <p className="mt-3 font-mono text-[10px] tracking-wide text-zinc-500">
            FAULT_ID :: {faultId}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {primaryAction ?? (
            <Link
              href={primaryHref}
              className="motion-btn-press w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 sm:w-auto"
            >
              {primaryLabel}
            </Link>
          )}
          <Link
            href={secondaryHref}
            className="motion-btn-press w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-100 transition-all hover:bg-zinc-800 sm:w-auto dark:border-zinc-700"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
