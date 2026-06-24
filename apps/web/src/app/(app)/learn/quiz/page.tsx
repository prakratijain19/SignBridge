'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { LESSONS } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { SignPoseView } from '@/components/SignPoseView';
import { displayLabel } from '@/lib/sign/vocabulary';
import { updateLesson } from '@/lib/learning-api';
import { useT } from '@/lib/i18n/use-translation';

const ALL_LABELS = [...new Set(LESSONS.flatMap((l) => l.labels))];
const PASS_PERCENT = 60;
const MAX_QUESTIONS = 8;

interface Question {
  target: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function buildQuiz(labels: string[]): Question[] {
  const targets = shuffle(labels).slice(0, Math.min(MAX_QUESTIONS, labels.length));
  return targets.map((target) => {
    const distractors = shuffle(ALL_LABELS.filter((l) => l !== target)).slice(0, 3);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

function QuizInner() {
  const t = useT();
  const { authFetch } = useAuth();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lesson');
  const lesson = useMemo(
    () => (lessonId ? LESSONS.find((l) => l.id === lessonId) : undefined),
    [lessonId],
  );
  const labels = lesson ? lesson.labels : ALL_LABELS;

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const savedRef = useRef(false);

  // Build the quiz on the client (uses Math.random) to avoid hydration mismatch.
  useEffect(() => {
    setQuestions(buildQuiz(labels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const pct = questions && questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // Persist the result once the quiz is finished.
  useEffect(() => {
    if (!finished || savedRef.current || !lesson) return;
    savedRef.current = true;
    void updateLesson(authFetch, lesson.id, {
      status: pct >= PASS_PERCENT ? 'COMPLETED' : 'IN_PROGRESS',
      score: pct,
    }).catch(() => {});
  }, [finished, lesson, pct, authFetch]);

  function choose(option: string) {
    if (selected !== null || !questions) return;
    setSelected(option);
    if (option === questions[qIndex]!.target) setScore((s) => s + 1);
  }

  function next() {
    if (!questions) return;
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  return (
    <div className="animate-fade-up">
      <Link
        href="/learn"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-signalInk hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t('learn.quiz.back')}
      </Link>

      <PageHeader
        title={t('learn.quiz.title')}
        context={
          lesson
            ? t('learn.quiz.contextLesson', { lesson: lesson.title })
            : t('learn.quiz.contextAll')
        }
      />

      {!questions ? (
        <p className="text-muted">{t('learn.quiz.preparing')}</p>
      ) : finished ? (
        <div className="card p-8 text-center">
          <p className="font-display text-3xl font-bold text-gradient sm:text-4xl">
            {t('learn.quiz.scored', { score, total: questions.length, pct })}
          </p>
          <p className="mt-2 text-sm text-muted">
            {pct >= PASS_PERCENT ? t('learn.quiz.passed') : t('learn.quiz.failed')}
          </p>
          <Link
            href="/learn"
            className="btn-primary mt-5 inline-flex min-h-11 items-center px-6 py-3"
          >
            {t('learn.quiz.backToLearn')}
          </Link>
        </div>
      ) : (
        <QuizCard
          question={questions[qIndex]!}
          index={qIndex}
          total={questions.length}
          selected={selected}
          onChoose={choose}
          onNext={next}
        />
      )}
    </div>
  );
}

function QuizCard({
  question,
  index,
  total,
  selected,
  onChoose,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  selected: string | null;
  onChoose: (option: string) => void;
  onNext: () => void;
}) {
  const t = useT();
  const answered = selected !== null;
  const correct = selected === question.target;

  return (
    <div className="card p-6">
      <p className="chip">{t('learn.quiz.progress', { index: index + 1, total })}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">
        {t('learn.quiz.whichSign')}
      </p>

      <div className="mx-auto mt-4 max-w-xs">
        <SignPoseView label={question.target} />
      </div>

      <div
        className="mt-5 grid grid-cols-2 gap-3"
        role="group"
        aria-label={t('learn.quiz.answerOptions')}
      >
        {question.options.map((option) => {
          const isCorrect = option === question.target;
          const isChosen = option === selected;
          let cls = 'border-line bg-surface text-ink hover:border-iris/40 hover:bg-aurora-soft';
          if (answered && isCorrect) cls = 'border-bridge bg-bridge/10 text-ink';
          else if (answered && isChosen) cls = 'border-beacon bg-beacon/10 text-ink';
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChoose(option)}
              disabled={answered}
              className={`flex min-h-14 items-center justify-center rounded-xl border-2 text-2xl font-semibold transition-all duration-200 disabled:cursor-default ${cls}`}
            >
              {displayLabel(option)}
              {answered && isCorrect && (
                <CheckCircle2 aria-hidden="true" className="ml-2 h-5 w-5 text-bridge" />
              )}
              {answered && isChosen && !isCorrect && (
                <XCircle aria-hidden="true" className="ml-2 h-5 w-5 text-beacon" />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4">
          <p aria-live="assertive" className="flex items-center gap-2 font-semibold">
            {correct ? (
              <span className="flex items-center gap-2 text-bridge">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> {t('learn.quiz.correct')}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-ink">
                <XCircle aria-hidden="true" className="h-5 w-5 text-beacon" />{' '}
                {t('learn.quiz.notQuite', { label: displayLabel(question.target) })}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="btn-primary mt-3 inline-flex min-h-11 items-center px-6 py-3"
          >
            {index < total - 1 ? t('learn.quiz.nextQuestion') : t('learn.quiz.seeResults')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  const t = useT();
  return (
    <Suspense fallback={<p className="text-muted">{t('learn.quiz.loading')}</p>}>
      <QuizInner />
    </Suspense>
  );
}
