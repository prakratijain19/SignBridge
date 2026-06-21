'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Square, Plus, AlertCircle } from 'lucide-react';
import type { LanguageCode, Message, MessageModality } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { useSpeechToText } from '@/lib/speech/use-speech-to-text';
import { useTextToSpeech } from '@/lib/speech/use-text-to-speech';
import { addMessage, createConversation } from '@/lib/conversations-api';

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

/** Maps a recognition error code to clear, recovery-oriented guidance. */
function recognitionErrorMessage(code: string): string {
  switch (code) {
    case 'not-supported':
      return 'Live transcription needs Chrome or Edge.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in your browser’s site settings, then try again.';
    case 'audio-capture':
      return 'No microphone found. Connect one and try again.';
    case 'no-speech':
      return 'No speech detected. Press the mic and try again.';
    case 'network':
      return 'Network problem during transcription. Check your connection and retry.';
    default:
      return `Transcription stopped (${code}). Press the mic to try again.`;
  }
}

export default function SpeechPage() {
  const { authFetch } = useAuth();
  const { settings } = useSettings();

  const [lang, setLang] = useState<LanguageCode>(settings.interfaceLanguage);
  const langTouched = useRef(false);
  // Follow the interface language until the user explicitly picks one here.
  useEffect(() => {
    if (!langTouched.current) setLang(settings.interfaceLanguage);
  }, [settings.interfaceLanguage]);

  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track the active conversation id without re-rendering on every save, and
  // de-duplicate concurrent "create conversation" calls.
  const conversationIdRef = useRef<string | null>(null);
  const ensurePromiseRef = useRef<Promise<string> | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const ensureConversation = useCallback((): Promise<string> => {
    if (conversationIdRef.current) return Promise.resolve(conversationIdRef.current);
    if (!ensurePromiseRef.current) {
      ensurePromiseRef.current = createConversation(authFetch, { mode: 'SPEECH' }).then(
        ({ conversation }) => {
          conversationIdRef.current = conversation.id;
          setHasSession(true);
          return conversation.id;
        },
      );
    }
    return ensurePromiseRef.current;
  }, [authFetch]);

  const persistMessage = useCallback(
    async (content: string, modality: MessageModality, messageLang: LanguageCode) => {
      setSaveError(null);
      try {
        const id = await ensureConversation();
        const { message } = await addMessage(authFetch, id, {
          sender: 'USER',
          modality,
          language: messageLang,
          content,
        });
        setSessionMessages((prev) => [...prev, message]);
      } catch {
        setSaveError('Could not save that line. Your transcript may be incomplete.');
      }
    },
    [authFetch, ensureConversation],
  );

  const handleFinal = useCallback(
    (text: string) => {
      void persistMessage(text, 'SPEECH', lang);
    },
    [persistMessage, lang],
  );

  const stt = useSpeechToText({ lang, onFinal: handleFinal });
  const tts = useTextToSpeech();

  function changeLanguage(next: LanguageCode) {
    langTouched.current = true;
    if (stt.isListening) stt.stop();
    setLang(next);
  }

  function newSession() {
    stt.stop();
    conversationIdRef.current = null;
    ensurePromiseRef.current = null;
    setHasSession(false);
    setSessionMessages([]);
    setSaveError(null);
  }

  return (
    <div>
      <PageHeader
        title="Speech"
        context="Turn speech into text, or type a message and have it spoken aloud."
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor="speech-lang" className="block text-sm font-medium text-ink">
            Language
          </label>
          <select
            id="speech-lang"
            value={lang}
            onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
            className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 text-ink"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={newSession}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New session
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SpeakToText
          stt={stt}
          reduceMotion={settings.reduceMotion}
          errorMessage={stt.error ? recognitionErrorMessage(stt.error) : null}
        />
        <TypeToSpeech lang={lang} tts={tts} onSave={(text) => persistMessage(text, 'TEXT', lang)} />
      </div>

      {saveError && (
        <p role="alert" className="mt-4 text-sm text-beacon">
          {saveError}
        </p>
      )}

      <SessionTranscript messages={sessionMessages} hasSession={hasSession} />
    </div>
  );
}

