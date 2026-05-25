'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-zinc-950/95 border border-zinc-800 text-white backdrop-blur',
          description: 'text-zinc-300',
          actionButton: 'bg-neon-500 text-zinc-950 hover:bg-neon-400',
          cancelButton: 'bg-zinc-800 text-white hover:bg-zinc-700',
        },
      }}
    />
  );
}

