'use client';

type ScriptOutputEditableProps = {
  script: string;
  onScriptChange: (value: string) => void;
};

export function ScriptOutputEditable({ script, onScriptChange }: ScriptOutputEditableProps) {
  return (
    <textarea
      id="generated-pine-script"
      aria-label="Generated Pine Script — editable"
      spellCheck={false}
      value={script}
      onChange={(e) => {
        onScriptChange(e.target.value);
      }}
      className="pf-code-text box-border max-h-[640px] min-h-[320px] w-full resize-y border-0 bg-transparent p-6 font-mono text-sm leading-relaxed outline-none ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/20"
    />
  );
}
