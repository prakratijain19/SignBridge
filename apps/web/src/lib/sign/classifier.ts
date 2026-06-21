import * as tf from '@tensorflow/tfjs';
import type { IslLabel, SignPrediction } from '@signbridge/shared-types';

const MODEL_URL = '/models/isl/model.json';
const LABELS_URL = '/models/isl/labels.json';

interface LoadedClassifier {
  model: tf.LayersModel;
  labels: IslLabel[];
}

let loadPromise: Promise<LoadedClassifier | null> | null = null;

/**
 * Attempts to load the trained TF.js model and its label map. Returns null when
 * no model has been trained yet — callers must treat that as a normal state, not
 * an error, so the app runs before any model exists.
 */
async function load(): Promise<LoadedClassifier | null> {
  try {
    const labelsRes = await fetch(LABELS_URL, { cache: 'no-store' });
    if (!labelsRes.ok) return null;
    const labels = (await labelsRes.json()) as IslLabel[];
    const model = await tf.loadLayersModel(MODEL_URL);
    return { model, labels };
  } catch {
    // Model files absent or unreadable — recognition isn't available yet.
    return null;
  }
}

export function loadClassifier(): Promise<LoadedClassifier | null> {
  if (!loadPromise) loadPromise = load();
  return loadPromise;
}

/** Forces the next loadClassifier() to re-fetch (e.g. after retraining). */
export function resetClassifier(): void {
  loadPromise = null;
}

/** Runs one prediction. Returns null if no model is loaded. */
export async function predict(features: number[]): Promise<SignPrediction | null> {
  const loaded = await loadClassifier();
  if (!loaded) return null;

  const output = tf.tidy(() => {
    const input = tf.tensor2d([features]);
    return loaded.model.predict(input) as tf.Tensor;
  });
  const probs = await output.data();
  output.dispose();

  let best = 0;
  for (let i = 1; i < probs.length; i += 1) {
    if ((probs[i] ?? 0) > (probs[best] ?? 0)) best = i;
  }
  const label = loaded.labels[best];
  if (!label) return null;
  return { label, confidence: probs[best] ?? 0 };
}
