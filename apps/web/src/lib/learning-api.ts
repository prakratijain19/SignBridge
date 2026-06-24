import type {
  ApiResponse,
  LessonProgress,
  LessonStatus,
  SignMastery,
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

export function getProgress(
  authFetch: AuthFetch,
): Promise<{ lessons: LessonProgress[]; mastery: SignMastery[] }> {
  return requestJson(authFetch, '/api/learning/progress');
}

export function updateLesson(
  authFetch: AuthFetch,
  lessonId: string,
  body: { status: LessonStatus; score?: number },
): Promise<{ progress: LessonProgress }> {
  return requestJson(authFetch, `/api/learning/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function recordPractice(
  authFetch: AuthFetch,
  label: string,
  correct: boolean,
): Promise<{ mastery: SignMastery }> {
  return requestJson(authFetch, '/api/learning/practice', {
    method: 'POST',
    body: JSON.stringify({ label, correct }),
  });
}
