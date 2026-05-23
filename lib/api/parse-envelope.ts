import { z } from 'zod';

export const apiEnvelopeSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    error: z.null(),
  });

export function parseApiSuccessEnvelope<T>(
  json: unknown,
  dataSchema: z.ZodType<T>,
): T | null {
  const parsed = apiEnvelopeSuccessSchema(dataSchema).safeParse(json);
  return parsed.success ? parsed.data.data : null;
}
