import type { Metadata } from 'next';
import {
  TerminalErrorPrimaryLink,
  TerminalErrorScreen,
} from '@/components/error/TerminalErrorScreen';

export const metadata: Metadata = {
  title: '404 — Signal Lost',
};

export default function NotFound() {
  return (
    <TerminalErrorScreen
      kind="404"
      routeCode="404"
      glyph="404"
      title="SIGNAL LOST"
      metaLine="// TICKER NOT FOUND"
      description="This route is not listed on the exchange. Return to the terminal or open the generator."
      accent="neon"
      primaryAction={
        <TerminalErrorPrimaryLink href="/">Return to home</TerminalErrorPrimaryLink>
      }
      secondaryHref="/generate"
      secondaryLabel="Open generator"
    />
  );
}
