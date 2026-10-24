import { describe, it, expect, vi } from 'vitest';
import { ExerciseEngine } from '../utils/exerciseEngine';
import { EXERCISE_CONFIGS } from '../utils/exerciseConfigs';
import { NormalizedLandmark } from '../types/pose';
import { POSE_LANDMARKS } from '../utils/math';

/**
 * Creates 33 base landmarks centered in the frame.
 */
function createBaseLandmarks(defaultVisibility: number = 0.95): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: defaultVisibility,
    presence: defaultVisibility,
  }));
}

/**
 * Generates landmarks with a specified knee angle for squat/lunge testing.
 */
function createSquatLandmarks(kneeAngleDeg: number, visibility: number = 0.95): NormalizedLandmark[] {
  const lm = createBaseLandmarks(visibility);

  lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.45, y: 0.2, visibility };
  lm[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.55, y: 0.2, visibility };
  lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.45, visibility };
  lm[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.55, y: 0.45, visibility };
  lm[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.45, y: 0.7, visibility };
  lm[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.55, y: 0.7, visibility };

  const angleRad = (kneeAngleDeg * Math.PI) / 180;
  const legLen = 0.22;
  const dy = -legLen * Math.cos(angleRad);
  const dx = legLen * Math.sin(angleRad);

  lm[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.45 + dx, y: 0.7 + dy, visibility };
  lm[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.55 + dx, y: 0.7 + dy, visibility };

  return lm;
}

/**
 * Generates landmarks with specified elbow angle for arm exercises (shoulder press, pushup, curl).
 */
function createArmLandmarks(elbowAngleDeg: number): NormalizedLandmark[] {
  const lm = createBaseLandmarks();

  // Shoulder at (0.4, 0.3)
  lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.4, y: 0.3, visibility: 0.95 };
  lm[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.6, y: 0.3, visibility: 0.95 };
  lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.4, y: 0.6, visibility: 0.95 };
  lm[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.6, y: 0.6, visibility: 0.95 };

  // Elbow at (0.4, 0.45)
  lm[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.4, y: 0.45, visibility: 0.95 };
  lm[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.6, y: 0.45, visibility: 0.95 };

  // Angle formed by shoulder(0.4, 0.3) - elbow(0.4, 0.45) - wrist
  const angleRad = (elbowAngleDeg * Math.PI) / 180;
  const forearmLen = 0.15;
  const wristX = 0.4 + forearmLen * Math.sin(angleRad);
  const wristY = 0.45 - forearmLen * Math.cos(angleRad);

  lm[POSE_LANDMARKS.LEFT_WRIST] = { x: wristX, y: wristY, visibility: 0.95 };
  lm[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.6 - (wristX - 0.4), y: wristY, visibility: 0.95 };

  return lm;
}

/**
 * Feeds a smooth series of frames into the engine between two angles.
 */
function feedEngineAngleProgression(
  engine: ExerciseEngine,
  generator: (angle: number) => NormalizedLandmark[],
  startAngle: number,
  endAngle: number,
  startTimeMs: number,
  endTimeMs: number,
  steps: number = 6
) {
  let lastFrame;
  for (let i = 0; i <= steps; i++) {
    const t = startTimeMs + ((endTimeMs - startTimeMs) * i) / steps;
    const angle = startAngle + ((endAngle - startAngle) * i) / steps;
    lastFrame = engine.update(generator(angle), t);
  }
  return lastFrame!;
}

