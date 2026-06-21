/**
 * @signbridge/shared-types
 *
 * Types shared between the web app, the API, and (via codegen later) the ML
 * service. Keep this package free of runtime dependencies so it can be imported
 * from any environment.
 */

/** Supported interface and translation languages for the MVP. */
export type LanguageCode = 'en' | 'hi' | 'gu';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'hi', 'gu'] as const;

/** The communication media SignBridge bridges between. */
export type Modality = 'sign' | 'speech' | 'text' | 'avatar';

/** Standard envelope returned by every API endpoint. */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };

export interface ApiError {
  /** Machine-readable code, e.g. "VALIDATION_ERROR". */
  code: string;
  /** Human-readable message safe to surface to end users. */
  message: string;
  /** Optional field-level details for form validation. */
  details?: Record<string, string[]>;
}

/**
 * User roles. Kept in sync with the Prisma `Role` enum (same members).
 * Only the first three are self-selectable at registration; `ADMIN` is
 * assigned out-of-band and never via the public API.
 */
export type UserRole = 'DEAF_USER' | 'HEARING_USER' | 'LEARNER' | 'ADMIN';

export const SELECTABLE_ROLES: readonly UserRole[] = [
  'DEAF_USER',
  'HEARING_USER',
  'LEARNER',
] as const;

/** A user as exposed to clients — never includes secrets like passwordHash. */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/** Payload returned by register/login: the user plus a short-lived access token. */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

/** Relative size of interface text, applied app-wide via a CSS scale. */
export type TextScale = 'NORMAL' | 'LARGE' | 'LARGER';

/** The authenticated user's profile, as returned by the users API. */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

/** Per-user interface preferences, applied app-wide. */
export interface UserSettings {
  interfaceLanguage: LanguageCode;
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
  captionsEnabled: boolean;
}

/** How a conversation is conducted. SPEECH is this phase; others land later. */
export type ConversationMode = 'SPEECH' | 'LIVE' | 'VIDEO';

/** The medium a single message was produced in. */
export type MessageModality = 'SPEECH' | 'TEXT' | 'SIGN' | 'AVATAR';

/** Who produced a message: the signed-in user or their conversation partner. */
export type MessageSender = 'USER' | 'PARTNER';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  modality: MessageModality;
  language: LanguageCode;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  mode: ConversationMode;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/** List item for the conversation history view: a conversation plus a preview. */
export interface ConversationSummary extends Conversation {
  messageCount: number;
  lastMessagePreview: string | null;
}

/** Service health payload returned by GET /api/health. */
export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  dependencies: {
    database: 'connected' | 'disconnected';
  };
}
