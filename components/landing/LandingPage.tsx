import { LandingBackground } from "./LandingBackground";
import { LandingTicker } from "./LandingTicker";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingProofBar } from "./LandingProofBar";
import { LandingFeatureGrid } from "./LandingFeatureGrid";
import { LandingFeatureStat } from "./LandingFeatureStat";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingExamples } from "./LandingExamples";
import { LandingPricingTeaser } from "./LandingPricingTeaser";
import { LandingFAQ } from "./LandingFAQ";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="pf-page relative flex min-h-screen w-full min-w-0 flex-1 flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:bg-emerald-500/30 dark:selection:text-emerald-200">
      <LandingBackground />
      <LandingTicker />
      <LandingNavbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        <LandingHero />
        <LandingProofBar />
        <LandingFeatureGrid />
        <LandingFeatureStat />
        <LandingHowItWorks />
        <LandingExamples />
        <LandingPricingTeaser />
        <LandingFAQ />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
