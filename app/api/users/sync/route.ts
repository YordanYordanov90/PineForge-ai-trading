import { currentUser } from '@clerk/nextjs/server';
import { apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';

export async function POST() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

  await db
    .insert(users)
    .values({ clerkId: guard.ctx.userId, email })
    .onConflictDoNothing();

  return apiSuccess({ synced: true });
}
