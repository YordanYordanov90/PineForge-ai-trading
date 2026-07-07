'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { BadgeCheck, Zap } from 'lucide-react';
import { ProCheckoutDialog } from '@/components/billing/ProCheckoutDialog';

const PRO_PLAN_ID = process.env.NEXT_PUBLIC_CLERK_PRO_PLAN_ID;

const CTA_CLASSES =
  'motion-btn-press mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neon-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neon-500 dark:bg-neon-500 dark:text-zinc-950 dark:hover:bg-neon-400';

/**
 * Pro plan CTA with three states:
 * - signed out → sign-in, then back to /pricing to finish the upgrade
 * - signed in on free → opens the in-app checkout dialog (ProCheckoutDialog)
 * - signed in on pro → inert "You're on Pro" badge (manage via UserButton → Billing)
 */
export function UpgradeToProButton() {
  const { isLoaded, isSignedIn, has } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isLoaded) {
    return (
      <span aria-hidden className={`${CTA_CLASSES} pointer-events-none opacity-60`}>
        <Zap className="size-4" />
        Upgrade to Pro
      </span>
    );
  }

  if (isSignedIn && has({ plan: 'pro' })) {
    return (
      <span className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-neon-500/40 bg-neon-500/10 px-6 py-3 text-sm font-semibold text-neon-700 dark:text-neon-300">
        <BadgeCheck className="size-4" />
        You&apos;re on Pro
      </span>
    );
  }

  if (!isSignedIn || !PRO_PLAN_ID) {
    return (
      <Link
        href={isSignedIn ? '/pricing' : '/sign-in?redirect_url=%2Fpricing'}
        className={CTA_CLASSES}
      >
        <Zap className="size-4" />
        Upgrade to Pro
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setCheckoutOpen(true)} className={CTA_CLASSES}>
        <Zap className="size-4" />
        Upgrade to Pro
      </button>
      <ProCheckoutDialog
        planId={PRO_PLAN_ID}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </>
  );
}
