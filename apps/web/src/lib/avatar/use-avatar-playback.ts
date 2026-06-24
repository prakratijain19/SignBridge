'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPose, type PoseLibrary, type SignPose } from './pose-library';
import type { PoseSequence } from './text-to-poses';

const DEFAULT_DWELL_MS = 700;
const TRANSITION_MS = 300;
const PAUSE_MS = 260;

interface Options {
  sequence: PoseSequence;
  library: PoseLibrary | null;
  reduceMotion: boolean;
  dwellMs?: number;
}

export interface AvatarPlayback {
  play: () => void;
  pause: () => void;
  replay: () => void;
  playing: boolean;
  currentIndex: number; // index into sequence.steps
  speed: number;
  setSpeed: (speed: number) => void;
  pose: SignPose | null; // current (interpolated) pose to render
}

/** Linearly interpolates two poses; snaps when their structure differs. */
function lerpPose(a: SignPose | null, b: SignPose | null, t: number): SignPose | null {
  if (!a || !b) return b ?? a;
  if (a.hands.length !== b.hands.length) return b;
  const hands = b.hands.map((bh, h) => {
    const ah = a.hands[h];
    if (!ah || ah.landmarks.length !== bh.landmarks.length) return bh;
    return {
      handedness: bh.handedness,
      landmarks: bh.landmarks.map((bp, i) => {
        const ap = ah.landmarks[i] ?? bp;
        return [
          ap[0] + (bp[0] - ap[0]) * t,
          ap[1] + (bp[1] - ap[1]) * t,
          ap[2] + (bp[2] - ap[2]) * t,
        ] as [number, number, number];
      }),
    };
  });
  return { hands };
}

export function useAvatarPlayback({
  sequence,
  library,
  reduceMotion,
  dwellMs = DEFAULT_DWELL_MS,
}: Options): AvatarPlayback {
  const [pose, setPose] = useState<SignPose | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);

  const seqRef = useRef(sequence);
  const libRef = useRef(library);
  const reduceRef = useRef(reduceMotion);
  const speedRef = useRef(1);
  const dwellRef = useRef(dwellMs);
  seqRef.current = sequence;
  libRef.current = library;
  reduceRef.current = reduceMotion;
  dwellRef.current = dwellMs;

  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const idxRef = useRef(0);
  const fromRef = useRef<SignPose | null>(null);
  const phaseStartRef = useRef<number | null>(null);

  const stepPose = useCallback((index: number): SignPose | null => {
    const step = seqRef.current.steps[index];
    if (!step || step.kind !== 'letter' || !step.label) return null;
    return getPose(libRef.current, step.label);
  }, []);

  const stop = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const frame = useCallback(
    (ts: number) => {
      if (!playingRef.current) return;
      const steps = seqRef.current.steps;
      const idx = idxRef.current;
      const step = steps[idx];
      if (!step) {
        stop();
        return;
      }

      if (phaseStartRef.current === null) phaseStartRef.current = ts;
      const elapsed = ts - phaseStartRef.current;
      const speedMul = speedRef.current || 1;
      const animDur = reduceRef.current ? 0 : TRANSITION_MS / speedMul;
      const holdDur = (step.kind === 'pause' ? PAUSE_MS : dwellRef.current) / speedMul;

      const target = stepPose(idx);
      if (target) {
        setPose(elapsed < animDur ? lerpPose(fromRef.current, target, elapsed / animDur) : target);
      }
      // For pause / unknown-letter steps we simply hold the current pose.

      if (elapsed >= animDur + holdDur) {
        if (target) fromRef.current = target;
        const next = idx + 1;
        if (next >= steps.length) {
          stop();
          return;
        }
        idxRef.current = next;
        setCurrentIndex(next);
        phaseStartRef.current = ts;
      }

      rafRef.current = requestAnimationFrame(frame);
    },
    [stepPose, stop],
  );

  const play = useCallback(() => {
    if (seqRef.current.steps.length === 0) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    idxRef.current = 0;
    phaseStartRef.current = null;
    fromRef.current = stepPose(0);
    setPose(stepPose(0));
    setCurrentIndex(0);
    playingRef.current = true;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(frame);
  }, [frame, stepPose]);

  const pause = useCallback(() => stop(), [stop]);
  const replay = useCallback(() => play(), [play]);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // Stop playback if the sequence changes or on unmount.
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { play, pause, replay, playing, currentIndex, speed, setSpeed, pose };
}
