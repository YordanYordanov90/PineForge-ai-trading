import { GeneratorFaultPanel } from '@/components/error/GeneratorFaultPanel';

export default function GenerateNotFound() {
  return (
    <GeneratorFaultPanel
      variant="not-found"
      title="Script not found in feed"
      description="The requested artifact has been delisted or never existed in your session."
      primaryHref="/generate"
      primaryLabel="Open generator"
      secondaryHref="/"
      secondaryLabel="Back to home"
    />
  );
}
