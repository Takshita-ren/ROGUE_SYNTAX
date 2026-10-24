import { describe, it, expect } from 'vitest';
import { calculateAngle, calculateDistance, smoothValue, isLandmarkVisible } from '../utils/math';
import { NormalizedLandmark } from '../types/pose';

describe('Computer Vision Math - Joint Angle Calculations', () => {
  it('calculates exact 90-degree angle for perpendicular points', () => {
    // A=(0, 1), B=(0, 0), C=(1, 0) => 90 degrees
    const a: NormalizedLandmark = { x: 0, y: 1 };
    const b: NormalizedLandmark = { x: 0, y: 0 };
    const c: NormalizedLandmark = { x: 1, y: 0 };

    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(90);
  });

  it('calculates 180-degree angle for colinear straight line points', () => {
    // A=(0, 1), B=(0, 0), C=(0, -1) => straight vertical line (180 deg)
    const a: NormalizedLandmark = { x: 0, y: 1 };
    const b: NormalizedLandmark = { x: 0, y: 0 };
    const c: NormalizedLandmark = { x: 0, y: -1 };

    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(180);
  });

  it('calculates 45-degree angle correctly', () => {
    // A=(1, 0), B=(0, 0), C=(1, 1) => 45 degrees
    const a: NormalizedLandmark = { x: 1, y: 0 };
    const b: NormalizedLandmark = { x: 0, y: 0 };
    const c: NormalizedLandmark = { x: 1, y: 1 };

    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(45);
  });

  it('handles zero magnitude safely when points coincide', () => {
    const a: NormalizedLandmark = { x: 0, y: 0 };
    const b: NormalizedLandmark = { x: 0, y: 0 };
    const c: NormalizedLandmark = { x: 1, y: 1 };

    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(0);
  });

  it('safely handles null or undefined landmarks', () => {
    expect(calculateAngle(null, null, null)).toBeNaN();
    expect(calculateAngle({ x: 1, y: 1 }, null, { x: 2, y: 2 })).toBeNaN();
  });

  it('safely clamps values to [-1, 1] to prevent NaN acos errors', () => {
    // Point coordinates that might cause floating point precision drift beyond 1.0
    const a: NormalizedLandmark = { x: 0.123456789, y: 0.987654321 };
    const b: NormalizedLandmark = { x: 0.123456789, y: 0.5 };
    const c: NormalizedLandmark = { x: 0.123456789, y: 0.987654321 };

    const angle = calculateAngle(a, b, c);
    expect(isNaN(angle)).toBe(false);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it('calculates Euclidean distance correctly', () => {
    const p1: NormalizedLandmark = { x: 0, y: 0 };
    const p2: NormalizedLandmark = { x: 3, y: 4 };
    expect(calculateDistance(p1, p2)).toBe(5);
  });

  it('dampens frame noise using Exponential Moving Average', () => {
    const prev = 170;
    const noisyNew = 150;
    const smoothed = smoothValue(prev, noisyNew, 0.4);
    // 0.4 * 150 + 0.6 * 170 = 60 + 102 = 162
    expect(smoothed).toBe(162);
  });

  it('verifies landmark visibility threshold', () => {
    expect(isLandmarkVisible({ x: 0.5, y: 0.5, visibility: 0.8 }, 0.5)).toBe(true);
    expect(isLandmarkVisible({ x: 0.5, y: 0.5, visibility: 0.2 }, 0.5)).toBe(false);
    expect(isLandmarkVisible(null, 0.5)).toBe(false);
  });
});
