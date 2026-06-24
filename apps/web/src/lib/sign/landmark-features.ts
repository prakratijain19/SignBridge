import { SIGN_FEATURE_LENGTH } from '@signbridge/shared-types';

/**
 * A single detected hand, decoupled from the MediaPipe result shape so the rest
 * of the app depends only on this small type. (handedness is carried for
 * potential display use, but is intentionally NOT used for feature ordering —
 * see the canonical convention below.)
 */
export interface HandResult {
  /** 21 image-normalized landmarks, MediaPipe order. */
  landmarks: { x: number; y: number; z: number }[];
  handedness: 'Left' | 'Right';
}

/** Feature vector length, re-exported from shared-types as the single source. */
export const FEATURE_LENGTH = SIGN_FEATURE_LENGTH; // 86

const VALUES_PER_HAND = 42; // 21 landmarks × (x, y)
const WRIST = 0;
const MIDDLE_MCP = 9;
const MIN_REF_LENGTH = 1e-6;

// ───────────────────────────────────────────────────────────────────────────
// CANONICAL 86-DIM FEATURE CONVENTION
//
// This MUST stay byte-for-byte identical to the Python processor in
// services/ml/app/build_dataset_from_images.py, or a model trained offline will
// not work live. Per hand (using only x, y; ignoring noisy z):
//   1. translate so the wrist (landmark 0) is the origin,
//   2. scale by the wrist→middle-MCP (landmark 9) distance in the ORIGINAL
//      normalized coords; if that length is ~0 the hand is unusable,
//   3. keep the 21 (x, y) pairs → 42 values.
// Two-hand assembly (86): order slots by ASCENDING MEAN X (leftmost hand first);
// do NOT use MediaPipe handedness (avoids camera-mirroring train/infer mismatch).
// Layout: [slot0_present, slot0×42, slot1_present, slot1×42]; absent = 0 + zeros.
// Frames/images fed to MediaPipe must be un-mirrored (mirror only the preview).
// ───────────────────────────────────────────────────────────────────────────

/** Returns 42 normalized values, or null if the hand isn't usable. */
function normalizeHand(landmarks: HandResult['landmarks']): number[] | null {
  const wrist = landmarks[WRIST];
  const mcp = landmarks[MIDDLE_MCP];
  if (!wrist || !mcp) return null;

  const refLen = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
  if (refLen < MIN_REF_LENGTH) return null;

  const out: number[] = [];
  for (let i = 0; i < 21; i += 1) {
    const lm = landmarks[i];
    if (!lm) return null;
    out.push((lm.x - wrist.x) / refLen, (lm.y - wrist.y) / refLen);
  }
  return out;
}

/** Mean x over the 21 landmarks, used purely for left-to-right slot ordering. */
function meanX(landmarks: HandResult['landmarks']): number {
  let sum = 0;
  for (let i = 0; i < 21; i += 1) sum += landmarks[i]?.x ?? 0;
  return sum / 21;
}

export interface ExtractedFeatures {
  features: number[]; // length FEATURE_LENGTH (86)
  handCount: number; // 0, 1, or 2 usable hands
}

/**
 * Builds the fixed-length feature vector for a frame following the canonical
 * convention above.
 *
 * // Phase 5b: temporal/sequence model — dynamic (motion) signs need a sequence
 * // of these frames fed to an RNN/Transformer rather than a single static frame.
 */
export function extractFeatures(hands: HandResult[]): ExtractedFeatures {
  const usable = hands
    .filter((h) => h.landmarks.length >= 21)
    .map((h) => ({ meanX: meanX(h.landmarks), norm: normalizeHand(h.landmarks) }))
    .filter((h): h is { meanX: number; norm: number[] } => h.norm !== null)
    .sort((a, b) => a.meanX - b.meanX)
    .slice(0, 2);

  const features: number[] = [];
  for (let slot = 0; slot < 2; slot += 1) {
    const hand = usable[slot];
    if (hand) {
      features.push(1, ...hand.norm);
    } else {
      features.push(0, ...new Array(VALUES_PER_HAND).fill(0));
    }
  }
  return { features, handCount: usable.length };
}
