'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Hand,
  Camera,
  Volume2,
  AlertCircle,
  Play,
  Square,
  ArrowLeftRight,
} from 'lucide-react';
import type { IslGlossToken, LanguageCode } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { useLiveConversation, type LiveTurn } from '@/lib/live/use-live-conversation';
import type { HandResult } from '@/lib/sign/landmark-features';
import { displayLabel } from '@/lib/sign/vocabulary';
import { translate } from '@/lib/translation-api';
import { useT } from '@/lib/i18n/use-translation';
import { AvatarStage } from '@/components/AvatarStage';

const DISPLAY_LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

type AuthFetch = ReturnType<typeof useAuth>['authFetch'];

export default function LivePage() {
  const t = useT();
  const { settings } = useSettings();
  const { authFetch } = useAuth();
  const [displayLang, setDisplayLang] = useState<LanguageCode>(settings.interfaceLanguage);
  // The Speaking participant defaults to English; this drives STT and the
  // stored language of speech turns (independent of the UI language).
  const [speakingLang, setSpeakingLang] = useState<LanguageCode>('en');
  const [showAvatar, setShowAvatar] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawOverlay = useCallback((hands: HandResult[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth || canvas.clientWidth;
    canvas.height = video.videoHeight || canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2f6df6';
    for (const hand of hands) {
      for (const lm of hand.landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const live = useLiveConversation({
    videoRef,
    onFrame: settings.reduceMotion ? undefined : drawOverlay,
    speakingLang,
  });

  useEffect(() => {
    if (!settings.reduceMotion) return;
    const ctx = canvasRef.current?.getContext('2d');
    const canvas = canvasRef.current;
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [settings.reduceMotion]);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('live.pageTitle')} context={t('live.pageContext')} />

      <SessionControls live={live} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SignZone live={live} videoRef={videoRef} canvasRef={canvasRef} />
        <SpeechZone live={live} speakingLang={speakingLang} setSpeakingLang={setSpeakingLang} />
      </div>

      <SpeechAvatar transcript={live.transcript} show={showAvatar} setShow={setShowAvatar} />

      <SharedTranscript
        transcript={live.transcript}
        speaking={live.speaking}
        displayLang={displayLang}
        setDisplayLang={setDisplayLang}
        authFetch={authFetch}
      />
    </div>
  );
}

type Live = ReturnType<typeof useLiveConversation>;

function SessionControls({ live }: { live: Live }) {
  const t = useT();
  const otherSeat = live.activeSeat === 'speech' ? 'sign' : 'speech';
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      {live.started ? (
        <button
          type="button"
          onClick={live.end}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-beacon/40 bg-beacon/10 px-5 py-2.5 font-medium text-beacon transition hover:bg-beacon/15"
        >
          <Square aria-hidden="true" className="h-5 w-5" />
          {t('live.endSession')}
        </button>
      ) : (
        <button
          type="button"
          onClick={live.start}
          className="btn-primary inline-flex min-h-11 items-center gap-2 px-6 py-3"
        >
          <Play aria-hidden="true" className="h-5 w-5" />
          {t('live.startSession')}
        </button>
      )}

      <button
        type="button"
        onClick={() => live.setActiveSeat(otherSeat)}
        disabled={!live.started}
        className="btn-secondary inline-flex min-h-11 items-center gap-2 px-5 py-2.5 disabled:opacity-60"
      >
        <ArrowLeftRight aria-hidden="true" className="h-5 w-5" />
        {t('live.handTurnTo', {
          seat: otherSeat === 'speech' ? t('live.seatSpeaking') : t('live.seatSigning'),
        })}
      </button>

      <p aria-live="polite" className="text-sm font-medium text-ink">
        {live.started
          ? t('live.activeSeat', {
              participant:
                live.activeSeat === 'speech'
                  ? t('live.speakingParticipant')
                  : t('live.signingParticipant'),
            })
          : t('live.sessionNotStarted')}
      </p>

      {live.conversationId && (
        <Link
          href="/history"
          className="ml-auto text-sm font-medium text-signalInk hover:underline"
        >
          {t('live.viewInHistory')}
        </Link>
      )}
    </div>
  );
}

function SignZone({
  live,
  videoRef,
  canvasRef,
}: {
  live: Live;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const t = useT();
  const active = live.activeSeat === 'sign';
  const { currentPrediction, stableLabel, running } = live.sign;
  const confidencePct =
    currentPrediction != null ? Math.round(currentPrediction.confidence * 100) : null;

  return (
    <section
      aria-labelledby="sign-zone"
      className={`card p-6 transition ${active ? 'shadow-glow ring-1 ring-iris/40' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-tile h-10 w-10">
            <Hand className="h-5 w-5 text-iris" />
          </span>
          <h2 id="sign-zone" className="font-display text-lg font-semibold text-ink">
            {t('live.signingParticipant')}
          </h2>
        </div>
        {active && <span className="chip">{t('live.activeTurn')}</span>}
      </div>

      {!live.sign.supported ? (
        <DegradedNotice text={t('live.signUnsupported')} />
      ) : live.signModelChecked && !live.signModelReady ? (
        <div className="mt-4 rounded-xl border border-line bg-aurora-soft p-4 text-sm text-ink">
          <p className="font-medium">{t('live.noModelTitle')}</p>
          <p className="mt-1 text-muted">{t('live.noModelBody')}</p>
          <Link
            href="/sign/collect"
            className="mt-2 inline-block font-medium text-signalInk hover:underline"
          >
            {t('live.collectSamples')}
          </Link>
        </div>
      ) : (
        <>
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-ink/90 shadow-soft">
            <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {!running && (
              <div className="absolute inset-0 flex items-center justify-center text-canvas/80">
                <Camera aria-hidden="true" className="h-9 w-9" />
              </div>
            )}
          </div>

          <div
            aria-live="polite"
            aria-label={t('live.recognizedSign')}
            className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-aurora-soft px-4 py-3"
          >
            <span className="flex items-center gap-2">
              <Hand aria-hidden="true" className="h-5 w-5 text-iris" />
              <span className="text-2xl font-semibold text-ink">
                {stableLabel ? displayLabel(stableLabel) : running ? t('live.watching') : '—'}
              </span>
            </span>
            <span className="text-sm text-muted">
              {confidencePct != null ? `${confidencePct}%` : ''}
            </span>
          </div>

          {live.sign.error && (
            <p role="alert" className="mt-2 text-sm text-beacon">
              {t('live.cameraProblem', { error: live.sign.error })}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function SpeechZone({
  live,
  speakingLang,
  setSpeakingLang,
}: {
  live: Live;
  speakingLang: LanguageCode;
  setSpeakingLang: (lang: LanguageCode) => void;
}) {
  const t = useT();
  const active = live.activeSeat === 'speech';
  const { isListening, interimText, supported, error } = live.speech;

  return (
    <section
      aria-labelledby="speech-zone"
      className={`card p-6 transition ${active ? 'shadow-glow ring-1 ring-iris/40' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-tile h-10 w-10">
            <Volume2 className="h-5 w-5 text-iris" />
          </span>
          <h2 id="speech-zone" className="font-display text-lg font-semibold text-ink">
            {t('live.speakingParticipant')}
          </h2>
        </div>
        {active && <span className="chip">{t('live.activeTurn')}</span>}
      </div>

      <label htmlFor="speaking-lang" className="mt-3 flex items-center gap-2 text-sm text-ink">
        {t('live.speakingLanguage')}
        <select
          id="speaking-lang"
          value={speakingLang}
          onChange={(e) => setSpeakingLang(e.target.value as LanguageCode)}
          className="rounded-xl border border-line bg-surface px-2 py-1.5 text-ink transition focus:border-signal"
        >
          {DISPLAY_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {!supported ? (
        <DegradedNotice text={t('live.speechUnsupported')} />
      ) : (
        <>
          <p
            aria-live="assertive"
            className="mt-4 flex items-center gap-2 text-sm font-medium text-ink"
          >
            {isListening ? (
              <Mic aria-hidden="true" className="h-5 w-5 text-bridge" />
            ) : (
              <MicOff aria-hidden="true" className="h-5 w-5 text-muted" />
            )}
            <span className="chip">
              {isListening ? t('live.listening') : active ? t('live.readyToSpeak') : t('live.idle')}
            </span>
          </p>

          {/* Large, high-contrast live captions honoring the text-scale setting. */}
          <div
            aria-live="polite"
            aria-label={t('live.liveCaptions')}
            className={`mt-3 min-h-28 rounded-xl border border-line p-4 text-2xl leading-relaxed text-ink transition ${active ? 'bg-aurora-soft' : 'bg-canvas'}`}
          >
            {interimText ? (
              interimText
            ) : (
              <span className="text-base text-muted">
                {active ? t('live.captionsPlaceholder') : t('live.handTurnHere')}
              </span>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-2 text-sm text-beacon">
              {t('live.micProblem', { error })}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Optional avatar that FINGERSPELLS (letter by letter) the most recent spoken
 * turn for the signing participant. Non-blocking: if poses aren't generated the
 * AvatarStage shows its own note and the rest of the live page still works.
 */
function SpeechAvatar({
  transcript,
  show,
  setShow,
}: {
  transcript: LiveTurn[];
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  const t = useT();
  const lastSpeech =
    [...transcript].reverse().find((turn) => turn.seat === 'speech')?.content ?? '';

  return (
    <section aria-labelledby="avatar-heading" className="card mt-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="avatar-heading" className="font-display text-lg font-semibold text-ink">
          {t('live.signAvatar')}
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={show}
          onClick={() => setShow(!show)}
          className="btn-secondary inline-flex min-h-11 items-center px-4 text-sm"
        >
          {show ? t('live.hideAvatar') : t('live.showAvatar')}
        </button>
      </div>
      {show && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted">{t('live.avatarHelper')}</p>
          <AvatarStage text={lastSpeech} autoPlay />
        </div>
      )}
    </section>
  );
}

function SharedTranscript({
  transcript,
  speaking,
  displayLang,
  setDisplayLang,
  authFetch,
}: {
  transcript: LiveTurn[];
  speaking: boolean;
  displayLang: LanguageCode;
  setDisplayLang: (lang: LanguageCode) => void;
  authFetch: AuthFetch;
}) {
  const t = useT();
  return (
    <section aria-labelledby="transcript-heading" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="transcript-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted"
        >
          {t('live.conversation')}
        </h2>
        <div className="flex items-center gap-3">
          {speaking && (
            <span className="chip inline-flex items-center gap-1.5 text-bridge">
              <Volume2 aria-hidden="true" className="h-4 w-4" />
              {t('live.speaking')}
            </span>
          )}
          <label htmlFor="display-lang" className="flex items-center gap-2 text-sm text-ink">
            {t('live.showMessagesIn')}
            <select
              id="display-lang"
              value={displayLang}
              onChange={(e) => setDisplayLang(e.target.value as LanguageCode)}
              className="rounded-xl border border-line bg-surface px-2 py-1.5 text-ink transition focus:border-signal"
            >
              {DISPLAY_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {transcript.length === 0 ? (
        <p className="mt-3 text-muted">{t('live.noTurns')}</p>
      ) : (
        <ol aria-live="polite" className="mt-3 space-y-3">
          {transcript.map((turn) => (
            <TurnItem key={turn.id} turn={turn} displayLang={displayLang} authFetch={authFetch} />
          ))}
        </ol>
      )}
    </section>
  );
}

/** A single transcript turn, translated into the chosen display language. */
function TurnItem({
  turn,
  displayLang,
  authFetch,
}: {
  turn: LiveTurn;
  displayLang: LanguageCode;
  authFetch: AuthFetch;
}) {
  const t = useT();
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (turn.language === displayLang) {
      setTranslated(null);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    void translate(authFetch, { text: turn.content, from: turn.language, to: displayLang })
      .then((res) => {
        // Only show translated text when a real translation happened.
        if (!cancelled) setTranslated(res.translated ? res.text : null);
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [turn.content, turn.language, displayLang, authFetch]);

  const showingTranslation = translated !== null;

  return (
    <li
      className={`rounded-xl border border-line p-4 transition ${
        turn.seat === 'speech' ? 'bg-aurora-soft' : 'bg-canvas'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {turn.seat === 'speech' ? t('live.speakingParticipant') : t('live.signingParticipant')} ·{' '}
        {turn.modality === 'SPEECH' ? t('live.spoke') : t('live.signed')}
        {translating && ` · ${t('live.translatingInline')}`}
      </p>
      <p className="mt-1 text-lg text-ink">{showingTranslation ? translated : turn.content}</p>
      {showingTranslation && (
        <p className="mt-1 text-sm text-muted">{t('live.original', { text: turn.content })}</p>
      )}
      {turn.gloss && turn.gloss.length > 0 && <GlossRow gloss={turn.gloss} />}
    </li>
  );
}

/** Renders ISL gloss as a row of sign cards. // Phase 8: avatar renderer replaces this. */
function GlossRow({ gloss }: { gloss: IslGlossToken[] }) {
  const t = useT();
  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {t('live.signGloss')}
      </p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {gloss.map((token, i) => (
          <li
            key={`${token.text}-${i}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              token.known
                ? 'border-iris/40 bg-aurora-soft text-signalInk'
                : 'border-line bg-surface text-muted'
            }`}
          >
            {token.text}
            {!token.known && <span className="ml-1 text-xs text-muted">{t('live.spell')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DegradedNotice({ text }: { text: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-aurora-soft p-4 text-sm text-ink">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-signalInk" />
      <p>{text}</p>
    </div>
  );
}
