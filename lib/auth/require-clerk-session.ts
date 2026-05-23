import { auth } from "@clerk/nextjs/server";
import { apiError } from "@/lib/api/envelope";

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
      response: apiError("Unauthorized", 401),
    };
  }
  return { ok: true, userId };
}
