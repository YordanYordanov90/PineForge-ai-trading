import 'server-only';

import { currentUser } from '@clerk/nextjs/server';
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
 * Resolve a Clerk user's plan tier ("free" | "pro").
 *
 * Centralizes the `select plan from users where clerkId = ?` lookup
 * used by every protected RSC + the rate-limit gate. Returns `"free"`
 * when no DB row exists yet (pre-sync, signed-out, or invalid clerkId).
 */
export async function getUserPlanByClerkId(
  clerkId: string | null | undefined,
): Promise<string> {
  if (!clerkId) return 'free';
  const [row] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return row?.plan ?? 'free';
}
