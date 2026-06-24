'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Dumbbell } from 'lucide-react';
import { LESSONS } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { SignPoseView } from '@/components/SignPoseView';
import { displayLabel } from '@/lib/sign/vocabulary';
import { updateLesson } from '@/lib/learning-api';
import { useT } from '@/lib/i18n/use-translation';

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const t = useT();
  const { authFetch } = useAuth();
  const lesson = LESSONS.find((l) => l.id === params.lessonId);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!lesson) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={t('learn.lesson.notFound')} />
        <Link href="/learn" className="text-sm font-medium text-signalInk hover:underline">
          ← {t('learn.lesson.back')}
        </Link>
      </div>
    );
  }

  async function markComplete() {
    setSaving(true);
    try {
      await updateLesson(authFetch, lesson!.id, { status: 'COMPLETED' });
      setCompleted(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('learn.lesson.back')}
      </Link>

      <PageHeader title={lesson.title} context={lesson.description} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/learn/practice?lesson=${lesson.id}`}
          className="btn-primary inline-flex min-h-11 items-center gap-2 px-6 py-3"
        >
          <Dumbbell aria-hidden="true" className="h-5 w-5" />
          {t('learn.lesson.practiceThese')}
        </Link>
        <button
          type="button"
          onClick={markComplete}
          disabled={saving || completed}
          className="btn-secondary inline-flex min-h-11 items-center gap-2 px-6 py-3 disabled:opacity-60"
        >
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-bridge" />
          {completed
            ? t('learn.lesson.completed')
            : saving
              ? t('learn.lesson.saving')
              : t('learn.lesson.markComplete')}
        </button>
      </div>

      {completed && (
        <p role="status" className="mb-4 text-sm text-bridge">
          {t('learn.lesson.markedComplete')}
        </p>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {lesson.labels.map((label) => (
          <li key={label} className="card p-4">
            <SignPoseView label={label} />
            <p className="mt-3 text-center font-display text-3xl font-semibold text-ink">
              {displayLabel(label)}
            </p>
            <p className="mt-1 text-center text-sm text-muted">{t('learn.lesson.cardHint')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
