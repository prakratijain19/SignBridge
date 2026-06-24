/** A single 3D point (raw MediaPipe image-frame coords, x/y/z in ~[0,1]). */
export type Landmark = [number, number, number];

export interface HandPose {
  handedness: string;
  landmarks: Landmark[]; // 21 points
}

export interface SignPose {
  hands: HandPose[]; // one or two hands in a shared coordinate frame
}

export interface PoseLibrary {
  labels: string[];
  poses: Record<string, SignPose>;
}

const POSES_URL = '/models/isl/sign_poses.json';

let loadPromise: Promise<PoseLibrary | null> | null = null;

/**
 * Loads the avatar pose library. Returns null when it hasn't been generated yet
 * (run services/ml/app/build_sign_poses.py) — callers must treat that as a
 * normal "not generated" state, never an error.
 */
async function load(): Promise<PoseLibrary | null> {
  try {
    const res = await fetch(POSES_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as PoseLibrary;
    if (!data?.poses || !Array.isArray(data.labels)) return null;
    return data;
  } catch {
    return null;
  }
}

export function loadPoseLibrary(): Promise<PoseLibrary | null> {
  if (!loadPromise) loadPromise = load();
  return loadPromise;
}

export function getPose(library: PoseLibrary | null, label: string): SignPose | null {
  return library?.poses[label] ?? null;
}
