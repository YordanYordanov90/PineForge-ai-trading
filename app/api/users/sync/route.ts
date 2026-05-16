import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

  await db
    .insert(users)
    .values({ clerkId: userId, email })
    .onConflictDoNothing();

  return Response.json({ ok: true });
}
