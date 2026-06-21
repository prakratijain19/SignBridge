import type {
  ApiResponse,
  Conversation,
  ConversationMode,
  ConversationSummary,
  ConversationWithMessages,
  LanguageCode,
  Message,
  MessageModality,
  MessageSender,
} from '@signbridge/shared-types';
import { API_URL, AuthApiError } from './auth-api';

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

export function createConversation(
  authFetch: AuthFetch,
  body: { title?: string; mode?: ConversationMode } = {},
): Promise<{ conversation: Conversation }> {
  return requestJson(authFetch, '/api/conversations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listConversations(
  authFetch: AuthFetch,
): Promise<{ conversations: ConversationSummary[] }> {
  return requestJson(authFetch, '/api/conversations');
}

export function getConversation(
  authFetch: AuthFetch,
  id: string,
): Promise<{ conversation: ConversationWithMessages }> {
  return requestJson(authFetch, `/api/conversations/${id}`);
}

export interface NewMessage {
  sender?: MessageSender;
  modality: MessageModality;
  language: LanguageCode;
  content: string;
}

export function addMessage(
  authFetch: AuthFetch,
  conversationId: string,
  message: NewMessage,
): Promise<{ message: Message }> {
  return requestJson(authFetch, `/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

export function renameConversation(
  authFetch: AuthFetch,
  id: string,
  title: string,
): Promise<{ conversation: Conversation }> {
  return requestJson(authFetch, `/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export function deleteConversation(authFetch: AuthFetch, id: string): Promise<{ success: true }> {
  return requestJson(authFetch, `/api/conversations/${id}`, { method: 'DELETE' });
}
