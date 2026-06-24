'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { HAND_CONNECTIONS } from './hand-topology';
import type { SignPose } from './pose-library';

type Vec3 = [number, number, number];

const SKIN = '#e7a980';
const UP = new THREE.Vector3(0, 1, 0);

const PALM = new Set([0, 5, 9, 13, 17]);
const TIPS = new Set([4, 8, 12, 16, 20]);
// Extra palm-fill links (not finger bones) to give the palm a solid volume.
const PALM_FILL: [number, number][] = [
  [0, 9],
  [0, 13],
  [5, 13],
  [9, 17],
];

function jointRadius(i: number): number {
  if (i === 0) return 0.22; // wrist / heel of palm
  if (PALM.has(i)) return 0.15; // knuckles
  if (TIPS.has(i)) return 0.095; // fingertips
  if (i === 1 || i === 2) return 0.15; // thumb base
  return 0.115;
}

function boneRadius(a: number, b: number): number {
  if ((PALM.has(a) && PALM.has(b)) || a === 0 || b === 0) return 0.18; // palm mass
  if (TIPS.has(b) || TIPS.has(a)) return 0.095; // toward fingertips
  return 0.12; // finger shafts
}

/**
 * Centers and scales the WHOLE pose (all hands together) so two-handed signs
 * keep correct relative placement. MediaPipe image-y grows downward, so y is
 * flipped for an upright view.
 */
function toScenePoints(pose: SignPose): Vec3[][] {
  const all = pose.hands.flatMap((h) => h.landmarks);
  if (all.length === 0) return [];

  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const [x, y, z] of all) {
    cx += x;
    cy += y;
    cz += z;
  }
  const n = all.length;
  cx /= n;
  cy /= n;
  cz /= n;

  let maxR = 1e-6;
  for (const [x, y, z] of all) {
    maxR = Math.max(maxR, Math.hypot(x - cx, y - cy, z - cz));
  }
  const scale = 1.3 / maxR;

  return pose.hands.map((hand) =>
    hand.landmarks.map(
      ([x, y, z]) => [(x - cx) * scale, -(y - cy) * scale, -(z - cz) * scale] as Vec3,
    ),
  );
}

/**
 * A bone rendered as a rounded capsule. Capsule caps extend past each joint, so
 * adjacent capsules + the joint spheres overlap into one smooth, solid-looking
 * hand (a soft "clay" look) rather than a stick figure.
 */
function Bone({ start, end, radius }: { start: Vec3; end: Vec3; radius: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(e, s);
    const len = dir.length() || 1e-6;
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    return { position: mid, quaternion: q, length: len };
  }, [start, end]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <capsuleGeometry args={[radius, length, 8, 20]} />
      <meshStandardMaterial color={SKIN} roughness={0.9} metalness={0} />
    </mesh>
  );
}

function HandMesh({ points }: { points: Vec3[] }) {
  const bones = useMemo(() => {
    const list: { a: number; b: number; r: number }[] = [];
    for (const [a, b] of HAND_CONNECTIONS) list.push({ a, b, r: boneRadius(a, b) });
    for (const [a, b] of PALM_FILL) list.push({ a, b, r: 0.18 });
    return list;
  }, []);

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={`j${i}`} position={p} castShadow receiveShadow>
          <sphereGeometry args={[jointRadius(i), 28, 28]} />
          <meshStandardMaterial color={SKIN} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {bones.map(({ a, b, r }, ci) => {
        const pa = points[a];
        const pb = points[b];
        if (!pa || !pb) return null;
        return <Bone key={`b${ci}`} start={pa} end={pb} radius={r} />;
      })}
    </group>
  );
}

export function HandAvatar({ pose }: { pose: SignPose | null }) {
  const hands = pose ? toScenePoints(pose) : [];

  return (
    <Canvas shadows camera={{ position: [0, 0.2, 4.4], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#3a3a3e']} />
      {/* Soft studio lighting for a clay-like, non-glossy finish. */}
      <hemisphereLight args={['#ffffff', '#9a9aa2', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 6, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <directionalLight position={[0, -3, 2]} intensity={0.25} />

      {hands.map((points, hi) => (
        <HandMesh key={hi} points={points} />
      ))}

      <ContactShadows position={[0, -1.9, 0]} opacity={0.5} scale={10} blur={2.6} far={4.5} />
      <OrbitControls makeDefault enablePan={false} autoRotate={false} enableZoom />
    </Canvas>
  );
}
