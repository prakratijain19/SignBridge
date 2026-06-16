import type {
  ApiError,
  ApiResponse,
  AuthResult,
  AuthUser,
  UserRole,
} from '@signbridge/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Thrown by the auth API helpers when the server returns `success: false`. */
export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    const error: ApiError = json.error;
    throw new AuthApiError(error.code, error.message, error.details);
  }
  return json.data;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function registerRequest(payload: RegisterPayload): Promise<AuthResult> {
  return postJson<AuthResult>('/api/auth/register', payload);
}

export function loginRequest(payload: LoginPayload): Promise<AuthResult> {
  return postJson<AuthResult>('/api/auth/login', payload);
}

/** Silent refresh — relies on the httpOnly sb_refresh cookie. */
export function refreshRequest(): Promise<{ accessToken: string }> {
  return postJson<{ accessToken: string }>('/api/auth/refresh');
}

export function logoutRequest(): Promise<{ success: true }> {
  return postJson<{ success: true }>('/api/auth/logout');
}

/** Fetches the current user for the given access token. */
export async function meRequest(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as ApiResponse<{ user: AuthUser }>;
  if (!json.success) {
    throw new AuthApiError(json.error.code, json.error.message, json.error.details);
  }
  return json.data.user;
}

export { API_URL };
