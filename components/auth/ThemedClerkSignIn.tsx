'use client';

import { SignIn } from '@clerk/nextjs';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';

type ThemedClerkSignInProps = {
  forceRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
};

export function ThemedClerkSignIn({
  forceRedirectUrl = '/generate',
  signUpForceRedirectUrl = '/generate',
}: ThemedClerkSignInProps) {
  const appearance = useClerkAppearance();

  return (
    <SignIn
      appearance={appearance}
      forceRedirectUrl={forceRedirectUrl}
      signUpForceRedirectUrl={signUpForceRedirectUrl}
    />
  );
}
