import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/schema';
import { TerminalPriceTicker } from '@/components/auth/TerminalPriceTicker';
import { GenerateExperience } from '@/components/generate/GenerateExperience';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';
import { db } from '@/lib/db';

export default async function GeneratePage() {
  const { userId } = await auth();
  let initialPlan = 'free';

  if (userId) {
    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    initialPlan = user?.plan ?? 'free';
  }

  return (
    <div className="pf-page relative min-h-screen">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 py-10 pb-28 sm:py-14 sm:pb-32">
        <GenerateExperience initialPlan={initialPlan} />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <TerminalPriceTicker variant="generate" />
      </div>
    </div>
  );
}