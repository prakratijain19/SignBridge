import type { LanguageCode } from '@signbridge/shared-types';
import { speak, ttsSupported } from '@/lib/speech/speech-service';
import { translate } from '@/lib/translation-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * The modality orchestration layer for live conversation mode. This is the
 * single place that turns one participant's turn into output for the other seat.
 * It deliberately isolates the seams the rest of the UI relies on.
 */

export { textToISL } from './text-to-gloss';
export { ttsSupported };

/**
 * Translation seam (Phase 7). Delegates to the server-side translation provider
 * via the API. Same-language is short-circuited server-side; any failure falls
 * back to the original text, so callers never break.
 */
export async function translateText(
  authFetch: AuthFetch,
  text: string,
  from: LanguageCode,
  to: LanguageCode,
): Promise<string> {
  if (from === to) return text;
  const result = await translate(authFetch, { text, from, to });
  return result.text;
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
}

/** Speaks a sign turn aloud for the hearing participant (delegates to Phase 4 TTS). */
export function speakText(
  text: string,
  lang: LanguageCode,
  callbacks: SpeakCallbacks = {},
): Promise<{ matchedLanguage: boolean }> {
  return speak(text, {
    lang,
    onStart: callbacks.onStart,
    onEnd: callbacks.onEnd,
    onError: callbacks.onEnd,
  });
}
