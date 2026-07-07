import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { clerkStrictCspOptions } from "@/lib/security/csp-directives";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Let API handlers return 401 JSON; middleware redirect on fetch is awkward
  "/api(.*)",
]);

const isProtectedRoute = createRouteMatcher(["/generate(.*)", "/forge(.*)", "/reports(.*)"]);

const clerkHandler = clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req) || !isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {
    contentSecurityPolicy: clerkStrictCspOptions,
  },
);

export function proxy(
  ...args: Parameters<typeof clerkHandler>
): ReturnType<typeof clerkHandler> {
  return clerkHandler(...args);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk frontend API routes
    "/__clerk/(.*)",
  ],
};