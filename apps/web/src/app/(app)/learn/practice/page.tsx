'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  SkipForward,
  Play,
  Square,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { LESSONS, type IslLabel } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { PageHeader } from '@/components/PageHeader';
import { SignPoseView } from '@/components/SignPoseView';
import { useSignRecognition } from '@/lib/sign/use-sign-recognition';
import type { HandResult } from '@/lib/sign/landmark-features';
import { displayLabel } from '@/lib/sign/vocabulary';
import { recordPractice } from '@/lib/learning-api';
import { useT } from '@/lib/i18n/use-translation';

const ALL_LABELS = [...new Set(LESSONS.flatMap((l) => l.labels))];

function PracticeInner() {
  const t = useT();
  const { authFetch } = useAuth();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lesson');

  const labels = useMemo(() => {
    const lesson = lessonId ? LESSONS.find((l) => l.id === lessonId) : undefined;
    return lesson ? lesson.labels : ALL_LABELS;
  }, [lessonId]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct'>('idle');
  const targetRef = useRef<string>(labels[0] ?? '');
  const advancingRef = useRef(false);

  const target = labels[index];
  useEffect(() => {
    targetRef.current = target ?? '';
    advancingRef.current = false;
  }, [target]);

  const advance = useCallback(() => {
    setFeedback('idle');
    setIndex((i) => i + 1);
  }, []);

  const handleStable = useCallback(
    (label: IslLabel) => {
      if (advancingRef.current || !targetRef.current) return;
      if (label === targetRef.current) {
        advancingRef.current = true;
        setFeedback('correct');
        void recordPractice(authFetch, targetRef.current, true).catch(() => {});
        setTimeout(advance, 1100);
      }
    },
    [authFetch, advance],
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
    onStableSign: handleStable,
    onFrame: settings.reduceMotion ? undefined : drawOverlay,
  });

  function skip() {
    if (target) void recordPractice(authFetch, target, false).catch(() => {});
    advance();
  }

  const done = index >= labels.length;

  return (
    <div className="animate-fade-up">
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('learn.practice.back')}
      </Link>

      <PageHeader title={t('learn.practice.title')} context={t('learn.practice.context')} />

      {!recognition.supported ? (
        <Notice text={t('learn.practice.unsupported')} />
      ) : recognition.modelChecked && !recognition.modelLoaded ? (
        <div className="card p-6">
          <p className="font-medium text-ink">{t('learn.practice.noModelTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('learn.practice.noModelBody')}</p>
          <Link
            href="/sign/collect"
            className="mt-2 inline-block font-medium text-signalInk hover:underline"
          >
            {t('learn.practice.collectSamples')}
          </Link>
        </div>
      ) : done ? (
        <div className="card p-8 text-center">
          <span aria-hidden="true" className="icon-tile mx-auto mb-2 h-14 w-14">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="mt-2 font-display text-xl font-semibold text-ink">
            {t('learn.practice.allDone')}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t('learn.practice.youPracticed', { count: labels.length })}
          </p>
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="btn-primary mt-4 inline-flex min-h-11 items-center px-6 py-3"
          >
            {t('learn.practice.practiceAgain')}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Target sign */}
          <section aria-labelledby="target-heading" className="card p-4">
            <h2 id="target-heading" className="chip mb-2">
              {t('learn.practice.signProgress', { index: index + 1, total: labels.length })}
            </h2>
            <div className="mx-auto max-w-xs">{target && <SignPoseView label={target} />}</div>
            <p className="mt-3 text-center font-display text-4xl font-semibold text-ink">
              {target ? displayLabel(target) : ''}
            </p>
            <button
              type="button"
              onClick={skip}
              className="btn-secondary mt-4 inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <SkipForward aria-hidden="true" className="h-4 w-4" />
              {t('learn.practice.skip')}
            </button>
          </section>

          {/* Camera */}
          <section aria-labelledby="camera-heading" className="card p-4">
            <h2 id="camera-heading" className="sr-only">
              {t('learn.practice.cameraHeading')}
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
                  <Camera aria-hidden="true" className="h-9 w-9" />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              {recognition.running ? (
                <button
                  type="button"
                  onClick={recognition.stop}
                  className="btn-secondary inline-flex min-h-11 items-center gap-2"
                >
                  <Square aria-hidden="true" className="h-5 w-5" />
                  {t('learn.practice.stopCamera')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={recognition.start}
                  className="btn-primary inline-flex min-h-11 items-center gap-2 px-6 py-3"
                >
                  <Play aria-hidden="true" className="h-5 w-5" />
                  {t('learn.practice.startCamera')}
                </button>
              )}
            </div>

            {/* Feedback — icon + text + assertive announcement, never color alone. */}
            <p aria-live="assertive" className="mt-3 flex items-center gap-2 text-lg font-semibold">
              {feedback === 'correct' ? (
                <span className="flex items-center gap-2 text-bridge">
                  <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
                  {t('learn.practice.correct')}
                </span>
              ) : (
                <span className="text-muted">
                  {recognition.running
                    ? t('learn.practice.makeSign', { label: target ? displayLabel(target) : '' })
                    : t('learn.practice.startToBegin')}
                </span>
              )}
            </p>

            {recognition.error && (
              <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-beacon">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {t('learn.practice.cameraError', { error: recognition.error })}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="card flex items-start gap-2 p-6 text-sm text-ink">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-signalInk" />
      <p>{text}</p>
    </div>
  );
}

export default function PracticePage() {
  const t = useT();
  return (
    <Suspense fallback={<p className="text-muted">{t('learn.practice.loading')}</p>}>
      <PracticeInner />
    </Suspense>
  );
}
