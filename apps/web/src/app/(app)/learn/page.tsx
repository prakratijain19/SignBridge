'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleDot, Circle, GraduationCap, Dumbbell } from 'lucide-react';
import { LESSONS, type LessonProgress, type LessonStatus } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { getProgress } from '@/lib/learning-api';
import { useT } from '@/lib/i18n/use-translation';

const TOTAL_LABELS = new Set(LESSONS.flatMap((l) => l.labels)).size;

function statusOf(progress: LessonProgress[], lessonId: string): LessonStatus {
  return progress.find((p) => p.lessonId === lessonId)?.status ?? 'NOT_STARTED';
}

const STATUS_META: Record<LessonStatus, { labelKey: string; icon: typeof Circle; cls: string }> = {
  NOT_STARTED: {
    labelKey: 'learn.index.status.notStarted',
    icon: Circle,
    cls: 'border-line bg-canvas text-muted',
  },
  IN_PROGRESS: {
    labelKey: 'learn.index.status.inProgress',
    icon: CircleDot,
    cls: 'border-signalInk/20 bg-signalInk/10 text-signalInk',
  },
  COMPLETED: {
    labelKey: 'learn.index.status.completed',
    icon: CheckCircle2,
    cls: 'border-bridge/20 bg-bridge/10 text-bridge',
  },
};

export default function LearnPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const [lessons, setLessons] = useState<LessonProgress[]>([]);
  const [practicedLabels, setPracticedLabels] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await getProgress(authFetch);
      setLessons(data.lessons);
      setPracticedLabels(data.mastery.filter((m) => m.correctCount > 0).length);
    } catch {
      /* non-fatal */
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const completed = useMemo(
    () => LESSONS.filter((l) => statusOf(lessons, l.id) === 'COMPLETED').length,
    [lessons],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('learn.index.title')} context={t('learn.index.context')} />

      <section aria-labelledby="summary-heading" className="card mb-8 p-6">
        <h2 id="summary-heading" className="chip">
          {t('learn.index.progressHeading')}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ProgressBar
            label={t('learn.index.lessonsCompleted')}
            value={completed}
            max={LESSONS.length}
          />
          <ProgressBar
            label={t('learn.index.signsPracticed')}
            value={practicedLabels}
            max={TOTAL_LABELS}
          />
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson) => {
          const status = statusOf(lessons, lesson.id);
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <li key={lesson.id} className="card group p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="icon-tile h-11 w-11 shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-muted">{lesson.description}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {t(meta.labelKey)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/learn/${lesson.id}`}
                  className="btn-primary inline-flex min-h-11 items-center gap-2 text-sm"
                >
                  <GraduationCap aria-hidden="true" className="h-4 w-4" />
                  {t('learn.index.learn')}
                </Link>
                <Link
                  href={`/learn/practice?lesson=${lesson.id}`}
                  className="btn-secondary inline-flex min-h-11 items-center gap-2 text-sm"
                >
                  <Dumbbell aria-hidden="true" className="h-4 w-4" />
                  {t('learn.index.practice')}
                </Link>
                <Link
                  href={`/learn/quiz?lesson=${lesson.id}`}
                  className="btn-secondary inline-flex min-h-11 items-center text-sm"
                >
                  {t('learn.index.quiz')}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-ink">
        <span>{label}</span>
        <span className="text-muted">
          {value} / {max}
        </span>
      </div>
      <div
        className="mt-1 h-3 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-aurora" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
