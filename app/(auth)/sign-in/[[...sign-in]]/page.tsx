import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ThemedClerkSignIn } from "@/components/auth/ThemedClerkSignIn";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PineForge.",
};

export default function SignInPage() {
  return (
    <AuthFormShell headline="Sign in to start generating production-ready Pine Script strategies.">
      <ThemedClerkSignIn />
    </AuthFormShell>
  );
}
