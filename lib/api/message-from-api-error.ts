export function messageFromApiErrorJson(
  maybeJson: unknown,
  validationFallback: string,
  genericFallback: string,
): string {
  if (typeof maybeJson !== 'object' || maybeJson === null) {
    return genericFallback;
  }

  const record = maybeJson as Record<string, unknown>;

  if (record.success === false && typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }

  if (!('error' in record)) {
    return genericFallback;
  }

  const err = record.error;
  if (typeof err === 'string' && err.trim()) return err;
  if (Array.isArray(err)) return validationFallback;
  return genericFallback;
}
