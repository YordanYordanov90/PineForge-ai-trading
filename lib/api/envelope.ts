/**
 * Canonical JSON envelope for all `/api/*` routes (except streaming success bodies).
 * HTTP status remains the primary signal; the body always includes `success`.
 */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export function apiSuccess<T>(data: T, init?: ResponseInit): Response {
  const body: ApiEnvelope<T> = { success: true, data, error: null };
  return Response.json(body, init);
}

export function apiError(
  error: string,
  status: number,
  init?: ResponseInit,
): Response {
  const body: ApiEnvelope<null> = { success: false, data: null, error };
  return Response.json(body, { ...init, status });
}

export function apiInvalidRequest(message = 'Invalid request.'): Response {
  return apiError(message, 400);
}
