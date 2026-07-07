import type { Metadata } from 'next';
import { LandingBackground } from '@/components/landing/LandingBackground';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PricingPlans } from '@/components/billing/PricingPlans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free and Pro plans for PineForge — upgrade for higher daily limits and premium models.',
};

export default function PricingPage() {
  return (
    <div className="pf-page relative flex min-h-screen w-full min-w-0 flex-1 flex-col font-sans">
      <LandingBackground />
      <div className="sticky top-0 z-50 w-full">
        <LandingNavbar />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        <div className="mb-10 text-center sm:mb-14">
          <h1 className="pf-heading font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent <span className="text-neon-600 dark:text-neon-500">pricing</span>
          </h1>
          <p className="pf-muted mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            Same generator, same Pine output — Pro unlocks higher daily limits and premium models.
          </p>
        </div>

        <PricingPlans />
      </main>

      <LandingFooter />
    </div>
  );
}
