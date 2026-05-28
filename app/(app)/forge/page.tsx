import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { TerminalPriceTicker } from '@/components/auth/TerminalPriceTicker';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';
import { ForgeExperience } from '@/components/forge/ForgeExperience';
import {
  db,
  getDbUserIdByClerk,
  listConversationsForUser,
  rowToSavedScript,
} from '@/lib/db';
import { scripts, users } from '@/drizzle/schema';
import type { SavedConversation, SavedScript } from '@/lib/types';

type ForgePageProps = {
  searchParams: Promise<{ scriptId?: string }>;
};

/**
 * Forge Agent page (spec 57).
 *
 * Auth-protected via `proxy.ts` — unauthenticated visitors land in the
 * Clerk sign-in flow before this RSC runs. Loads the sidebar's
 * conversation list and the user's plan up front so the client
 * experience hydrates instantly without a sidebar flicker.
 *
 * `?scriptId=<id>` is the spec-defined entry point from
 * `/generate` ("Discuss with Forge"). When supplied and the script
 * belongs to the caller, we attach a `seedScript` payload so the
 * client can show a context banner and create a conversation seeded
 * with that script on first send. Foreign / missing scripts silently
 * fall back to the no-context empty state — same shape as the
 * streaming endpoint's `loadScriptContext` helper.
 */
export default async function ForgePage({ searchParams }: ForgePageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const dbUserId = await getDbUserIdByClerk(clerkId);

  const [planRow] = dbUserId
    ? await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1)
    : [];
  const initialPlan = planRow?.plan ?? 'free';

  const initialConversations: SavedConversation[] = dbUserId
    ? await listConversationsForUser(dbUserId)
    : [];

  const { scriptId: scriptIdParam } = await searchParams;
  const seedScript = await loadSeedScript(dbUserId, scriptIdParam);

  return (
    <div className="pf-page relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ForgeExperience
          initialPlan={initialPlan}
          initialConversations={initialConversations}
          seedScript={seedScript}
        />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <TerminalPriceTicker variant="generate" />
      </div>
    </div>
  );
}

async function loadSeedScript(
  dbUserId: number | null,
  scriptIdParam: string | undefined,
): Promise<SavedScript | null> {
  if (!dbUserId || !scriptIdParam) return null;

  const parsed = Number.parseInt(scriptIdParam, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  const [row] = await db
    .select()
    .from(scripts)
    .where(eq(scripts.id, parsed))
    .limit(1);

  if (!row || row.userId !== dbUserId) return null;
  return rowToSavedScript(row);
}
