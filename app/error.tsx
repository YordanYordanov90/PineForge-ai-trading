'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-zinc-100 sm:text-5xl">
            Something went wrong
          </h2>
          <p className="mx-auto max-w-md text-sm text-zinc-400 sm:text-base">
            An unexpected error occurred. Please try again or return to the homepage.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 sm:w-auto"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-100 transition-all hover:bg-zinc-800 sm:w-auto"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
