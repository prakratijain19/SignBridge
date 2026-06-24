import * as tf from '@tensorflow/tfjs';
import type { IslLabel, SignPrediction } from '@signbridge/shared-types';

const WEIGHTS_URL = '/models/isl/weights.json';
const LABELS_URL = '/models/isl/labels.json';

/** Activations the trainer can emit; matches Keras serialization. */
type Activation = 'relu' | 'softmax' | 'sigmoid' | 'tanh' | 'linear';

interface ExportedLayer {
  units: number;
  activation: Activation;
  W: number[][]; // [inputDim, units]
  b: number[]; // [units]
}

interface ExportedModel {
  featureLength: number;
  labels: string[];
  layers: ExportedLayer[];
}

// The recognizer's labels come entirely from the trained model's labels.json —
// they are independent of ISL_VOCABULARY. A model trained from a dataset of
// letters/words/numbers works without any code change; the UI formats whatever
// labels it carries via displayLabel().
interface LoadedClassifier {
  model: tf.LayersModel;
  labels: IslLabel[];
}

let loadPromise: Promise<LoadedClassifier | null> | null = null;

/**
 * Rebuilds the MLP in TF.js from the exported weights JSON. We avoid the Python
 * `tensorflowjs` converter (no Windows support) by exporting plain weight arrays
 * and reconstructing the identical Dense stack here, then calling setWeights().
 */
function buildModel(exported: ExportedModel): tf.LayersModel {
  const model = tf.sequential();
  exported.layers.forEach((layer, i) => {
    model.add(
      tf.layers.dense({
        units: layer.units,
        activation: layer.activation,
        ...(i === 0 ? { inputShape: [exported.featureLength] } : {}),
      }),
    );
  });

  // setWeights expects [W1, b1, W2, b2, ...] in layer order.
  const weights: tf.Tensor[] = [];
  for (const layer of exported.layers) {
    weights.push(tf.tensor2d(layer.W), tf.tensor1d(layer.b));
  }
  model.setWeights(weights);
  return model;
}

async function load(): Promise<LoadedClassifier | null> {
  try {
    const [weightsRes, labelsRes] = await Promise.all([
      fetch(WEIGHTS_URL, { cache: 'no-store' }),
      fetch(LABELS_URL, { cache: 'no-store' }),
    ]);
    if (!weightsRes.ok || !labelsRes.ok) return null;

    const exported = (await weightsRes.json()) as ExportedModel;
    const labels = (await labelsRes.json()) as IslLabel[];
    if (!exported.layers?.length) return null;

    return { model: buildModel(exported), labels };
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