function SpeakToText({
  stt,
  reduceMotion,
  errorMessage,
}: {
  stt: ReturnType<typeof useSpeechToText>;
  reduceMotion: boolean;
  errorMessage: string | null;
}) {
  const statusText = stt.isListening ? 'Listening…' : 'Microphone off';

  return (
    <section aria-labelledby="stt-heading" className="rounded-xl border border-line bg-surface p-6">
      <h2 id="stt-heading" className="font-display text-xl font-semibold text-ink">
        Speak → text
      </h2>

      {!stt.supported ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-canvas p-4 text-sm text-ink">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-signalInk" />
          <p>
            Live transcription needs Chrome or Edge. You can still type a message and have it spoken
            below.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => (stt.isListening ? stt.stop() : stt.start())}
            aria-pressed={stt.isListening}
            aria-label={stt.isListening ? 'Stop listening' : 'Start listening'}
            className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition ${
              stt.isListening
                ? 'border-beacon bg-beacon/10 text-beacon'
                : 'border-signal bg-signal text-surface hover:bg-signalInk'
            } ${stt.isListening && !reduceMotion ? 'animate-pulse' : ''}`}
          >
            {stt.isListening ? (
              <Square aria-hidden="true" className="h-7 w-7" />
            ) : (
              <Mic aria-hidden="true" className="h-8 w-8" />
            )}
          </button>
          {/* Assertive so state changes are announced promptly. */}
          <p
            aria-live="assertive"
            className="flex items-center gap-1.5 text-sm font-medium text-ink"
          >
            {stt.isListening ? (
              <Mic aria-hidden="true" className="h-4 w-4 text-beacon" />
            ) : (
              <MicOff aria-hidden="true" className="h-4 w-4 text-muted" />
            )}
            {statusText}
          </p>
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-beacon">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      {/* Live transcript. Polite so it doesn't interrupt the status announcements.
          Text scales with the user's text-size preference (rem-based sizing). */}
      <div
        aria-live="polite"
        aria-label="Live transcript"
        className="mt-4 min-h-24 rounded-lg border border-line bg-canvas p-4 text-xl leading-relaxed text-ink"
      >
        {stt.finalText && <span>{stt.finalText} </span>}
        {stt.interimText && <span className="text-muted">{stt.interimText}</span>}
        {!stt.finalText && !stt.interimText && (
          <span className="text-base text-muted">
            {stt.supported
              ? 'Press the mic and start speaking — your words appear here.'
              : 'Transcription is unavailable in this browser.'}
          </span>
        )}
      </div>
    </section>
  );
}

function TypeToSpeech({
  lang,
  tts,
  onSave,
}: {
  lang: LanguageCode;
  tts: ReturnType<typeof useTextToSpeech>;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  async function handleSpeak() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setVoiceNote(null);
    const { matchedLanguage } = await tts.speak(trimmed, { lang });
    if (!matchedLanguage) {
      setVoiceNote('No voice is installed for this language, so a default voice was used.');
    }
    onSave(trimmed);
  }

  return (
    <section aria-labelledby="tts-heading" className="rounded-xl border border-line bg-surface p-6">
      <h2 id="tts-heading" className="font-display text-xl font-semibold text-ink">
        Type → speech
      </h2>

      {!tts.supported ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-canvas p-4 text-sm text-ink">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-signalInk" />
          <p>Text-to-speech isn’t available in this browser.</p>
        </div>
      ) : (
        <>
          <label htmlFor="tts-text" className="mt-4 block text-sm font-medium text-ink">
            Message to speak
          </label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
            placeholder="Type something to say aloud…"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={!text.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60"
            >
              <Volume2 aria-hidden="true" className="h-5 w-5" />
              Speak
            </button>
            {tts.speaking && (
              <button
                type="button"
                onClick={tts.cancel}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
              >
                <Square aria-hidden="true" className="h-4 w-4" />
                Stop
              </button>
            )}
            <span aria-live="polite" className="text-sm text-muted">
              {tts.speaking ? 'Speaking…' : ''}
            </span>
          </div>
          {voiceNote && (
            <p role="status" className="mt-2 text-sm text-muted">
              {voiceNote}
            </p>
          )}
        </>
      )}
    </section>
  );
}

const MODALITY_LABEL: Record<MessageModality, string> = {
  SPEECH: 'Spoken',
  TEXT: 'Typed',
  SIGN: 'Signed',
  AVATAR: 'Avatar',
};

function SessionTranscript({ messages, hasSession }: { messages: Message[]; hasSession: boolean }) {
  const ordered = useMemo(() => messages, [messages]);

  return (
    <section aria-labelledby="session-heading" className="mt-8">
      <h2
        id="session-heading"
        className="text-sm font-semibold uppercase tracking-wider text-muted"
      >
        This session
      </h2>
      {ordered.length === 0 ? (
        <p className="mt-3 text-muted">
          {hasSession
            ? 'No lines saved yet.'
            : 'Start speaking or speak a typed message to begin a session.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ordered.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {MODALITY_LABEL[m.modality]} · {m.language.toUpperCase()}
              </p>
              <p className="mt-1 text-ink">{m.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
