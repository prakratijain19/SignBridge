import { SIGN_FEATURE_LENGTH } from '@signbridge/shared-types';

/**
 * A single detected hand, decoupled from the MediaPipe result shape so the rest
 * of the app depends only on this small type.
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

/**
 * Normalizes one hand to a translation- and scale-invariant vector of 42 values:
 * points are re-centred on the wrist and scaled by the wrist→middle-MCP distance,
 * so the model generalizes across hand position and distance from the camera.
 * Only x and y are used — MediaPipe's z is too noisy to help.
 */
function normalizeHand(landmarks: HandResult['landmarks']): number[] {
  const wrist = landmarks[WRIST];
  const mcp = landmarks[MIDDLE_MCP];
  if (!wrist || !mcp) return new Array(VALUES_PER_HAND).fill(0);

  const refLen = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y) || 1e-6;
  const out: number[] = [];
  for (let i = 0; i < 21; i += 1) {
    const lm = landmarks[i];
    if (!lm) {
      out.push(0, 0);
    } else {
      out.push((lm.x - wrist.x) / refLen, (lm.y - wrist.y) / refLen);
    }
  }
  return out;
}

/**
 * Orders detected hands into two fixed slots [slot0, slot1] so the feature
 * layout is deterministic. Prefers Left→slot0, Right→slot1; when handedness
 * collides (mirrored webcams sometimes report two of the same), falls back to
 * left-to-right by wrist x so collection and inference still agree.
 */
function orderHands(hands: HandResult[]): [HandResult | undefined, HandResult | undefined] {
  if (hands.length === 0) return [undefined, undefined];
  if (hands.length === 1) {
    const [h] = hands;
    return h!.handedness === 'Left' ? [h, undefined] : [undefined, h];
  }
  const sorted = [...hands].sort((a, b) => {
    if (a.handedness !== b.handedness) return a.handedness === 'Left' ? -1 : 1;
    return (a.landmarks[WRIST]?.x ?? 0) - (b.landmarks[WRIST]?.x ?? 0);
  });
  return [sorted[0], sorted[1]];
}

export interface ExtractedFeatures {
  features: number[]; // length FEATURE_LENGTH (86)
  handCount: number; // 0, 1, or 2
}

/**
 * Builds the fixed-length feature vector for a frame. Each of the two hand slots
 * contributes a presence flag (1/0) followed by 42 normalized values; absent
 * hands are zero-filled.
 *
 * // Phase 5b: temporal/sequence model — dynamic (motion) signs need a sequence
 * // of these frames fed to an RNN/Transformer rather than a single static frame.
 */
export function extractFeatures(hands: HandResult[]): ExtractedFeatures {
  const slots = orderHands(hands);
  const features: number[] = [];
  for (const hand of slots) {
    if (hand && hand.landmarks.length >= 21) {
      features.push(1, ...normalizeHand(hand.landmarks));
    } else {
      features.push(0, ...new Array(VALUES_PER_HAND).fill(0));
    }
  }
  return { features, handCount: Math.min(hands.length, 2) };
}