describe('Generic ExerciseEngine', () => {
  // =========================================================================
  // 1. Squat Regression Test
  // =========================================================================
  describe('Squat Regression (Decreasing Direction)', () => {
    it('initializes in READY and counts full rep cycle correctly', () => {
      const onRep = vi.fn();
      const engine = new ExerciseEngine(EXERCISE_CONFIGS.squat, onRep);

      const initFrame = engine.update(createSquatLandmarks(175), 0);
      expect(initFrame.state).toBe('READY');
      expect(initFrame.validReps).toBe(0);

      // Standing -> Descent -> Bottom -> Ascending -> Standing lockout
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 175, 0, 100);
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 120, 100, 500);
      feedEngineAngleProgression(engine, createSquatLandmarks, 120, 95, 500, 900);
      feedEngineAngleProgression(engine, createSquatLandmarks, 95, 135, 900, 1300);
      feedEngineAngleProgression(engine, createSquatLandmarks, 135, 175, 1300, 1700);

      const stats = engine.getStats();
      expect(stats.validReps).toBe(1);
      expect(onRep).toHaveBeenCalledTimes(1);
      expect(stats.repHistory.length).toBe(1);
      expect(stats.repHistory[0].rep_number).toBe(1);
    });

    it('detects partial/shallow rep and increments incompleteAttempts without counting a valid rep', () => {
      const onIncomplete = vi.fn();
      const engine = new ExerciseEngine(EXERCISE_CONFIGS.squat, undefined, onIncomplete);

      // Stand
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 175, 0, 100);
      // Descend shallowly (only to 125 deg instead of <= 102 deg)
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 125, 100, 600);
      // Stand back up early
      feedEngineAngleProgression(engine, createSquatLandmarks, 125, 175, 600, 1300);

      const stats = engine.getStats();
      expect(stats.validReps).toBe(0);
      expect(stats.incompleteAttempts).toBe(1);
      expect(onIncomplete).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. Angle-Increasing Direction (Shoulder Press)
  // =========================================================================
  describe('Angle-Increasing Direction (Shoulder Press)', () => {
    it('executes full rep cycle with angle rising to overhead lockout', () => {
      const onRep = vi.fn();
      const engine = new ExerciseEngine(EXERCISE_CONFIGS.shoulder_press, onRep);

      // 1. Start in rack position (elbow ~80 deg, startThreshold is 90)
      feedEngineAngleProgression(engine, createArmLandmarks, 80, 80, 0, 100);
      expect(engine.getStats().validReps).toBe(0);

      // 2. Press upward: angle increases past startThreshold (80 -> 110 deg)
      feedEngineAngleProgression(engine, createArmLandmarks, 80, 110, 100, 500);

      // 3. Reach overhead extension (bottomThreshold = 155 deg in config)
      feedEngineAngleProgression(engine, createArmLandmarks, 110, 165, 500, 950);

      // 4. Lower back down toward rack position (lockoutThreshold = 95 deg)
      feedEngineAngleProgression(engine, createArmLandmarks, 165, 120, 950, 1350);
      feedEngineAngleProgression(engine, createArmLandmarks, 120, 80, 1350, 1800);

      const stats = engine.getStats();
      expect(stats.validReps).toBe(1);
      expect(onRep).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 3. Timed Hold Mode (Plank)
  // =========================================================================
  describe('Timed Hold Mode (Plank)', () => {
    function createPlankLandmarks(bodyLineDeg: number): NormalizedLandmark[] {
      const lm = createBaseLandmarks();
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.2, y: 0.6, visibility: 0.95 };
      lm[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.2, y: 0.6, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };
      lm[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };

      const alphaRad = ((180 - bodyLineDeg) * Math.PI) / 180;
      const legLen = 0.3;
      const dx = legLen * Math.cos(alphaRad);
      const dy = legLen * Math.sin(alphaRad);

      lm[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.5 + dx, y: 0.6 + dy, visibility: 0.95 };
      lm[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.5 + dx, y: 0.6 + dy, visibility: 0.95 };
      return lm;
    }

    it('accumulates hold seconds during good form and pauses on form break', () => {
      const engine = new ExerciseEngine(EXERCISE_CONFIGS.plank);

      // Feed frames at t=100 (init), t=1100 (+1s), t=2100 (+1s) with straight body line (175 deg)
      engine.update(createPlankLandmarks(175), 100);
      engine.update(createPlankLandmarks(175), 1100);
      const frame2 = engine.update(createPlankLandmarks(175), 2100);

      expect(frame2.state).toBe('HOLDING');
      expect(engine.getStats().holdSeconds).toBeGreaterThanOrEqual(1.9);

      // Now introduce severe hip sag (135 deg) at t=3100
      const breakFrame = engine.update(createPlankLandmarks(135), 3100);
      expect(breakFrame.state).toBe('FORM_BREAK');
      const holdBeforeBreak = engine.getStats().holdSeconds;

      // Advance time while still in form break (t=4100, t=5100)
      engine.update(createPlankLandmarks(135), 4100);
      engine.update(createPlankLandmarks(135), 5100);

      // Hold time should NOT accumulate during FORM_BREAK
      expect(engine.getStats().holdSeconds).toBe(holdBeforeBreak);

      // Restore good form (feed frames to allow EMA smoothing to settle)
      engine.update(createPlankLandmarks(175), 6100);
      engine.update(createPlankLandmarks(175), 6200);
      engine.update(createPlankLandmarks(175), 6300);
      const restoredFrame = engine.update(createPlankLandmarks(175), 6400);
      expect(restoredFrame.state).toBe('HOLDING');
    });
  });

  // =========================================================================
  // 4. Landmark Visibility Pause Behavior
  // =========================================================================
  describe('Visibility Pause Behavior', () => {
    it('pauses tracking and shows cue when landmark visibility drops below 0.5', () => {
      const engine = new ExerciseEngine(EXERCISE_CONFIGS.squat);

      // Good visibility
      const goodFrame = engine.update(createSquatLandmarks(175, 0.95), 100);
      expect(goodFrame.isPausedLowVisibility).toBe(false);

      // Low visibility (ankles obscured, visibility 0.2)
      const lowVisLandmarks = createSquatLandmarks(175, 0.2);
      const pausedFrame = engine.update(lowVisLandmarks, 200);

      expect(pausedFrame.isPausedLowVisibility).toBe(true);
      expect(pausedFrame.feedback[0]).toContain('Move back so your full body is visible');

      // Visibility restored
      const restoredFrame = engine.update(createSquatLandmarks(175, 0.95), 300);
      expect(restoredFrame.isPausedLowVisibility).toBe(false);
    });
  });

  // =========================================================================
  // 5. Form Checks (One for each of the 8 exercises)
  // =========================================================================
  describe('Form Checks for All 8 Exercises', () => {
    it('1. Squat: evaluates chest upright form check', () => {
      const check = EXERCISE_CONFIGS.squat.formChecks[0];
      const lm = createBaseLandmarks();

      // Excessive forward lean: shoulder (0.1, 0.4), hip (0.5, 0.6)
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.1, y: 0.4, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('warn');

      // Upright posture: shoulder (0.5, 0.2), hip (0.5, 0.5)
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.5, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('ok');
    });

    it('2. Push-up: evaluates hip sag and piked hips form checks', () => {
      const sagCheck = EXERCISE_CONFIGS.pushup.formChecks.find((c) => c.id === 'bodyline_hip_sag')!;
      expect(sagCheck.evaluate([], { bodyLineAngle: 140 })).toBe('warn');
      expect(sagCheck.evaluate([], { bodyLineAngle: 175 })).toBe('ok');

      const pikeCheck = EXERCISE_CONFIGS.pushup.formChecks.find((c) => c.id === 'bodyline_hip_pike')!;
      const lm = createBaseLandmarks();
      // Shoulders at y=0.5, ankles at y=0.5, hips piked up at y=0.25 (lower y = higher)
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.2, y: 0.5, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.8, y: 0.5, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.25, visibility: 0.95 };
      expect(pikeCheck.evaluate(lm, {})).toBe('warn');
    });

    it('3. Lunge: evaluates torso upright lean check', () => {
      const check = EXERCISE_CONFIGS.lunge.formChecks[0];
      const lm = createBaseLandmarks();

      // Excessive torso lean forward
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.2, y: 0.4, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('warn');

      // Stacked upright
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.3, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('ok');
    });

    it('4. Bicep curl: evaluates elbow swing and forward drift check', () => {
      const check = EXERCISE_CONFIGS.bicep_curl.formChecks[0];
      const lm = createBaseLandmarks();

      // Shoulder at (0.5, 0.3), Hip at (0.5, 0.6)
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.3, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.6, visibility: 0.95 };

      // Elbow flared way forward at (0.2, 0.45)
      lm[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.2, y: 0.45, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('warn');

      // Elbow pinned close to torso at (0.52, 0.45)
      lm[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.52, y: 0.45, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('ok');
    });

    it('5. Shoulder press: evaluates excessive lumbar back arch check', () => {
      const check = EXERCISE_CONFIGS.shoulder_press.formChecks[0];
      const lm = createBaseLandmarks();

      // Excessive arch: hip pushed forward relative to shoulder and knee
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.4, y: 0.2, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.55, y: 0.5, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.45, y: 0.8, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('warn');

      // Straight vertical spine
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.5, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.5, y: 0.8, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('ok');
    });

    it('6. Sit-up: evaluates neck pulling and chin tucked check', () => {
      const check = EXERCISE_CONFIGS.situp.formChecks[0];
      const lm = createBaseLandmarks();

      // Jerking head forward with neck pulling: nose(0.5, 0.5), shoulder(0.4, 0.4), hip(0.6, 0.4)
      lm[POSE_LANDMARKS.NOSE] = { x: 0.5, y: 0.5, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.4, y: 0.4, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.6, y: 0.4, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('warn');

      // Relaxed neutral neck alignment
      lm[POSE_LANDMARKS.NOSE] = { x: 0.2, y: 0.2, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.4, y: 0.4, visibility: 0.95 };
      lm[POSE_LANDMARKS.LEFT_HIP] = { x: 0.6, y: 0.6, visibility: 0.95 };
      expect(check.evaluate(lm, {})).toBe('ok');
    });

    it('7. Jumping jack: evaluates full arm reach check', () => {
      const check = EXERCISE_CONFIGS.jumping_jack.formChecks[0];
      // Half-hearted arm spread (85 deg)
      expect(check.evaluate([], { armSpreadAngle: 85 })).toBe('warn');
      // Full overhead extension (130 deg)
      expect(check.evaluate([], { armSpreadAngle: 130 })).toBe('ok');
    });

    it('8. Plank: evaluates bodyline sag and pike check', () => {
      const check = EXERCISE_CONFIGS.plank.formChecks[0];
      // Severe sag (< 152 deg)
      expect(check.evaluate([], { bodyLineAngle: 145 })).toBe('fail');
      // Mild sag (158 deg)
      expect(check.evaluate([], { bodyLineAngle: 158 })).toBe('warn');
      // Excellent plank (178 deg)
      expect(check.evaluate([], { bodyLineAngle: 178 })).toBe('ok');
    });
  });

  // =========================================================================
  // 6. Target Goal Callback
  // =========================================================================
  describe('Target Goal Callback', () => {
    it('triggers onTargetReached callback when goal reps are completed', () => {
      const onTarget = vi.fn();
      const config = {
        ...EXERCISE_CONFIGS.squat,
        defaultTargetReps: 1,
      };
      const engine = new ExerciseEngine(config, undefined, undefined, onTarget);

      // Complete 1 rep
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 175, 0, 100);
      feedEngineAngleProgression(engine, createSquatLandmarks, 175, 120, 100, 500);
      feedEngineAngleProgression(engine, createSquatLandmarks, 120, 95, 500, 900);
      feedEngineAngleProgression(engine, createSquatLandmarks, 95, 135, 900, 1300);
      feedEngineAngleProgression(engine, createSquatLandmarks, 135, 175, 1300, 1700);

      expect(engine.getStats().validReps).toBe(1);
      expect(onTarget).toHaveBeenCalledTimes(1);
    });
  });
});
