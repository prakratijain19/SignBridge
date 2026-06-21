'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { IslLabel, SignPrediction } from '@signbridge/shared-types';
import { detect, getHandLandmarker } from './hand-landmarker';
import { extractFeatures, type HandResult } from './landmark-features';
import { loadClassifier, predict } from './classifier';

const DEFAULT_CONFIDENCE = 0.85;
const DEFAULT_WINDOW = 10;
const FRAME_INTERVAL_MS = 100; // ~10 fps

interface Options {
  videoRef: RefObject<HTMLVideoElement>;
  /** Called once each time a new stable sign is recognized. */
  onStableSign?: (label: IslLabel) => void;
  /** Called every processed frame with the detected hands (for overlay drawing). */
  onFrame?: (hands: HandResult[]) => void;
  confidenceThreshold?: number;
  windowSize?: number;
}

export interface UseSignRecognition {
  ready: boolean;
  running: boolean;
  start: () => void;
  stop: () => void;
  currentPrediction: SignPrediction | null;
  stableLabel: IslLabel | null;
  supported: boolean;
  modelLoaded: boolean;
  /** True once the initial model-presence check has completed. */
  modelChecked: boolean;
  error: string | null;
}

export function useSignRecognition({
  videoRef,
  onStableSign,
  onFrame,
  confidenceThreshold = DEFAULT_CONFIDENCE,
  windowSize = DEFAULT_WINDOW,
}: Options): UseSignRecognition {
  const supported = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function',
    [],
  );

  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [stableLabel, setStableLabel] = useState<IslLabel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const windowRef = useRef<(IslLabel | null)[]>([]);
  const lastEmittedRef = useRef<IslLabel | null>(null);
  const modelLoadedRef = useRef(false);
  const runningRef = useRef(false);

  // Keep the latest callbacks without re-creating the loop.
  const onStableRef = useRef(onStableSign);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onStableRef.current = onStableSign;
  }, [onStableSign]);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // Check for a trained model up front so the page can show the right state
  // without starting the camera.
  useEffect(() => {
    let cancelled = false;
    void loadClassifier().then((loaded) => {
      if (!cancelled) {
        modelLoadedRef.current = Boolean(loaded);
        setModelLoaded(Boolean(loaded));
        setModelChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const evaluateStable = useCallback(() => {
    const counts = new Map<IslLabel, number>();
    let nonNull = 0;
    for (const item of windowRef.current) {
      if (item) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
        nonNull += 1;
      }
    }

    let topLabel: IslLabel | null = null;
    let topCount = 0;
    for (const [label, count] of counts) {
      if (count > topCount) {
        topLabel = label;
        topCount = count;
      }
    }

    const majorityNeeded = Math.ceil(windowSize * 0.6);
    if (topLabel && topCount >= majorityNeeded) {
      if (lastEmittedRef.current !== topLabel) {
        lastEmittedRef.current = topLabel;
        setStableLabel(topLabel);
        onStableRef.current?.(topLabel);
      }
    } else if (nonNull === 0) {
      // Hands gone — allow the same sign to be emitted again next time.
      lastEmittedRef.current = null;
    }
  }, [windowSize]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    windowRef.current = [];
    lastEmittedRef.current = null;
  }, [videoRef]);

  const start = useCallback(() => {
    if (!supported) {
      setError('not-supported');
      return;
    }
    setError(null);

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        const landmarker = await getHandLandmarker();
        const loaded = await loadClassifier();
        modelLoadedRef.current = Boolean(loaded);
        setModelLoaded(Boolean(loaded));

        setReady(true);
        runningRef.current = true;
        setRunning(true);

        intervalRef.current = setInterval(() => {
          if (!runningRef.current || processingRef.current) return;
          processingRef.current = true;
          void (async () => {
            try {
              const el = videoRef.current;
              if (!el || el.readyState < 2) return;
              const hands = detect(landmarker, el, performance.now());
              onFrameRef.current?.(hands);

              const { features, handCount } = extractFeatures(hands);
              if (handCount === 0) {
                setCurrentPrediction(null);
                windowRef.current.push(null);
              } else if (modelLoadedRef.current) {
                const pred = await predict(features);
                setCurrentPrediction(pred);
                windowRef.current.push(
                  pred && pred.confidence >= confidenceThreshold ? pred.label : null,
                );
              } else {
                windowRef.current.push(null);
              }

              if (windowRef.current.length > windowSize) windowRef.current.shift();
              evaluateStable();
            } finally {
              processingRef.current = false;
            }
          })();
        }, FRAME_INTERVAL_MS);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('camera-denied');
        } else if (name === 'NotFoundError') {
          setError('no-camera');
        } else {
          setError('init-failed');
        }
        stop();
      }
    })();
  }, [supported, videoRef, confidenceThreshold, windowSize, evaluateStable, stop]);

  // Clean up on unmount.
  useEffect(() => stop, [stop]);

  return {
    ready,
    running,
    start,
    stop,
    currentPrediction,
    stableLabel,
    supported,
    modelLoaded,
    modelChecked,
    error,
  };
}
