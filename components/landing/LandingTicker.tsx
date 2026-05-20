import { TerminalPriceTicker } from '@/components/auth/TerminalPriceTicker';

export function LandingTicker() {
  return (
    <div className="relative z-50 w-full border-b border-zinc-800/40 dark:border-zinc-800/50">
      <TerminalPriceTicker variant="landing" />
    </div>
  );
}
