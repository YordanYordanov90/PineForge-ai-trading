# 19 — Per-User History Migration (localStorage → Postgres)

Migrate script history from localStorage to Neon Postgres per-user storage.
Wire Clerk userId to database records. Gate `/generate` behind auth.
Follows Step 2 (Neon + Drizzle setup).

## Implementation

### Step 1 — Create user sync on first sign-in

When a signed-in user hits the app for the first time, create their `users`
row if it doesn't exist yet. Use a Server Action or API route called once
on auth.

Create `app/api/users/sync/route.ts`:

```ts
// POST /api/users/sync
// Called once after sign-in to ensure user row exists in DB
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null

  // upsert — safe to call multiple times
  await db.insert(users)
    .values({ clerkId: userId, email })
    .onConflictDoNothing()

  return Response.json({ ok: true })
}
```

Call `POST /api/users/sync` once from the client after sign-in
(e.g. in a `useEffect` on the generate page when user is signed in
and no sync has been recorded in sessionStorage).

### Step 2 — Create script history API routes

Replace localStorage operations with proper API routes.

**`GET /api/scripts`** — list signed-in user's scripts (ordered by
`createdAt` desc, limit 50):
- Requires Clerk auth — return 401 if not signed in
- Return `scripts[]` joined with basic metadata
- Filter by `userId` from Clerk session

**`POST /api/scripts`** — save a new script:
- Requires Clerk auth
- Validate body with Zod: `{ title, content, version, parentId?, model?, accountBalance? }`
- Insert into `scripts` table with `userId` from Clerk session
- Return created script record

**`PATCH /api/scripts/[scriptId]`** — rename a script:
- Requires Clerk auth
- Enforce ownership: `script.userId === currentUserId` — return 403 otherwise
- Validate body: `{ title }` (non-empty string)

**`DELETE /api/scripts/[scriptId]`** — delete a script:
- Requires Clerk auth
- Enforce ownership check — 403 on mismatch
- Hard delete (no soft delete needed at this stage)

### Step 3 — Update useScriptHistory hook

Update `hooks/useScriptHistory.ts` to use the new API routes when the
user is signed in, fall back to localStorage when signed out.

```ts
// Behavior:
// - Signed in: all reads/writes go through API routes
// - Signed out: existing localStorage behavior unchanged
// This preserves the public /generate experience for non-auth users
```

Use `useUser()` from `@clerk/nextjs` to detect auth state.

The hook interface must remain identical — same function signatures,
same return shape — so no component changes are needed outside the hook.

### Step 4 — One-time localStorage migration on first sign-in

When a user signs in for the first time and has existing localStorage
history, offer to migrate it to their account.

Add to `useScriptHistory`:
- On sign-in detected: check localStorage for existing scripts
- If found: show a one-time toast (sonner) with "Import your X saved
  scripts to your account?" + "Import" action button
- On confirm: POST each localStorage script to `/api/scripts` in sequence
- On completion: clear localStorage history + show success toast
- Store `pineforge_migration_done` in localStorage to never show again

If localStorage is empty on sign-in: skip silently, no migration UI.

### Step 5 — Gate /generate behind auth

Update `proxy.ts` to protect `/generate`:

```ts
// Add /generate to protected routes
// Signed-out users → redirect to /sign-in
// Signed-in users → proceed normally
```

Use Clerk's `createRouteMatcher` pattern already established in the
existing `proxy.ts` to add `/generate(.*)` as a protected route.

The landing page `/` stays public — no auth required to view marketing.

### Step 6 — Add UserButton to generator navbar

Now that `/generate` requires auth, add `<UserButton />` from
`@clerk/nextjs` to the generator navbar trailing actions area.

- Import `UserButton` from `@clerk/nextjs`
- Place right-most in the trailing actions (after theme toggle if present)
- Apply `appearance={clerkAppearance}` from `lib/clerk-appearance.ts`
- No custom styling beyond the appearance config

## Scope Limits

- Do not add UserButton to the landing page navbar
- Do not change the localStorage behavior for signed-out users
- Do not add billing or plan enforcement yet (that is Step 5)
- Do not add starred/tags/collections UI yet (Phase 5)
- The hook interface must stay identical — no component refactoring

## Security Requirements

- Every `/api/scripts` route enforces `auth()` before any DB query
- Ownership check on every PATCH and DELETE — never trust client-sent userId
- Zod validation on all request bodies before DB insert
- Never return another user's scripts — always filter by `userId` from
  Clerk session, never from request body

## Check When Done

- `POST /api/users/sync` creates user row on first sign-in
- `/api/scripts` GET / POST / PATCH / DELETE all require auth
- Ownership enforced on PATCH and DELETE (403 on mismatch)
- `useScriptHistory` uses API routes when signed in, localStorage when not
- One-time migration toast offered when localStorage has scripts on sign-in
- `/generate` redirects signed-out users to `/sign-in`
- `UserButton` appears in generator navbar
- `npm run build` passes with no type errors