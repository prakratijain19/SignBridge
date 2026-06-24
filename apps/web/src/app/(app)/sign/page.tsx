'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Hand, Camera, CameraOff, AlertCircle, Play, Square } from 'lucide-react';
import type { IslLabel } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { useSignRecognition } from '@/lib/sign/use-sign-recognition';
import { displayLabel } from '@/lib/sign/vocabulary';
import type { HandResult } from '@/lib/sign/landmark-features';
import { addMessage, createConversation } from '@/lib/conversations-api';
import { useT } from '@/lib/i18n/use-translation';
import type { TFunction } from '@/lib/i18n/use-translation';

function cameraErrorMessage(t: TFunction, code: string): string {
  switch (code) {
    case 'not-supported':
      return t('sign.error.notSupported');
    case 'camera-denied':
      return t('sign.error.cameraDenied');
    case 'no-camera':
      return t('sign.error.noCamera');
    default:
      return t('sign.error.default');
  }
}

export default function SignPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const { settings } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [recognized, setRecognized] = useState<string[]>([]);

  // Persist each stable sign as a SIGN message in a LIVE conversation.
  const conversationIdRef = useRef<string | null>(null);
  const ensureRef = useRef<Promise<string> | null>(null);
  const ensureConversation = useCallback((): Promise<string> => {
    if (conversationIdRef.current) return Promise.resolve(conversationIdRef.current);
    if (!ensureRef.current) {
      ensureRef.current = createConversation(authFetch, { mode: 'LIVE' }).then(
        ({ conversation }) => {
          conversationIdRef.current = conversation.id;
          return conversation.id;
        },
      );
    }
    return ensureRef.current;
  }, [authFetch]);

  const handleStableSign = useCallback(
    (label: IslLabel) => {
      const text = displayLabel(label);
      setRecognized((prev) => [...prev, text]);
      void (async () => {
        try {
          const id = await ensureConversation();
          await addMessage(authFetch, id, {
            sender: 'USER',
            modality: 'SIGN',
            language: settings.interfaceLanguage,
            content: text,
          });
        } catch {
          // Persisting is best-effort; the on-screen transcript still updates.
        }
      })();
    },
    [authFetch, ensureConversation, settings.interfaceLanguage],
  );

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

  const recognition = useSignRecognition({
    videoRef,
    onStableSign: handleStableSign,
    // Honor reduce-motion: skip the per-frame landmark overlay when set.
    onFrame: settings.reduceMotion ? undefined : drawOverlay,
  });

  // Clear the overlay whenever motion is reduced.
  useEffect(() => {
    if (!settings.reduceMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [settings.reduceMotion]);

  const { supported, modelChecked, modelLoaded, error } = recognition;

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('sign.title')} context={t('sign.context')} />

      <p className="mb-6">
        <Link href="/sign/collect" className="text-sm font-medium text-iris hover:underline">
          {t('sign.collectLink')}
        </Link>
      </p>

      {!supported ? (
        <UnsupportedNotice />
      ) : modelChecked && !modelLoaded ? (
        <ModelNotTrained />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="camera-heading" className="card p-4">
            <h2 id="camera-heading" className="sr-only">
              {t('sign.camera')}
            </h2>
            <div className="relative overflow-hidden rounded-2xl bg-ink/90 shadow-soft">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-video w-full object-cover"
              />
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
              {!recognition.running && (
                <div className="absolute inset-0 flex items-center justify-center text-canvas/80">
                  <Camera aria-hidden="true" className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {recognition.running ? (
                <button type="button" onClick={recognition.stop} className="btn-secondary">
                  <Square aria-hidden="true" className="h-5 w-5" />
                  {t('sign.stopCamera')}
                </button>
              ) : (
                <button type="button" onClick={recognition.start} className="btn-primary px-6 py-3">
                  <Play aria-hidden="true" className="h-5 w-5" />
                  {t('sign.startCamera')}
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-beacon">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {cameraErrorMessage(t, error)}
              </p>
            )}
          </section>

          <RecognitionReadout recognition={recognition} recognized={recognized} />
        </div>
      )}
    </div>
  );
}

function RecognitionReadout({
  recognition,
  recognized,
}: {
  recognition: ReturnType<typeof useSignRecognition>;
  recognized: string[];
}) {
  const t = useT();
  const { currentPrediction, stableLabel, running } = recognition;
  const confidencePct =
    currentPrediction != null ? Math.round(currentPrediction.confidence * 100) : null;

  return (
    <section aria-labelledby="readout-heading" className="card p-6">
      <h2 id="readout-heading" className="font-display text-xl font-semibold text-ink">
        {t('sign.recognizedSign')}
      </h2>

      {/* Large, high-contrast current sign. Scales with the text-size setting. */}
      <div
        aria-live="polite"
        aria-label={t('sign.recognizedSign')}
        className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-2xl bg-aurora-soft p-6 text-center"
      >
        <span aria-hidden="true" className="icon-tile h-11 w-11">
          <Hand aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-2 text-4xl font-semibold text-ink">
          {stableLabel ? displayLabel(stableLabel) : running ? t('sign.watching') : '—'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {confidencePct != null
            ? t('sign.currentBest', {
                label: currentPrediction ? displayLabel(currentPrediction.label) : '',
                pct: confidencePct,
              })
            : running
              ? t('sign.showSign')
              : t('sign.pressStart')}
        </p>
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">
        {t('sign.thisSession')}
      </h3>
      {recognized.length === 0 ? (
        <p className="mt-2 text-muted">{t('sign.noSignsYet')}</p>
      ) : (
        <p className="mt-2 text-lg text-ink">{recognized.join(' · ')}</p>
      )}
    </section>
  );
}

function UnsupportedNotice() {
  const t = useT();
  return (
    <div className="card flex items-start gap-3 p-6">
      <span aria-hidden="true" className="icon-tile h-11 w-11 shrink-0">
        <CameraOff aria-hidden="true" className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-ink">{t('sign.unsupportedTitle')}</p>
        <p className="mt-1 text-sm text-muted">{t('sign.unsupportedBody')}</p>
      </div>
    </div>
  );
}

function ModelNotTrained() {
  const t = useT();
  return (
    <div className="card p-8 text-center">
      <span aria-hidden="true" className="icon-tile mx-auto h-11 w-11">
        <Hand aria-hidden="true" className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium text-ink">{t('sign.notTrainedTitle')}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t('sign.notTrainedBody')}</p>
      <Link href="/sign/collect" className="btn-primary mt-4 px-6 py-3">
        {t('sign.collectButton')}
      </Link>
    </div>
  );
}
