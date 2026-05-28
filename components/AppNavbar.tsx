'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Menu, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';
import { brandLogoParts } from '@/lib/brand';
import { cn } from '@/lib/utils';

type NavLink = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  signedInOnly?: boolean;
  accent?: boolean;
};

const navLinks: NavLink[] = [
  { href: '/generate', label: 'Generator' },
  { href: '/forge', label: 'Forge', icon: Sparkles, signedInOnly: true, accent: true },
  { href: '/templates', label: 'Templates' },
  { href: '/reports', label: 'Reports', icon: FileText, signedInOnly: true },
];

export default function AppNavbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const clerkAppearance = useClerkAppearance();
  const { prefix, accent } = brandLogoParts();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = navLinks.filter((link) => !link.signedInOnly || isSignedIn);

  const isActive = (href: string) => {
    if (href === '/generate') {
      return pathname === '/generate' || pathname?.startsWith('/generate/');
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav className="pf-nav sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90 sm:gap-2.5"
          aria-label="PineForge home"
        >
          <div className="flex size-8 items-center justify-center rounded-lg border border-neon-500/25 bg-neon-500/15">
            <Zap className="size-4 text-neon-400" aria-hidden />
          </div>
          <span className="pf-heading hidden font-heading text-base font-bold tracking-tight sm:inline sm:text-lg">
            {prefix}
            <span className="text-neon-500">{accent}</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  !active &&
                    (link.accent
                      ? 'text-neon-600 hover:text-neon-700 dark:text-neon-400 dark:hover:text-neon-300'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'),
                  active &&
                    (link.accent
                      ? 'bg-neon-500/10 text-neon-600 dark:text-neon-400'
                      : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800/60 dark:text-white'),
                )}
                aria-current={active ? 'page' : undefined}
              >
                {Icon && <Icon className="size-4" aria-hidden />}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side actions (desktop) */}
        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
          <ModeToggle />
          {isLoaded && isSignedIn ? (
            <UserButton appearance={clerkAppearance} />
          ) : isLoaded ? (
            <Link
              href="/sign-in"
              className="pf-nav-muted rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:border-neon-500/40 hover:bg-neon-500/10 hover:text-neon-600 dark:hover:text-neon-300 sm:text-sm"
            >
              Sign in
            </Link>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 sm:max-w-xs">
          <SheetHeader className="border-b border-zinc-200 p-4 text-left dark:border-zinc-800">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md border border-neon-500/30 bg-neon-500/10">
                <Zap className="size-3.5 text-neon-400" />
              </div>
              <span className="pf-heading text-base font-bold">
                {prefix}<span className="text-neon-500">{accent}</span>
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-1 p-2">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-neon-500/10 text-neon-600 dark:text-neon-400'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900/60 dark:hover:text-white',
                  )}
                >
                  {Icon && <Icon className="size-4" aria-hidden />}
                  {link.label}
                </Link>
              );
            })}

            <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-2 px-3 py-2">
              <ModeToggle />
              <span className="pf-muted text-xs">Theme</span>
            </div>

            {isLoaded && isSignedIn ? (
              <div className="px-3 py-2">
                <UserButton appearance={clerkAppearance} />
              </div>
            ) : isLoaded ? (
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="pf-nav-muted mx-2 rounded-full border px-4 py-2 text-center text-sm"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
