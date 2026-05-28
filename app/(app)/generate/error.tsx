'use client';

import { GeneratorFaultPanel } from '@/components/error/GeneratorFaultPanel';
import { TerminalErrorPrimaryButton } from '@/components/error/TerminalErrorScreen';
import { useErrorLogger } from '@/hooks/useErrorLogger';

type GenerateErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GenerateErrorPage({ error, reset }: GenerateErrorPageProps) {
  useErrorLogger(error);

  return (
    <GeneratorFaultPanel
      variant="error"
      title="SYSTEM HALT (Generator)"
      description="The generator hit an unexpected fault. Retry to recover the session."
      faultId={error.digest}
      primaryHref="/generate"
      primaryLabel="Try again"
      secondaryHref="/"
      secondaryLabel="Back to home"
      primaryAction={<TerminalErrorPrimaryButton onClick={reset}>Try again</TerminalErrorPrimaryButton>}
    />
  );
}
