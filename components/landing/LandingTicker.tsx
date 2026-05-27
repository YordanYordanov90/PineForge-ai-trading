import { TerminalPriceTicker } from '@/components/auth/TerminalPriceTicker';

export function LandingTicker() {
  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <TerminalPriceTicker variant="landing" />
    </div>
  );
}
