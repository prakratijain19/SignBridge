import type {
  ApiResponse,
  EmergencyContact,
  EmergencyEvent,
  LanguageCode,
  QuickPhrase,
} from '@signbridge/shared-types';
import { API_URL, AuthApiError } from './auth-api';

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

// ── Contacts ──
export function listContacts(authFetch: AuthFetch): Promise<{ contacts: EmergencyContact[] }> {
  return requestJson(authFetch, '/api/emergency/contacts');
}
export interface ContactInput {
  name: string;
  phone: string;
  relation?: string;
  isPrimary?: boolean;
}
export function createContact(
  authFetch: AuthFetch,
  body: ContactInput,
): Promise<{ contact: EmergencyContact }> {
  return requestJson(authFetch, '/api/emergency/contacts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function updateContact(
  authFetch: AuthFetch,
  id: string,
  body: Partial<ContactInput>,
): Promise<{ contact: EmergencyContact }> {
  return requestJson(authFetch, `/api/emergency/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
export function deleteContact(authFetch: AuthFetch, id: string): Promise<{ success: true }> {
  return requestJson(authFetch, `/api/emergency/contacts/${id}`, { method: 'DELETE' });
}

// ── Quick phrases ──
export function listPhrases(authFetch: AuthFetch): Promise<{ phrases: QuickPhrase[] }> {
  return requestJson(authFetch, '/api/emergency/phrases');
}
export function createPhrase(
  authFetch: AuthFetch,
  body: { text: string; language: LanguageCode; sortOrder?: number },
): Promise<{ phrase: QuickPhrase }> {
  return requestJson(authFetch, '/api/emergency/phrases', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function updatePhrase(
  authFetch: AuthFetch,
  id: string,
  body: Partial<{ text: string; language: LanguageCode; sortOrder: number }>,
): Promise<{ phrase: QuickPhrase }> {
  return requestJson(authFetch, `/api/emergency/phrases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
export function deletePhrase(authFetch: AuthFetch, id: string): Promise<{ success: true }> {
  return requestJson(authFetch, `/api/emergency/phrases/${id}`, { method: 'DELETE' });
}

// ── History ──
export function listHistory(authFetch: AuthFetch): Promise<{ events: EmergencyEvent[] }> {
  return requestJson(authFetch, '/api/emergency/history');
}
export function logEvent(
  authFetch: AuthFetch,
  body: { text: string; language: LanguageCode; channel: 'spoken' | 'displayed' | 'contact' },
): Promise<{ event: EmergencyEvent }> {
  return requestJson(authFetch, '/api/emergency/history', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function clearHistory(authFetch: AuthFetch): Promise<{ deleted: number }> {
  return requestJson(authFetch, '/api/emergency/history', { method: 'DELETE' });
}
