/**
 * xAI / Grok routes read `XAI_API_KEY` via @ai-sdk/xai. Streaming routes defer
 * validation until the body is read, so we fail fast with a clear JSON error.
 */
export function responseIfMissingXaiApiKey(): Response | null {
  const key = process.env.XAI_API_KEY;
  if (typeof key === 'string' && key.trim().length > 0) return null;
  return Response.json(
    {
      error:
        'Missing XAI_API_KEY. Add XAI_API_KEY to .env.local in the project root (same folder as package.json), save the file, then stop and restart `npm run dev`.',
    },
    { status: 503 },
  );
}
