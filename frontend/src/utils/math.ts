import { NormalizedLandmark } from '../types/pose';

/**
 * MediaPipe Pose Landmark Indices for reference
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Calculates the internal angle formed by three 2D points (A - B - C) where B is the vertex.
 * Uses vector dot product and explicitly clamps the cosine input to [-1, 1] before acos.
 *
 * @param a First point (e.g., Hip)
 * @param b Vertex point (e.g., Knee)
 * @param c Third point (e.g., Ankle)
 * @returns Angle in degrees [0, 180] or NaN if points are invalid
 */
export function calculateAngle(
  a: NormalizedLandmark | undefined | null,
  b: NormalizedLandmark | undefined | null,
  c: NormalizedLandmark | undefined | null
): number {
  if (!a || !b || !c) {
    return NaN;
  }

  // Check valid coordinates
  if (
    typeof a.x !== 'number' || typeof a.y !== 'number' ||
    typeof b.x !== 'number' || typeof b.y !== 'number' ||
    typeof c.x !== 'number' || typeof c.y !== 'number' ||
    isNaN(a.x) || isNaN(a.y) || isNaN(b.x) || isNaN(b.y) || isNaN(c.x) || isNaN(c.y)
  ) {
    return NaN;
  }

  // Vector BA: from B to A
  const vBAx = a.x - b.x;
  const vBAy = a.y - b.y;

  // Vector BC: from B to C
  const vBCx = c.x - b.x;
  const vBCy = c.y - b.y;

  // Magnitudes
  const magBA = Math.hypot(vBAx, vBAy);
  const magBC = Math.hypot(vBCx, vBCy);

  if (magBA === 0 || magBC === 0) {
    return 0;
  }

  // Dot product
  const dotProduct = vBAx * vBCx + vBAy * vBCy;

  // Cosine with strict clamping to [-1, 1]
  const cosine = Math.max(-1.0, Math.min(1.0, dotProduct / (magBA * magBC)));

  // Angle in radians then degrees
  const angleRad = Math.acos(cosine);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function calculateDistance(
  a: NormalizedLandmark | undefined | null,
  b: NormalizedLandmark | undefined | null
): number {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Exponential Moving Average (EMA) smoothing filter to dampen frame-to-frame jitter.
 * @param previous Previous smoothed value
 * @param current New incoming raw measurement
 * @param alpha Smoothing factor [0, 1]. Higher alpha = more responsive, lower = smoother.
 */
export function smoothValue(previous: number, current: number, alpha: number = 0.35): number {
  if (isNaN(previous) || previous === 0) return current;
  if (isNaN(current)) return previous;
  return Math.round((alpha * current + (1 - alpha) * previous) * 10) / 10;
}

/**
 * Checks if a landmark has sufficient visibility and presence confidence.
 */
export function isLandmarkVisible(
  landmark: NormalizedLandmark | undefined | null,
  minConfidence: number = 0.5
): boolean {
  if (!landmark) return false;
  const vis = landmark.visibility ?? 1.0;
  const pres = landmark.presence ?? 1.0;
  return vis >= minConfidence && pres >= minConfidence;
}
