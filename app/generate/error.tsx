'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type GenerateErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GenerateErrorPage({ error, reset }: GenerateErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-zinc-950/70 p-6 text-center backdrop-blur">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10">
          <AlertTriangle className="h-6 w-6 text-rose-300" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100">Something went wrong</h2>
        <p className="mt-2 text-sm text-zinc-400">
          The generator hit an unexpected error. Try again to recover.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            onClick={reset}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
