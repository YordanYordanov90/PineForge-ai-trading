import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';

export type GenerationRateLimitError = {
  message: string;
  showUpgradeCta: boolean;
};

export type GenerateErrorResult =
  | { kind: 'rate_limit'; error: GenerationRateLimitError }
  | { kind: 'toast'; message: string };

export function mapGenerationErrorStatus(
  status: number,
  maybeJson: unknown,
): GenerateErrorResult {
  if (status === 429) {
    const message = messageFromApiErrorJson(
      maybeJson,
      'Too many requests. Please try again in a moment.',
      'Too many requests. Please try again in a moment.',
    );
    return {
      kind: 'rate_limit',
      error: {
        message,
        showUpgradeCta: message.includes('Upgrade to Pro'),
      },
    };
  }

  if (status === 403) {
    return {
      kind: 'toast',
      message: messageFromApiErrorJson(
        maybeJson,
        'This model requires a Pro plan.',
        'This model requires a Pro plan.',
      ),
    };
  }

  if (status === 409) {
    return {
      kind: 'toast',
      message: messageFromApiErrorJson(
        maybeJson,
        'A generation is already in progress.',
        'A generation is already in progress.',
      ),
    };
  }

  return {
    kind: 'toast',
    message: messageFromApiErrorJson(
      maybeJson,
      'Invalid input. Please check your fields.',
      'Request failed. Please try again.',
    ),
  };
}

export function mapRefineErrorStatus(
  status: number,
  maybeJson: unknown,
): string {
  const fallback =
    status === 403
      ? 'This model requires a Pro plan.'
      : status === 409
        ? 'A generation is already in progress.'
        : status === 429
          ? 'Too many requests. Please try again in a moment.'
          : 'Request failed. Please try again.';

  return messageFromApiErrorJson(
    maybeJson,
    'Invalid input. Please check your refinement.',
    fallback,
  );
}