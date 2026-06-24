/** MediaPipe 21-landmark hand connections (finger bones), for drawing. */
export const HAND_CONNECTIONS: readonly [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm base
  [0, 17],
] as const;
