'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, AlertCircle, Hand } from 'lucide-react';
import type { IslLabel, SignSampleStats } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { ISL_VOCABULARY, displayLabel } from '@/lib/sign/vocabulary';
import { getHandLandmarker, detect } from '@/lib/sign/hand-landmarker';
import {
  extractFeatures,
  type HandResult,
  type ExtractedFeatures,
} from '@/lib/sign/landmark-features';
import { fetchSignStats, postSignSample } from '@/lib/sign/sign-api';
import { useT } from '@/lib/i18n/use-translation';

const RECOMMENDED_PER_LABEL = 40;
const FRAME_INTERVAL_MS = 100;

export default function CollectPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const { settings } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [label, setLabel] = useState<IslLabel>(ISL_VOCABULARY[0]);
  const [running, setRunning] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [stats, setStats] = useState<SignSampleStats[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef<ExtractedFeatures>({ features: [], handCount: 0 });
  const reduceMotionRef = useRef(settings.reduceMotion);
  useEffect(() => {
    reduceMotionRef.current = settings.reduceMotion;
  }, [settings.reduceMotion]);

  const refreshStats = useCallback(async () => {
    try {
      const { stats: s } = await fetchSignStats(authFetch);
      setStats(s);
    } catch {
      // Non-fatal; counts just won't update.
    }
  }, [authFetch]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const drawOverlay = useCallback((hands: HandResult[]) => {
    if (reduceMotionRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth || canvas.clientWidth;
    canvas.height = video.videoHeight || canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f9d8a';
    for (const hand of hands) {
      for (const lm of hand.landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setHandDetected(false);
  }, []);

  const start = useCallback(() => {
    setError(null);
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const landmarker = await getHandLandmarker();
        setRunning(true);

        intervalRef.current = setInterval(() => {
          const el = videoRef.current;
          if (!el || el.readyState < 2) return;
          const hands = detect(landmarker, el, performance.now());
          drawOverlay(hands);
          const extracted = extractFeatures(hands);
          latestRef.current = extracted;
          setHandDetected(extracted.handCount > 0);
        }, FRAME_INTERVAL_MS);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        setError(
          name === 'NotAllowedError'
            ? t('signCollect.cameraDenied')
            : name === 'NotFoundError'
              ? t('signCollect.noCamera')
              : t('signCollect.cameraError'),
        );
      }
    })();
  }, [drawOverlay, t]);

  useEffect(() => stop, [stop]);

  const capture = useCallback(async () => {
    const { features, handCount } = latestRef.current;
    if (handCount === 0 || features.length === 0) {
      setStatus(t('signCollect.noHandStatus'));
      return;
    }
    try {
      await postSignSample(authFetch, {
        label,
        features,
        handCount: handCount === 2 ? 2 : 1,
      });
      setStatus(t('signCollect.capturedStatus', { label: displayLabel(label) }));
      setStats((prev) => prev.map((s) => (s.label === label ? { ...s, count: s.count + 1 } : s)));
    } catch {
      setStatus(t('signCollect.saveError'));
    }
  }, [authFetch, label, t]);

  const captureBurst = useCallback(async () => {
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await capture();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 150));
    }
  }, [capture]);

  const currentCount = stats.find((s) => s.label === label)?.count ?? 0;

  return (
    <div className="animate-fade-up">
      <Link
        href="/sign"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-iris hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('signCollect.backToRecognition')}
      </Link>

      <PageHeader
        title={t('signCollect.title')}
        context={t('signCollect.context', { count: RECOMMENDED_PER_LABEL })}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="collect-camera" className="card p-4">
          <h2 id="collect-camera" className="sr-only">
            {t('signCollect.camera')}
          </h2>
          <div className="relative overflow-hidden rounded-2xl bg-ink/90 shadow-soft">
            <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {!running && (
              <div className="absolute inset-0 flex items-center justify-center text-canvas/80">
                <Camera aria-hidden="true" className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {running ? (
              <button type="button" onClick={stop} className="btn-secondary">
                {t('signCollect.stopCamera')}
              </button>
            ) : (
              <button type="button" onClick={start} className="btn-primary px-6 py-3">
                {t('signCollect.startCamera')}
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Hand
                aria-hidden="true"
                className={`h-4 w-4 ${handDetected ? 'text-bridge' : 'text-muted'}`}
              />
              {handDetected ? t('signCollect.handDetected') : t('signCollect.noHandDetected')}
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-beacon">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </section>

        <section aria-labelledby="collect-controls" className="card p-6">
          <h2 id="collect-controls" className="font-display text-xl font-semibold text-ink">
            {t('signCollect.capture')}
          </h2>

          <label htmlFor="label-select" className="mt-4 block text-sm font-medium text-ink">
            {t('signCollect.signLabel')}
          </label>
          <select
            id="label-select"
            value={label}
            onChange={(e) => setLabel(e.target.value as IslLabel)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal"
          >
            {ISL_VOCABULARY.map((l) => (
              <option key={l} value={l}>
                {displayLabel(l)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-muted">
            {t('signCollect.sampleCount', {
              current: currentCount,
              total: RECOMMENDED_PER_LABEL,
              label: displayLabel(label),
            })}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void capture()}
              disabled={!running}
              className="btn-primary px-6 py-3 disabled:opacity-60"
            >
              {t('signCollect.captureButton')}
            </button>
            <button
              type="button"
              onClick={() => void captureBurst()}
              disabled={!running}
              className="btn-secondary disabled:opacity-60"
            >
              {t('signCollect.captureBurst')}
            </button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-5 text-sm text-bridge">
            {status}
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">
            {t('signCollect.coverage')}
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {stats.map((s) => (
              <li key={s.label} className="flex justify-between">
                <span className="text-ink">{displayLabel(s.label)}</span>
                <span className={s.count >= RECOMMENDED_PER_LABEL ? 'text-bridge' : 'text-muted'}>
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
