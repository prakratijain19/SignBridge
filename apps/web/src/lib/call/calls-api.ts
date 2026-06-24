import type { ApiResponse, CreateCallResult, IceServerConfig } from '@signbridge/shared-types';
import { API_URL, AuthApiError } from '../auth-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function requestJson<T>(authFetch: AuthFetch, path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new AuthApiError(json.error.code, json.error.message, json.error.details);
  }
  return json.data;
}

export function createCall(authFetch: AuthFetch): Promise<CreateCallResult> {
  return requestJson<CreateCallResult>(authFetch, '/api/calls', { method: 'POST' });
}

export function fetchIceServers(authFetch: AuthFetch): Promise<{ iceServers: IceServerConfig[] }> {
  return requestJson(authFetch, '/api/calls/ice');
}
