import { auth } from "@clerk/nextjs/server";

export type ClerkSessionOk = { ok: true; userId: string };
export type ClerkSessionDenied = {
  ok: false;
  response: Response;
};

/**
 * Use in Route Handlers so unauthenticated callers get JSON 401 instead of an HTML redirect.
 */
export async function requireClerkSession(): Promise<
  ClerkSessionOk | ClerkSessionDenied
> {
  const { userId } = await auth();
  if (userId == null || userId === "") {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId };
}
