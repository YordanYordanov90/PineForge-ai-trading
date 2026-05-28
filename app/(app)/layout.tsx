import type { ReactNode } from 'react';
import AppNavbar from '@/components/AppNavbar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppNavbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
