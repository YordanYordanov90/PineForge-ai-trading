import type { ReactNode } from "react";
import { ShieldCheck, Users } from "lucide-react";

interface AuthFormShellProps {
  headline: string;
  children: ReactNode;
}

export function AuthFormShell({ headline, children }: AuthFormShellProps) {
  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="font-heading text-lg font-semibold leading-snug tracking-tight text-zinc-100 sm:text-xl">
          {headline}
        </h1>
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          <li className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck
              className="size-3.5 shrink-0 text-emerald-500/90"
              aria-hidden
            />
            <span>Secured by Clerk</span>
          </li>
          <li className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Users
              className="size-3.5 shrink-0 text-emerald-500/90"
              aria-hidden
            />
            <span>Used by 2,400+ traders</span>
          </li>
        </ul>
      </header>

      <div className="auth-clerk-host w-full min-w-0">{children}</div>
    </div>
  );
}
