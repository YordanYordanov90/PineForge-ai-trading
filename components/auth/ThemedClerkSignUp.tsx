'use client';

import { SignUp } from '@clerk/nextjs';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';

type ThemedClerkSignUpProps = {
  forceRedirectUrl?: string;
  signInForceRedirectUrl?: string;
};

export function ThemedClerkSignUp({
  forceRedirectUrl = '/generate',
  signInForceRedirectUrl = '/generate',
}: ThemedClerkSignUpProps) {
  const appearance = useClerkAppearance();

  return (
    <SignUp
      appearance={appearance}
      forceRedirectUrl={forceRedirectUrl}
      signInForceRedirectUrl={signInForceRedirectUrl}
    />
  );
}
