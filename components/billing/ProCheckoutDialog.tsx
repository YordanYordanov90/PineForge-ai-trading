'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CheckoutProvider,
  PaymentElement,
  PaymentElementProvider,
  useCheckout,
  usePaymentElement,
} from '@clerk/nextjs/experimental';
import { ArrowRight, BadgeCheck, Loader2, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type ProCheckoutDialogProps = {
  planId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Custom Clerk Billing checkout rendered in the app's own shadcn Dialog
 * (centered modal) instead of Clerk's prebuilt side drawer. Built on the
 * experimental custom-checkout primitives: CheckoutProvider + useCheckout
 * drive the lifecycle (start → confirm → finalize), PaymentElement renders
 * the Stripe card form.
 */
export function ProCheckoutDialog({ planId, open, onOpenChange }: ProCheckoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* DialogContent unmounts on close, so the checkout session resets cleanly. */}
        <CheckoutProvider for="user" planId={planId} planPeriod="month">
          <CheckoutFlow />
        </CheckoutProvider>
      </DialogContent>
    </Dialog>
  );
}

function CheckoutFlow() {
  const { checkout } = useCheckout();
  const startedRef = useRef(false);

  useEffect(() => {
    if (checkout.status === 'needs_initialization' && !startedRef.current) {
      startedRef.current = true;
      void checkout.start();
    }
  }, [checkout]);

  if (checkout.status === 'needs_initialization') {
    return (
      <div aria-busy="true" role="status" className="space-y-4 py-2">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>Preparing your checkout…</DialogDescription>
        </DialogHeader>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (checkout.status === 'completed') {
    return <CheckoutSuccess />;
  }

  return <CheckoutForm />;
}

function CheckoutForm() {
  const { checkout } = useCheckout();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';

  if (checkout.status !== 'needs_confirmation') return null;

  const dueNow = checkout.totals.totalDueNow;
  const price = `${dueNow.currencySymbol}${dueNow.amountFormatted}`;

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-lg">
          Upgrade to <span className="text-neon-600 dark:text-neon-400">{checkout.plan.name}</span>
        </DialogTitle>
        <DialogDescription>
          {price} due today, then {price} / month. Cancel anytime.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {checkout.plan.name} · monthly
        </span>
        <span className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
          {price}
        </span>
      </div>

      <PaymentElementProvider
        checkout={checkout}
        paymentDescription={`${price} / month`}
        stripeAppearance={{
          colorPrimary: dark ? '#34d399' : '#10b981',
          colorBackground: dark ? '#18181b' : '#ffffff',
          colorText: dark ? '#fafafa' : '#18181b',
          colorTextSecondary: dark ? '#a1a1aa' : '#71717a',
          colorSuccess: dark ? '#34d399' : '#10b981',
          colorDanger: dark ? '#fb7185' : '#e11d48',
          colorWarning: dark ? '#fbbf24' : '#f59e0b',
          fontWeightNormal: '400',
          fontWeightMedium: '500',
          fontWeightBold: '600',
          fontSizeXl: '1.25rem',
          fontSizeLg: '1.125rem',
          fontSizeSm: '0.875rem',
          fontSizeXs: '0.75rem',
          borderRadius: '0.5rem',
          spacingUnit: '4px',
        }}
      >
        <PaymentSection />
      </PaymentElementProvider>
    </div>
  );
}

function PaymentSection() {
  const { checkout } = useCheckout();
  const { submit, isFormReady } = usePaymentElement();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPay = async () => {
    if (!isFormReady || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error } = await submit();
      if (error) {
        // Stripe surfaces field-level validation inline; only show a
        // message for non-validation failures.
        if (error.error.type !== 'validation_error') {
          setErrorMessage(error.error.message ?? 'Payment failed. Please try again.');
        }
        return;
      }

      const { error: confirmError } = await checkout.confirm(data);
      if (confirmError) {
        setErrorMessage(confirmError.message || 'Payment failed. Please try again.');
      }
      // On success checkout.status flips to 'completed' and CheckoutFlow
      // swaps in the success panel.
    } finally {
      setSubmitting(false);
    }
  };

  const dueNow =
    checkout.status === 'needs_confirmation'
      ? `${checkout.totals.totalDueNow.currencySymbol}${checkout.totals.totalDueNow.amountFormatted}`
      : '';

  return (
    <div className="space-y-4">
      <PaymentElement fallback={<Skeleton className="h-40 w-full" />} />

      {errorMessage ? (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onPay}
        disabled={!isFormReady || submitting}
        className="w-full gap-2 rounded-full bg-neon-600 font-semibold text-white hover:bg-neon-500 dark:bg-neon-500 dark:text-zinc-950 dark:hover:bg-neon-400"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Pay {dueNow}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-zinc-500">
        Secured by Stripe. Cancel anytime from your account menu.
      </p>
    </div>
  );
}

function CheckoutSuccess() {
  const { checkout } = useCheckout();
  const router = useRouter();
  const [finalizing, setFinalizing] = useState(false);

  const onContinue = async () => {
    setFinalizing(true);
    await checkout.finalize();
    router.push('/generate');
  };

  return (
    <div className="space-y-5 py-2 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-neon-500/40 bg-neon-500/10">
        <BadgeCheck className="size-7 text-neon-600 dark:text-neon-400" />
      </div>
      <DialogHeader className="items-center">
        <DialogTitle className="text-lg">You&apos;re on Pro!</DialogTitle>
        <DialogDescription>
          Premium models and higher daily limits are now unlocked.
        </DialogDescription>
      </DialogHeader>
      <Button
        type="button"
        onClick={onContinue}
        disabled={finalizing}
        className="w-full gap-2 rounded-full bg-neon-600 font-semibold text-white hover:bg-neon-500 dark:bg-neon-500 dark:text-zinc-950 dark:hover:bg-neon-400"
      >
        {finalizing ? <Loader2 className="size-4 animate-spin" /> : null}
        Start generating
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
