import { NormalizedLandmark, SquatState, SquatAnalysisFrame, RepRecord } from '../types/pose';
import { POSE_LANDMARKS, calculateAngle, isLandmarkVisible } from './math';
import { ExerciseEngine } from './exerciseEngine';
import { EXERCISE_CONFIGS } from './exerciseConfigs';

export interface SquatConfig {
  standingAngle: number;
  descentAngle: number;
  bottomAngle: number;
  minRepDurationMs: number;
  maxRepDurationMs: number;
  confidenceThreshold: number;
}

export const DEFAULT_SQUAT_CONFIG: SquatConfig = {
  standingAngle: 158,
  descentAngle: 148,
  bottomAngle: 102,
  minRepDurationMs: 700,
  maxRepDurationMs: 12000,
  confidenceThreshold: 0.5,
};

/**
 * Backward-compatible SquatStateMachine built on top of the generic ExerciseEngine.
 */
export class SquatStateMachine {
  private engine: ExerciseEngine;
  private config: SquatConfig;

  constructor(
    config: Partial<SquatConfig> = {},
    onRepCompleted?: (rep: RepRecord) => void,
    onIncomplete?: (reason: string) => void
  ) {
    this.config = { ...DEFAULT_SQUAT_CONFIG, ...config };

    // Build exercise config from overrides if provided
    const squatConfig = {
      ...EXERCISE_CONFIGS.squat,
      phases: {
        ...EXERCISE_CONFIGS.squat.phases,
        startThreshold: this.config.standingAngle,
        bottomThreshold: this.config.bottomAngle,
        lockoutThreshold: this.config.standingAngle,
        minRepDurationMs: this.config.minRepDurationMs,
        maxRepDurationMs: this.config.maxRepDurationMs,
      },
    };

    this.engine = new ExerciseEngine(
      squatConfig,
      onRepCompleted,
      onIncomplete
    );
  }

  public reset(): void {
    this.engine.reset();
  }

  public getStats() {
    return this.engine.getStats();
  }

  public update(
    landmarks: NormalizedLandmark[] | undefined | null,
    now: number = performance.now()
  ): SquatAnalysisFrame {
    const frame = this.engine.update(landmarks, now);

    // Map generic phase names to SquatState
    let squatState: SquatState = 'READY';
    if (frame.state === 'DOWN') {
      squatState = 'DESCENDING';
    } else if (frame.state === 'BOTTOM') {
      squatState = 'BOTTOM';
    } else if (frame.state === 'UP') {
      squatState = 'ASCENDING';
    }

    let leftKneeAngle: number | null = null;
    let rightKneeAngle: number | null = null;
    let torsoAngle: number | null = null;

    if (landmarks && landmarks.length >= 29) {
      const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
      const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];

      const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
      const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
      const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

      if (isLandmarkVisible(leftHip, 0.45) && isLandmarkVisible(leftKnee, 0.45) && isLandmarkVisible(leftAnkle, 0.45)) {
        leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      }
      if (isLandmarkVisible(rightHip, 0.45) && isLandmarkVisible(rightKnee, 0.45) && isLandmarkVisible(rightAnkle, 0.45)) {
        rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      }
      if (leftShoulder && leftHip) {
        const vert = { x: leftHip.x, y: leftHip.y - 0.5 };
        torsoAngle = calculateAngle(leftShoulder, leftHip, vert);
      }
    }

    return {
      state: squatState,
      kneeAngle: Math.round(frame.primaryAngle),
      leftKneeAngle: leftKneeAngle !== null ? Math.round(leftKneeAngle) : null,
      rightKneeAngle: rightKneeAngle !== null ? Math.round(rightKneeAngle) : null,
      torsoAngle: torsoAngle !== null ? Math.round(torsoAngle) : null,
      sideUsed: frame.sideUsed,
      validReps: frame.validReps,
      incompleteAttempts: frame.incompleteAttempts,
      feedback: frame.feedback,
      confidence: frame.confidence,
      isPositionedWell: frame.isPositionedWell,
      minKneeAngleInRep: Math.round(frame.minPeakAngleInRep),
    };
  }
}
