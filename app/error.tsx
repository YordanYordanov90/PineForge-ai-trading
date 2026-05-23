'use client';

import {
  TerminalErrorPrimaryButton,
  TerminalErrorScreen,
} from '@/components/error/TerminalErrorScreen';
import { useErrorLogger } from '@/hooks/useErrorLogger';

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  useErrorLogger(error);

  return (
    <TerminalErrorScreen
      kind="error"
      routeCode="FAULT"
      title="SYSTEM HALT"
      metaLine="// UNHANDLED EXCEPTION"
      description="An unexpected fault halted the session. Retry or return to the homepage."
      accent="rose"
      faultId={error.digest}
      primaryAction={
        <TerminalErrorPrimaryButton onClick={reset}>Try again</TerminalErrorPrimaryButton>
      }
      secondaryHref="/"
      secondaryLabel="Back to home"
    />
  );
}
