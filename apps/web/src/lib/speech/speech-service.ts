import type { LanguageCode } from '@signbridge/shared-types';

/**
 * Framework-agnostic wrapper around the browser Web Speech API. The UI talks
 * only to this module, so a cloud STT/TTS provider can be swapped in later
 * without touching components.
 */

/** Maps our short language codes to the BCP-47 tags the Web Speech API expects. */
const BCP47: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

export function toBcp47(lang: LanguageCode): string {
  return BCP47[lang];
}

// ---- Speech-to-text -------------------------------------------------------

export interface RecognizerCallbacks {
  lang: LanguageCode;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}

export interface SpeechRecognizer {
  start: () => void;
  stop: () => void;
  supported: boolean;
}

function getRecognitionCtor(): typeof SpeechRecognition | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/** True if the current browser supports live speech recognition. */
export function recognitionSupported(): boolean {
  return getRecognitionCtor() !== undefined;
}

export function createSpeechRecognizer(cb: RecognizerCallbacks): SpeechRecognizer {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return { start: () => {}, stop: () => {}, supported: false };
  }

  const recognition = new Ctor();
  recognition.lang = toBcp47(cb.lang);
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result) continue;
      const transcript = result[0]?.transcript ?? '';
      if (result.isFinal) {
        const finalText = transcript.trim();
        if (finalText) cb.onFinal(finalText);
      } else {
        interim += transcript;
      }
    }
    cb.onInterim(interim);
  };

  recognition.onerror = (event) => cb.onError(event.error);
  recognition.onend = () => cb.onEnd();

  let active = false;
  return {
    supported: true,
    start: () => {
      if (active) return;
      active = true;
      try {
        recognition.start();
      } catch {
        // start() throws if called while already starting; ignore.
        active = false;
      }
    },
    stop: () => {
      active = false;
      recognition.stop();
    },
  };
}

// ---- Text-to-speech -------------------------------------------------------

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Resolves the available synthesis voices. Voices load asynchronously, so we
 * wait for the `voiceschanged` event if the list is initially empty.
 */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish, { once: true });
    // Fallback in case the event never fires (some browsers).
    setTimeout(finish, 1000);
  });
}

export interface SpeakOptions {
  lang: LanguageCode;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Speaks the given text. Returns `{ ok }` indicating whether a matching voice
 * for the requested language was found; when false a default voice is used and
 * the caller can inform the user.
 */
export async function speak(
  text: string,
  options: SpeakOptions,
): Promise<{ matchedLanguage: boolean }> {
  if (!ttsSupported() || !text.trim()) {
    options.onError?.();
    return { matchedLanguage: false };
  }

  const synth = window.speechSynthesis;
  synth.cancel(); // stop anything currently speaking

  const bcp47 = toBcp47(options.lang);
  const voices = await getVoices();
  const requested = options.voiceURI
    ? voices.find((v) => v.voiceURI === options.voiceURI)
    : undefined;
  const byLang =
    voices.find((v) => v.lang === bcp47) ?? voices.find((v) => v.lang.startsWith(options.lang));
  const voice = requested ?? byLang;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  if (voice) utterance.voice = voice;
  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  synth.speak(utterance);
  return { matchedLanguage: Boolean(byLang) };
}

export function cancelSpeech(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
