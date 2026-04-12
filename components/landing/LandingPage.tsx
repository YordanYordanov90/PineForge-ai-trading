import { LandingBackground } from "./LandingBackground";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingFeatureGrid } from "./LandingFeatureGrid";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingCodePreview } from "./LandingCodePreview";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-1 flex-col bg-zinc-950 font-sans text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <LandingBackground />
      <LandingNavbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        <LandingHero />
        <LandingFeatureGrid />
        <LandingHowItWorks />
        <LandingCodePreview />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
