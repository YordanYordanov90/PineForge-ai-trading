import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/schema';
import { db } from '@/lib/db/client';

export async function getDbUserIdByClerk(clerkId: string): Promise<number | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return row?.id ?? null;
}

export async function ensureDbUser(
  clerkId: string,
  email: string | null,
): Promise<number> {
  await db
    .insert(users)
    .values({ clerkId, email })
    .onConflictDoNothing();

  const id = await getDbUserIdByClerk(clerkId);
  if (id == null) {
    throw new Error('Failed to resolve user after upsert');
  }
  return id;
}

/** Ensures a Clerk user has a DB row (handles race before client sync completes). */
export async function ensureDbUserForClerkId(clerkId: string): Promise<number> {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  return ensureDbUser(clerkId, email);
}

/**
 * Resolve the current Clerk session's plan tier ("free" | "pro").
 *
 * Source of truth is Clerk Billing, not the DB — `has({ plan: 'pro' })`
 * reads the session's billing claim, which Clerk keeps current after
 * checkout/cancellation. `clerkId` is only used as a signed-out guard;
 * every caller already resolved it from the same request's `auth()`, so
 * re-reading `auth()` here always reflects that same session. The
 * `users.plan` DB column is unused for entitlement (kept for now, not
 * backfilled).
 */
export async function getUserPlanByClerkId(
  clerkId: string | null | undefined,
): Promise<string> {
  if (!clerkId) return 'free';
  const { has } = await auth();
  return has({ plan: 'pro' }) ? 'pro' : 'free';
}
