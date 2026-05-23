import { CODE_BLOCK_CLASS } from '@/components/strategy/script-output-styles';
import { cn } from '@/lib/utils';

type ScriptOutputHighlightedProps = {
  highlightedHtml: string;
};

export function ScriptOutputHighlighted({ highlightedHtml }: ScriptOutputHighlightedProps) {
  return (
    <div
      className={cn(
        CODE_BLOCK_CLASS,
        '[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!border-0 [&_code]:!font-mono [&_code]:!text-sm [&_code]:!leading-relaxed',
      )}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
