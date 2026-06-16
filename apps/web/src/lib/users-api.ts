import type {
  ApiResponse,
  UserProfile,
  UserSettings,
} from '@signbridge/shared-types';
import { API_URL, AuthApiError } from './auth-api';

/** The `authFetch` wrapper exposed by the auth context. */
type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function requestJson<T>(
  authFetch: AuthFetch,
  path: string,
  init?: RequestInit,
): Promise<T> {
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

export interface MeResponse {
  profile: UserProfile;
  settings: UserSettings;
}

export function fetchMe(authFetch: AuthFetch): Promise<MeResponse> {
  return requestJson<MeResponse>(authFetch, '/api/users/me');
}

export function fetchSettings(authFetch: AuthFetch): Promise<{ settings: UserSettings }> {
  return requestJson<{ settings: UserSettings }>(authFetch, '/api/users/me/settings');
}

export function updateProfile(
  authFetch: AuthFetch,
  name: string,
): Promise<{ profile: UserProfile }> {
  return requestJson<{ profile: UserProfile }>(authFetch, '/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function updateSettings(
  authFetch: AuthFetch,
  partial: Partial<UserSettings>,
): Promise<{ settings: UserSettings }> {
  return requestJson<{ settings: UserSettings }>(authFetch, '/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(partial),
  });
}

export function changePassword(
  authFetch: AuthFetch,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: true }> {
  return requestJson<{ success: true }>(authFetch, '/api/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
