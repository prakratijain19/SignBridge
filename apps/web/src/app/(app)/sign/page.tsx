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

function cameraErrorMessage(code: string): string {
  switch (code) {
    case 'not-supported':
      return 'Live sign recognition needs a modern browser with camera support (Chrome or Edge).';
    case 'camera-denied':
      return 'Camera access is blocked. Allow it in your browser’s site settings, then press Start again.';
    case 'no-camera':
      return 'No camera was found. Connect one and try again.';
    default:
      return 'Could not start the camera. Please try again.';
  }
}

export default function SignPage() {
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
    <div>
      <PageHeader
        title="Sign recognition"
        context="Show a sign to your camera and SignBridge will recognize it as text."
      />

      <p className="mb-6">
        <Link href="/sign/collect" className="text-sm font-medium text-signalInk hover:underline">
          Collect training samples →
        </Link>
      </p>

      {!supported ? (
        <UnsupportedNotice />
      ) : modelChecked && !modelLoaded ? (
        <ModelNotTrained />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="camera-heading"
            className="rounded-xl border border-line bg-surface p-4"
          >
            <h2 id="camera-heading" className="sr-only">
              Camera
            </h2>
            <div className="relative overflow-hidden rounded-lg bg-ink/90">
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
                <button
                  type="button"
                  onClick={recognition.stop}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:bg-canvas"
                >
                  <Square aria-hidden="true" className="h-5 w-5" />
                  Stop camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={recognition.start}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90"
                >
                  <Play aria-hidden="true" className="h-5 w-5" />
                  Start camera
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-beacon">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {cameraErrorMessage(error)}
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
  const { currentPrediction, stableLabel, running } = recognition;
  const confidencePct =
    currentPrediction != null ? Math.round(currentPrediction.confidence * 100) : null;

  return (
    <section
      aria-labelledby="readout-heading"
      className="rounded-xl border border-line bg-surface p-6"
    >
      <h2 id="readout-heading" className="font-display text-xl font-semibold text-ink">
        Recognized sign
      </h2>

      {/* Large, high-contrast current sign. Scales with the text-size setting. */}
      <div
        aria-live="polite"
        aria-label="Recognized sign"
        className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-lg border border-line bg-canvas p-6 text-center"
      >
        <Hand aria-hidden="true" className="h-7 w-7 text-signalInk" />
        <p className="mt-2 text-4xl font-semibold text-ink">
          {stableLabel ? displayLabel(stableLabel) : running ? 'Watching…' : '—'}
        </p>
        <p className="mt-1 text-sm text-muted">
          {confidencePct != null
            ? `Current best: ${currentPrediction ? displayLabel(currentPrediction.label) : ''} · ${confidencePct}% confidence`
            : running
              ? 'Show a sign to the camera.'
              : 'Press Start camera to begin.'}
        </p>
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">
        This session
      </h3>
      {recognized.length === 0 ? (
        <p className="mt-2 text-muted">No signs recognized yet.</p>
      ) : (
        <p className="mt-2 text-lg text-ink">{recognized.join(' · ')}</p>
      )}
    </section>
  );
}

function UnsupportedNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-6">
      <CameraOff aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-signalInk" />
      <div>
        <p className="font-medium text-ink">Sign recognition isn’t available here</p>
        <p className="mt-1 text-sm text-muted">
          It needs a modern browser with camera support, such as Chrome or Edge on a device with a
          camera.
        </p>
      </div>
    </div>
  );
}

function ModelNotTrained() {
  return (
    <div className="rounded-xl border border-line bg-surface p-8 text-center">
      <Hand aria-hidden="true" className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-3 font-medium text-ink">No recognition model yet</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        A model hasn’t been trained for this app yet. Collect sign samples first, then run the
        training script to enable live recognition.
      </p>
      <Link
        href="/sign/collect"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90"
      >
        Collect training samples
      </Link>
    </div>
  );
}
