import { type BeforeErrorHook, HTTPError } from 'ky';

/** Normalized HTTP failure. `status` is the HTTP status; `details` is the parsed JSON body when present. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null) {
    const { error, message } = body as { error?: unknown; message?: unknown };
    if (typeof error === 'string') return error;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

/** ky `beforeError` hook: turns an HTTPError into an ApiError. Non-HTTP errors pass through unchanged. */
export const normalizeError: BeforeErrorHook = ({ error }) => {
  if (!(error instanceof HTTPError)) {
    return error;
  }
  // ky consumes the body before `beforeError` runs and exposes the parsed result as `error.data`.
  const { response, data: details } = error;
  const fallback = response.statusText || `HTTP ${response.status}`;
  return new ApiError(response.status, messageFromBody(details, fallback), details);
};
