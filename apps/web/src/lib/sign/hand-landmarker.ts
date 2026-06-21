import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { HandResult } from './landmark-features';

// WASM fileset is pinned to the installed @mediapipe/tasks-vision version so the
// runtime and the loaded binaries never drift.
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

// The hand-tracking model. Served from Google's official model CDN; to run fully
// offline, download this to apps/web/public/models/mediapipe/ and point here.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let landmarkerPromise: Promise<HandLandmarker> | null = null;

/** Lazily creates a single shared HandLandmarker configured for two hands. */
export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        numHands: 2,
        runningMode: 'VIDEO',
      });
    })();
  }
  return landmarkerPromise;
}

/** Maps a raw MediaPipe result into our decoupled HandResult[] shape. */
function mapResult(result: HandLandmarkerResult): HandResult[] {
  return result.landmarks.map((landmarks, i) => {
    const handednessLabel = result.handedness[i]?.[0]?.categoryName;
    return {
      landmarks: landmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
      handedness: handednessLabel === 'Left' ? 'Left' : 'Right',
    };
  });
}

/** Runs detection on a video frame at the given timestamp (ms). */
export function detect(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestampMs: number,
): HandResult[] {
  const result = landmarker.detectForVideo(video, timestampMs);
  return mapResult(result);
}
