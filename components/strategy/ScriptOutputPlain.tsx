import { CODE_BLOCK_CLASS } from '@/components/strategy/script-output-styles';

type ScriptOutputPlainProps = {
  script: string;
};

export function ScriptOutputPlain({ script }: ScriptOutputPlainProps) {
  return (
    <pre className={CODE_BLOCK_CLASS}>
      <code className="font-mono">{script}</code>
    </pre>
  );
}
