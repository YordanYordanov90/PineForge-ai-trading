import { CODE_BLOCK_CLASS } from '@/components/strategy/script-output-styles';
import { terminalCursorStream } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

type ScriptOutputStreamingProps = {
  script: string;
};

export function ScriptOutputStreaming({ script }: ScriptOutputStreamingProps) {
  return (
    <div className={CODE_BLOCK_CLASS}>
      <p
        className="mb-3 font-mono text-[10px] uppercase tracking-widest text-emerald-500/70"
        aria-hidden
      >
        pineforge stream · {script.length} chars
      </p>
      <pre className="m-0 overflow-visible p-0">
        <code className="font-mono">
          {script}
          <span
            className={cn(
              'animate-blink-cursor ml-0.5 inline-block h-4 w-2 bg-emerald-400 align-text-bottom',
              terminalCursorStream,
            )}
          />
        </code>
      </pre>
    </div>
  );
}
