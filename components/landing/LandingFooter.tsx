import Link from 'next/link';
import { Zap } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';
import { PRODUCT_NAME, brandLogoParts } from '@/lib/brand';

const PRODUCT_LINKS = [
  { href: '/generate', label: 'Generate' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
] as const;

const TRUST_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/#faq', label: 'Security' },
] as const;

export function LandingFooter() {
  const { prefix, accent } = brandLogoParts();

  return (
    <RevealOnScroll>
      <footer className="relative z-10 border-t border-zinc-200/80 py-10 dark:border-zinc-800/50 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link
              href="/"
              className="pf-heading mb-3 inline-flex items-center gap-2 font-heading text-lg font-bold"
            >
              <div className="flex size-8 items-center justify-center rounded-lg border border-neon-500/25 bg-neon-500/15">
                <Zap className="size-4 text-neon-500" />
              </div>
              {prefix}
              <span className="text-neon-500">{accent}</span>
            </Link>
            <p className="pf-muted max-w-sm text-sm leading-relaxed">
              Turn plain-English strategy ideas into production-ready Pine Script — with risk
              sizing, alerts, and TradingView-ready output.
            </p>
          </div>

          <div>
            <h3 className="pf-heading mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
              Product
            </h3>
            <ul className="flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="pf-muted text-sm transition-colors hover:text-neon-600 dark:hover:text-neon-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="pf-heading mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
              Trust
            </h3>
            <ul className="flex flex-col gap-2">
              {TRUST_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="pf-muted text-sm transition-colors hover:text-neon-600 dark:hover:text-neon-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-zinc-200/60 px-5 pt-6 sm:flex-row sm:px-6 dark:border-zinc-800/50">
          <p className="text-xs text-zinc-500">
            Built for traders, powered by xAI Grok
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} {PRODUCT_NAME}
          </p>
        </div>
      </footer>
    </RevealOnScroll>
  );
}
