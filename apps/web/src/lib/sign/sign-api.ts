import type { ApiResponse, SignSampleInput, SignSampleStats } from '@signbridge/shared-types';
import { API_URL, AuthApiError } from '../auth-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function requestJson<T>(authFetch: AuthFetch, path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new AuthApiError(json.error.code, json.error.message, json.error.details);
  }
  return json.data;
}

export function postSignSample(
  authFetch: AuthFetch,
  sample: SignSampleInput,
): Promise<{ id: string }> {
  return requestJson(authFetch, '/api/sign-samples', {
    method: 'POST',
    body: JSON.stringify(sample),
  });
}

export function fetchSignStats(authFetch: AuthFetch): Promise<{ stats: SignSampleStats[] }> {
  return requestJson(authFetch, '/api/sign-samples/stats');
}

export function deleteSignLabel(authFetch: AuthFetch, label: string): Promise<{ deleted: number }> {
  return requestJson(authFetch, `/api/sign-samples/label/${label}`, { method: 'DELETE' });
}
