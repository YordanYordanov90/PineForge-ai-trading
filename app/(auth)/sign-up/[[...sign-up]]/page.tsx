import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your PineForge account.",
};

export default function SignUpPage() {
  return (
    <AuthFormShell headline="Create your account and start shipping clean Pine strategies in minutes.">
      <SignUp
        appearance={clerkAppearance}
        forceRedirectUrl="/generate"
        signInForceRedirectUrl="/generate"
      />
    </AuthFormShell>
  );
}
