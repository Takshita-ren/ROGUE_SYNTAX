import { describe, it, expect, vi } from 'vitest';
import { SquatStateMachine } from '../utils/squatStateMachine';
import { NormalizedLandmark } from '../types/pose';
import { POSE_LANDMARKS } from '../utils/math';

/**
 * Helper to generate a full set of 33 synthetic landmarks with a specified knee angle.
 */
function createSyntheticLandmarks(kneeAngleDeg: number): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.95,
    presence: 0.95,
  }));

  // Torso / Shoulders
  landmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.2, visibility: 0.95 };
  landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.2, visibility: 0.95 };

  // Hips
  landmarks[POSE_LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.4, visibility: 0.95 };
  landmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.4, visibility: 0.95 };

  // Knees at (0.45, 0.65) and (0.55, 0.65)
  landmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.45, y: 0.65, visibility: 0.95 };
  landmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.55, y: 0.65, visibility: 0.95 };

  const angleRad = (kneeAngleDeg * Math.PI) / 180;
  const legLength = 0.25;

  const dy = -legLength * Math.cos(angleRad);
  const dx = legLength * Math.sin(angleRad);

  landmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.45 + dx, y: 0.65 + dy, visibility: 0.95 };
  landmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.55 + dx, y: 0.65 + dy, visibility: 0.95 };

  return landmarks;
}

/**
 * Simulates real camera frame progression between angles over time.
 */
function feedMovement(
  sm: SquatStateMachine,
  fromAngle: number,
  toAngle: number,
  startTime: number,
  endTime: number,
  steps: number = 6
) {
  let lastFrame;
  for (let i = 0; i <= steps; i++) {
    const t = startTime + ((endTime - startTime) * i) / steps;
    const angle = fromAngle + ((toAngle - fromAngle) * i) / steps;
    lastFrame = sm.update(createSyntheticLandmarks(angle), t);
  }
  return lastFrame!;
}

function completeValidRep(sm: SquatStateMachine, startMs: number = 0) {
  feedMovement(sm, 175, 175, startMs, startMs + 200);
  feedMovement(sm, 175, 130, startMs + 200, startMs + 600);
  feedMovement(sm, 130, 90, startMs + 600, startMs + 1000);
  feedMovement(sm, 90, 140, startMs + 1000, startMs + 1400);
  feedMovement(sm, 140, 175, startMs + 1400, startMs + 1900);
}

describe('Squat State Machine', () => {
  it('initializes in READY state with zero reps', () => {
    const sm = new SquatStateMachine();
    const frame = sm.update(createSyntheticLandmarks(175), 100);
    expect(frame.state).toBe('READY');
    expect(frame.validReps).toBe(0);
    expect(frame.incompleteAttempts).toBe(0);
  });

  it('completes a full valid squat cycle (READY -> DESCENDING -> BOTTOM -> ASCENDING -> READY)', () => {
    const onRepCompleted = vi.fn();
    const sm = new SquatStateMachine({}, onRepCompleted);

    completeValidRep(sm, 0);

    const stats = sm.getStats();
    expect(stats.validReps).toBe(1);
    expect(onRepCompleted).toHaveBeenCalledTimes(1);
    expect(stats.repHistory.length).toBe(1);
    expect(stats.repHistory[0].rep_number).toBe(1);
    expect(stats.repHistory[0].min_knee_angle).toBeLessThanOrEqual(102);
  });

  it('detects incomplete/shallow squats and does not increment valid reps', () => {
    const onIncomplete = vi.fn();
    const sm = new SquatStateMachine({}, undefined, onIncomplete);

    // 1. Start standing
    feedMovement(sm, 175, 175, 0, 200);

    // 2. Descend partially (down to 125 deg, failing to reach 102 deg)
    const descFrame = feedMovement(sm, 175, 125, 200, 700);
    expect(descFrame.state).toBe('DESCENDING');

    // 3. Reverse early back up to standing (175 deg)
    const finalFrame = feedMovement(sm, 125, 175, 700, 1500);

    // Should return to READY, with 0 valid reps and 1 incomplete attempt
    expect(finalFrame.state).toBe('READY');
    expect(finalFrame.validReps).toBe(0);
    expect(finalFrame.incompleteAttempts).toBe(1);
    expect(onIncomplete).toHaveBeenCalled();
  });

  it('prevents duplicate counting on continuous standing frames', () => {
    const sm = new SquatStateMachine();

    // Complete 1 rep
    completeValidRep(sm, 0);
    expect(sm.getStats().validReps).toBe(1);

    // Continue sending standing frames
    feedMovement(sm, 175, 175, 2000, 3000);

    const stats = sm.getStats();
    expect(stats.validReps).toBe(1);
  });

  it('recovers safely from tracking loss without crashing or creating false reps', () => {
    const sm = new SquatStateMachine();

    // In mid-descent
    feedMovement(sm, 175, 130, 0, 500);

    // Tracking completely lost for 3.5 seconds
    sm.update(null, 4000);

    // State should reset to READY
    const frame = feedMovement(sm, 175, 175, 4100, 4300);
    expect(frame.state).toBe('READY');
    expect(frame.validReps).toBe(0);
  });

  it('resets cleanly when reset() is called', () => {
    const sm = new SquatStateMachine();
    // Complete 1 rep
    completeValidRep(sm, 0);
    expect(sm.getStats().validReps).toBe(1);

    sm.reset();
    expect(sm.getStats().validReps).toBe(0);
    expect(sm.getStats().incompleteAttempts).toBe(0);
    expect(sm.getStats().repHistory.length).toBe(0);
  });
});
