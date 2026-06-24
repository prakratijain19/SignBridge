import type { ApiResponse, TranslateRequest, TranslateResult } from '@signbridge/shared-types';
import { API_URL } from './auth-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Requests a translation. On ANY failure (network, server, bad shape) it returns
 * the original text with `translated: false` so the UI never breaks.
 */
export async function translate(
  authFetch: AuthFetch,
  req: TranslateRequest,
): Promise<TranslateResult> {
  const fallback: TranslateResult = {
    text: req.text,
    from: req.from,
    to: req.to,
    translated: false,
    provider: 'unavailable',
  };

  try {
    const res = await authFetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    const json = (await res.json()) as ApiResponse<TranslateResult>;
    if (!json.success) return fallback;
    return json.data;
  } catch {
    return fallback;
  }
}
