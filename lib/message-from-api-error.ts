export function messageFromApiErrorJson(
  maybeJson: unknown,
  validationFallback: string,
  genericFallback: string,
): string {
  if (typeof maybeJson !== 'object' || maybeJson === null || !('error' in maybeJson)) {
    return genericFallback;
  }
  const err = (maybeJson as { error: unknown }).error;
  if (typeof err === 'string' && err.trim()) return err;
  if (Array.isArray(err)) return validationFallback;
  return genericFallback;
}
