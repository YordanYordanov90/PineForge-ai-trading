import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PineForge.",
};

export default function SignInPage() {
  return (
    <AuthFormShell headline="Sign in to start generating production-ready Pine Script strategies.">
      <SignIn
        appearance={clerkAppearance}
        forceRedirectUrl="/generate"
        signUpForceRedirectUrl="/generate"
      />
    </AuthFormShell>
  );
}
