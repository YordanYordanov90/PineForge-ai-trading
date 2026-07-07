import { PricingPlans } from '@/components/billing/PricingPlans';
import { RevealOnScroll } from './RevealOnScroll';

export function LandingPricingTeaser() {
  return (
    <section id="pricing" className="mb-20 sm:mb-32 lg:mb-40">
      <RevealOnScroll className="mb-10 text-center sm:mb-14">
        <h2 className="pf-heading font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Start free.{' '}
          <span className="text-neon-600 dark:text-neon-500">Scale when ready.</span>
        </h2>
        <p className="pf-muted mx-auto mt-3 max-w-2xl text-sm sm:text-base">
          Same generator, same Pine output — Pro unlocks volume and premium models.
        </p>
      </RevealOnScroll>

      <PricingPlans />
    </section>
  );
}
