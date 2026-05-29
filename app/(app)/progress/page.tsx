import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  getDbUserIdByClerk,
  getProgressStats,
  getUserPlanByClerkId,
} from '@/lib/db';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import type { ProgressStats } from '@/lib/db/progress-stats';

export default async function ProgressPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect('/sign-in');
  }

  const [dbUserId, plan] = await Promise.all([
    getDbUserIdByClerk(clerkId),
    getUserPlanByClerkId(clerkId),
  ]);

  let stats: ProgressStats | null = null;
  if (dbUserId != null) {
    stats = await getProgressStats(dbUserId);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-neon-400" />
            <h1 className="pf-heading text-3xl">Quality Progression</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            See how your strategies have improved over time — built from Health Scores,
            refinement history, and Forge memory you already have.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
          <TrendingUp className="h-4 w-4" />
          Personal insights only
        </div>
      </div>

      <ProgressDashboard stats={stats} plan={plan} />
    </div>
  );
}
