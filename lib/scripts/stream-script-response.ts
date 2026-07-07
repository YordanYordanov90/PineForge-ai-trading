/**
 * Shared reader loop for streamed Pine Script generation/refine responses.
 */
export async function streamScriptResponse(
  res: Response,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  if (!res.body) {
    return res.text();
  }

  let accumulated = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      onChunk?.(chunk);
    }
  }

  const tail = decoder.decode();
  if (tail) {
    accumulated += tail;
    onChunk?.(tail);
  }

  return accumulated;
}