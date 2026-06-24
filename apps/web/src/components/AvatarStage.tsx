'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { loadPoseLibrary, type PoseLibrary } from '@/lib/avatar/pose-library';
import { isLatinText, textToPoses } from '@/lib/avatar/text-to-poses';
import { useAvatarPlayback } from '@/lib/avatar/use-avatar-playback';

// 3D canvas is client-only (WebGL) — never server-rendered.
const HandAvatar = dynamic(() => import('@/lib/avatar/HandAvatar').then((m) => m.HandAvatar), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading 3D view…
    </div>
  ),
});

const SPEEDS = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 1.5, label: '1.5×' },
];

function activeLetterIndex(steps: ReturnType<typeof textToPoses>['steps'], idx: number): number {
  for (let i = Math.min(idx, steps.length - 1); i >= 0; i -= 1) {
    const li = steps[i]?.letterIndex;
    if (li !== null && li !== undefined) return li;
  }
  return -1;
}

/**
 * Renders the fingerspelling avatar for a piece of text: the 3D hand, playback
 * controls, and a text caption with the current letter highlighted. The caption
 * is the accessible source of truth — the 3D view is never relied on alone.
 *
 * NOTE: this fingerspells letter by letter (only alphabet/number poses exist).
 */
export function AvatarStage({ text, autoPlay = false }: { text: string; autoPlay?: boolean }) {
  const { settings } = useSettings();
  const [library, setLibrary] = useState<PoseLibrary | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void loadPoseLibrary().then((lib) => {
      if (!cancelled) setLibrary(lib);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableLabels = useMemo(() => new Set(library?.labels ?? []), [library]);
  const latin = isLatinText(text);
  const sequence = useMemo(
    () => textToPoses(latin ? text : '', availableLabels),
    [text, latin, availableLabels],
  );

  const playback = useAvatarPlayback({
    sequence,
    library: library ?? null,
    reduceMotion: settings.reduceMotion,
  });

  const { play, replay } = playback;
  // Auto-play when the text changes (e.g. a new live turn), once poses are ready.
  useEffect(() => {
    if (autoPlay && library && latin && sequence.steps.length > 0) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, library]);

  if (library === undefined) {
    return <p className="text-muted">Loading avatar…</p>;
  }

  if (library === null) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-start gap-2">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-signalInk" />
          <div>
            <p className="font-medium text-ink">Avatar poses not generated yet</p>
            <p className="mt-1 text-sm text-muted">
              The 3D fingerspelling avatar needs a pose library built from the sign dataset. Run the
              generator script (<code className="rounded bg-canvas px-1">build_sign_poses.py</code>)
              to create it, then reload.
            </p>
            <Link
              href="/sign/collect"
              className="mt-2 inline-block text-sm font-medium text-signalInk hover:underline"
            >
              About the sign dataset →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const highlight = activeLetterIndex(sequence.steps, playback.currentIndex);
  const currentChar = highlight >= 0 ? sequence.letters[highlight] : '';

  return (
    <div>
      {text && !latin && (
        <p role="status" className="mb-3 flex items-start gap-2 text-sm text-ink">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-signalInk" />
          Fingerspelling uses the English alphabet, so Hindi/Gujarati text isn’t spelled here.
          (Transliteration is planned for a later phase.)
        </p>
      )}

      <div className="aspect-video w-full overflow-hidden rounded-xl border border-line bg-canvas">
        <HandAvatar pose={playback.pose} />
      </div>

      {/* Accessible caption — the source of truth for what's being spelled. */}
      <div className="mt-4">
        <p className="sr-only" aria-live="polite">
          {currentChar ? `Letter ${currentChar}` : ''}
        </p>
        {sequence.letters.length > 0 ? (
          <p
            className="flex flex-wrap gap-1 text-2xl font-semibold tracking-wide"
            aria-hidden="true"
          >
            {sequence.letters.map((ch, i) => (
              <span
                key={i}
                className={`rounded px-1 ${
                  i === highlight ? 'bg-signal text-surface' : 'text-ink'
                }`}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-muted">
            {latin ? 'Enter text to fingerspell.' : 'Enter English letters or numbers to spell.'}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (playback.playing ? playback.pause() : play())}
          disabled={sequence.steps.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-5 py-2.5 font-medium text-canvas transition hover:bg-ink/90 disabled:opacity-60"
        >
          {playback.playing ? (
            <Pause aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Play aria-hidden="true" className="h-5 w-5" />
          )}
          {playback.playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={replay}
          disabled={sequence.steps.length === 0}
          aria-label="Replay"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-60"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Replay
        </button>
        <label htmlFor="avatar-speed" className="flex items-center gap-2 text-sm text-ink">
          Speed
          <select
            id="avatar-speed"
            value={playback.speed}
            onChange={(e) => playback.setSpeed(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-line bg-surface px-2 text-ink"
          >
            {SPEEDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
