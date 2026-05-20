import type { Metadata } from "next";
import { AuthFormShell } from "@/components/auth/AuthFormShell";
import { ThemedClerkSignUp } from "@/components/auth/ThemedClerkSignUp";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your PineForge account.",
};

export default function SignUpPage() {
  return (
    <AuthFormShell headline="Create your account and start shipping clean Pine strategies in minutes.">
      <ThemedClerkSignUp />
    </AuthFormShell>
  );
}
