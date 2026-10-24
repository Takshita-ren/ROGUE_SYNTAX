import {
  ExerciseConfig,
  ExerciseAnalysisFrame,
  NormalizedLandmark,
  RepRecord,
  AngleSide,
} from '../types/pose';
import {
  calculateAngle,
  isLandmarkVisible,
  smoothValue,
  POSE_LANDMARKS,
} from './math';

export class ExerciseEngine {
  private config: ExerciseConfig;
  private state: string = 'READY';
  private validReps: number = 0;
  private incompleteAttempts: number = 0;
  private holdSeconds: number = 0;

  // Smoothed angles keyed by angle name
  private smoothedAngles: Record<string, number> = {};
  private minPeakAngleInCurrentRep: number = 0;
  private repStartTime: number = 0;
  private lastFrameTime: number = 0;
  private lastTrackingTime: number = 0;

  // Rep history & feedback logging
  private repHistory: RepRecord[] = [];
  private feedbackHistory: Map<string, number> = new Map();
  private activeFeedback: string = '';
  private lastFeedbackChangeTime: number = 0;
  private currentRepFeedback: Set<string> = new Set();

  // Callbacks
  private onRepCompletedCallback?: (rep: RepRecord) => void;
  private onIncompleteCallback?: (reason: string) => void;
  private onTargetReachedCallback?: () => void;
  private targetReachedFired: boolean = false;

  constructor(
    config: ExerciseConfig,
    onRepCompleted?: (rep: RepRecord) => void,
    onIncomplete?: (reason: string) => void,
    onTargetReached?: () => void
  ) {
    this.config = config;
    this.onRepCompletedCallback = onRepCompleted;
    this.onIncompleteCallback = onIncomplete;
    this.onTargetReachedCallback = onTargetReached;
    this.reset();
  }

  public setConfig(config: ExerciseConfig): void {
    this.config = config;
    this.reset();
  }

  public getConfig(): ExerciseConfig {
    return this.config;
  }

  public reset(): void {
    this.state = 'READY';
    this.validReps = 0;
    this.incompleteAttempts = 0;
    this.holdSeconds = 0;
    this.smoothedAngles = {};
    this.repStartTime = 0;
    this.lastFrameTime = 0;
    this.lastTrackingTime = 0;
    this.repHistory = [];
    this.feedbackHistory.clear();
    this.currentRepFeedback.clear();
    this.targetReachedFired = false;
    this.activeFeedback = this.config.camera.setupTip;
    this.lastFeedbackChangeTime = 0;

    // Initialize initial angle tracker
    this.minPeakAngleInCurrentRep =
      this.config.direction === 'decreasing' ? 180 : 0;
  }

  public getStats() {
    const feedbackList = Array.from(this.feedbackHistory.entries()).map(
      ([message, count]) => ({
        message,
        count,
      })
    );
    return {
      validReps: this.validReps,
      incompleteAttempts: this.incompleteAttempts,
      holdSeconds: Math.round(this.holdSeconds * 10) / 10,
      repHistory: [...this.repHistory],
      feedbackSummary: feedbackList,
    };
  }

  private setFeedback(message: string, now: number, force: boolean = false): void {
    if (!message) return;
    if (!force && this.activeFeedback === message) return;
    if (!force && now - this.lastFeedbackChangeTime < 600) return;

    this.activeFeedback = message;
    this.lastFeedbackChangeTime = now;
    this.currentRepFeedback.add(message);

    const currentCount = this.feedbackHistory.get(message) || 0;
    this.feedbackHistory.set(message, currentCount + 1);
  }

  /**
   * Helper to resolve the angle based on side configuration (left, right, both, best-visible)
   */
  private resolveSideAngle(
    landmarks: NormalizedLandmark[],
    jointA: number,
    jointB: number,
    jointC: number,
    side: AngleSide
  ): { angle: number | null; sideUsed: 'left' | 'right' | 'both' | 'none' } {
    const getJoint = (idx: number, isRight: boolean) => {
      // In MediaPipe: right joints are leftJoint + 1 (e.g. 11 & 12, 13 & 14, 23 & 24, etc.)
      const offsetIdx = isRight && idx % 2 !== 0 ? idx + 1 : idx;
      return landmarks[offsetIdx];
    };

    const leftA = landmarks[jointA];
    const leftB = landmarks[jointB];
    const leftC = landmarks[jointC];

    const rightA = getJoint(jointA, true);
    const rightB = getJoint(jointB, true);
    const rightC = getJoint(jointC, true);

    const leftVis =
      isLandmarkVisible(leftA, 0.45) &&
      isLandmarkVisible(leftB, 0.45) &&
      isLandmarkVisible(leftC, 0.45);

    const rightVis =
      isLandmarkVisible(rightA, 0.45) &&
      isLandmarkVisible(rightB, 0.45) &&
      isLandmarkVisible(rightC, 0.45);

    const leftAngle = leftVis ? calculateAngle(leftA, leftB, leftC) : null;
    const rightAngle = rightVis ? calculateAngle(rightA, rightB, rightC) : null;

    if (side === 'left') {
      return { angle: leftAngle, sideUsed: leftVis ? 'left' : 'none' };
    }
    if (side === 'right') {
      return { angle: rightAngle, sideUsed: rightVis ? 'right' : 'none' };
    }

    if (side === 'both') {
      if (leftVis && rightVis && leftAngle !== null && rightAngle !== null) {
        return { angle: (leftAngle + rightAngle) / 2, sideUsed: 'both' };
      }
      if (leftVis && leftAngle !== null) {
        return { angle: leftAngle, sideUsed: 'left' };
      }
      if (rightVis && rightAngle !== null) {
        return { angle: rightAngle, sideUsed: 'right' };
      }
      return { angle: null, sideUsed: 'none' };
    }

    // 'best-visible'
    const leftConf =
      ((leftA?.visibility ?? 0) + (leftB?.visibility ?? 0) + (leftC?.visibility ?? 0)) / 3;
    const rightConf =
      ((rightA?.visibility ?? 0) + (rightB?.visibility ?? 0) + (rightC?.visibility ?? 0)) / 3;

    if (leftConf >= rightConf && leftVis && leftAngle !== null) {
      return { angle: leftAngle, sideUsed: 'left' };
    }
    if (rightVis && rightAngle !== null) {
      return { angle: rightAngle, sideUsed: 'right' };
    }
    if (leftVis && leftAngle !== null) {
      return { angle: leftAngle, sideUsed: 'left' };
    }
    return { angle: null, sideUsed: 'none' };
  }

  /**
   * Main per-frame inference processor
   */
  public update(
    landmarks: NormalizedLandmark[] | undefined | null,
    now: number = performance.now()
  ): ExerciseAnalysisFrame {
    const deltaMs = this.lastFrameTime > 0 ? Math.min(now - this.lastFrameTime, 1000) : 0;
    this.lastFrameTime = now;

    // 1. Check landmarks array
    if (!landmarks || landmarks.length < 25) {
      this.handleTrackingLoss(now);
      return this.createEmptyFrame('No landmarks detected. Stand in frame.');
    }

    // 2. Landmark visibility verification
    const reqLandmarks = this.config.requiredLandmarks || [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
    ];

    let visibleCount = 0;
    for (const lmIdx of reqLandmarks) {
      if (isLandmarkVisible(landmarks[lmIdx], 0.45)) {
        visibleCount++;
      }
    }

    const confidenceRatio = reqLandmarks.length > 0 ? visibleCount / reqLandmarks.length : 1;
    const isPausedLowVisibility = confidenceRatio < 0.5;

    if (isPausedLowVisibility) {
      this.handleTrackingLoss(now);
      this.setFeedback('Move back so your full body is visible', now, true);
      return {
        state: this.state,
        primaryAngle: this.smoothedAngles[this.config.primaryAngle] ?? 0,
        angles: { ...this.smoothedAngles },
        sideUsed: 'none',
        validReps: this.validReps,
        incompleteAttempts: this.incompleteAttempts,
        holdSeconds: Math.round(this.holdSeconds * 10) / 10,
        feedback: [this.activeFeedback],
        confidence: Math.round(confidenceRatio * 100) / 100,
        isPositionedWell: false,
        minPeakAngleInRep: Math.round(this.minPeakAngleInCurrentRep),
        isPausedLowVisibility: true,
        activeCues: [this.activeFeedback],
      };
    }

    this.lastTrackingTime = now;

    // 3. Compute all tracked angles
    const calculatedAngles: Record<string, number> = {};
    let resolvedSide: 'left' | 'right' | 'both' | 'none' = 'none';

    for (const angleConfig of this.config.trackedAngles) {
      const res = this.resolveSideAngle(
        landmarks,
        angleConfig.jointA,
        angleConfig.jointB,
        angleConfig.jointC,
        angleConfig.side
      );

      if (res.angle !== null && !isNaN(res.angle)) {
        const prev = this.smoothedAngles[angleConfig.name] ?? res.angle;
        const smoothed = smoothValue(prev, res.angle, 0.4);
        this.smoothedAngles[angleConfig.name] = smoothed;
        calculatedAngles[angleConfig.name] = smoothed;
        if (angleConfig.name === this.config.primaryAngle) {
          resolvedSide = res.sideUsed;
        }
      } else if (this.smoothedAngles[angleConfig.name] !== undefined) {
        calculatedAngles[angleConfig.name] = this.smoothedAngles[angleConfig.name];
      }
    }

    const primaryAngle = calculatedAngles[this.config.primaryAngle];
    if (primaryAngle === undefined || isNaN(primaryAngle)) {
      return this.createEmptyFrame('Position camera to clearly track joints.');
    }

    // 4. Form checks evaluation
    const activeCues: string[] = [];
    for (const check of this.config.formChecks) {
      const result = check.evaluate(landmarks, calculatedAngles);
      if (result === 'warn' || result === 'fail') {
        this.setFeedback(check.cueText, now);
        activeCues.push(check.cueText);
      }
    }

    // 5. State transitions (Hold Mode vs Reps Mode)
    if (this.config.mode === 'hold') {
      this.processHoldMode(calculatedAngles, activeCues, deltaMs, now);
    } else {
      this.processRepsMode(primaryAngle, resolvedSide, now);
    }

    // 6. Check target goal reached
    this.checkTargetGoal();

    return {
      state: this.state,
      primaryAngle: Math.round(primaryAngle * 10) / 10,
      angles: { ...this.smoothedAngles },
      sideUsed: resolvedSide,
      validReps: this.validReps,
      incompleteAttempts: this.incompleteAttempts,
      holdSeconds: Math.round(this.holdSeconds * 10) / 10,
      feedback: [this.activeFeedback],
      confidence: Math.round(confidenceRatio * 100) / 100,
      isPositionedWell: true,
      minPeakAngleInRep: Math.round(this.minPeakAngleInCurrentRep * 10) / 10,
      isPausedLowVisibility: false,
      activeCues,
    };
  }

  /**
   * Process Timed Hold (Plank)
   */
  private processHoldMode(
    angles: Record<string, number>,
    activeCues: string[],
    deltaMs: number,
    now: number
  ): void {
    const primary = angles[this.config.primaryAngle];
    const threshold = this.config.phases.startThreshold;

    // Check if form check flagged a critical break
    const hasFormBreak = activeCues.length > 0 || (primary !== undefined && primary < threshold - 6);

    if (hasFormBreak) {
      this.state = 'FORM_BREAK';
      this.setFeedback(
        this.config.partialRepMessage || 'Adjust posture to maintain hold.',
        now
      );
    } else {
      this.state = 'HOLDING';
      if (deltaMs > 0) {
        this.holdSeconds += deltaMs / 1000;
      }
      this.setFeedback(`Holding strong: ${Math.floor(this.holdSeconds)}s`, now);
    }
  }

  /**
   * Process Rep Counting State Machine (Decreasing or Increasing)
   */
  private processRepsMode(
    angle: number,
    sideUsed: 'left' | 'right' | 'both' | 'none',
    now: number
  ): void {
    const { phases, direction } = this.config;
    const isDecreasing = direction === 'decreasing';

    switch (this.state) {
      case 'READY': {
        this.minPeakAngleInCurrentRep = isDecreasing ? 180 : 0;

        const isAtStartingPosition = isDecreasing
          ? angle >= phases.startThreshold
          : angle <= phases.startThreshold;

        if (isAtStartingPosition) {
          this.setFeedback('Ready. Begin your movement.', now);
        }

        const hasStarted = isDecreasing
          ? angle < phases.startThreshold - 4
          : angle > phases.startThreshold + 4;

        if (hasStarted) {
          this.state = isDecreasing ? 'DOWN' : 'UP';
          this.repStartTime = now;
          this.minPeakAngleInCurrentRep = angle;
          this.currentRepFeedback.clear();
          this.setFeedback('Move through full range of motion.', now, true);
        }
        break;
      }

      case 'DOWN': {
        if (isDecreasing) {
          if (angle < this.minPeakAngleInCurrentRep) {
            this.minPeakAngleInCurrentRep = angle;
          }

          // Hit full depth
          if (angle <= phases.bottomThreshold) {
            this.state = 'BOTTOM';
            this.setFeedback('Great depth! Now drive back up.', now, true);
          }
          // Bailout early
          else if (angle >= phases.lockoutThreshold && now - this.repStartTime > 500) {
            this.incompleteAttempts++;
            const reason = `${this.config.partialRepMessage} (Reached ${Math.round(this.minPeakAngleInCurrentRep)}°)`;
            this.setFeedback(reason, now, true);
            if (this.onIncompleteCallback) {
              this.onIncompleteCallback(reason);
            }
            this.state = 'READY';
          }
        } else {
          // Returning downward in increasing movement (e.g. lowering shoulder press)
          if (angle <= phases.lockoutThreshold) {
            this.finishValidRep(sideUsed, now);
            this.state = 'READY';
          }
        }
        break;
      }

      case 'BOTTOM': {
        if (isDecreasing) {
          if (angle < this.minPeakAngleInCurrentRep) {
            this.minPeakAngleInCurrentRep = angle;
          }
          // Ascending out of bottom
          if (angle > phases.bottomThreshold + 8) {
            this.state = 'UP';
            this.setFeedback('Drive back to top lockout.', now, true);
          }
        } else {
          // Peak reached in increasing movement
          if (angle > this.minPeakAngleInCurrentRep) {
            this.minPeakAngleInCurrentRep = angle;
          }
          // Descending out of peak
          if (angle < phases.bottomThreshold - 8) {
            this.state = 'DOWN';
            this.setFeedback('Lower under control.', now, true);
          }
        }
        break;
      }

      case 'UP': {
        if (isDecreasing) {
          // Returning to top lockout in decreasing movement (e.g. squat, pushup)
          if (angle >= phases.lockoutThreshold) {
            this.finishValidRep(sideUsed, now);
            this.state = 'READY';
          }
        } else {
          // Ascending in increasing movement (e.g. pressing overhead)
          if (angle > this.minPeakAngleInCurrentRep) {
            this.minPeakAngleInCurrentRep = angle;
          }
          // Hit peak lockout
          if (angle >= phases.bottomThreshold) {
            this.state = 'BOTTOM';
            this.setFeedback('Full extension! Now lower with control.', now, true);
          }
          // Early bailout
          else if (angle <= phases.startThreshold && now - this.repStartTime > 500) {
            this.incompleteAttempts++;
            const reason = `${this.config.partialRepMessage} (Reached ${Math.round(this.minPeakAngleInCurrentRep)}°)`;
            this.setFeedback(reason, now, true);
            if (this.onIncompleteCallback) {
              this.onIncompleteCallback(reason);
            }
            this.state = 'READY';
          }
        }
        break;
      }
    }

    // Safety timeout
    const maxDur = phases.maxRepDurationMs || 12000;
    if (this.state !== 'READY' && now - this.repStartTime > maxDur) {
      this.state = 'READY';
      this.setFeedback('Resetting posture. Begin again.', now, true);
    }
  }

  private finishValidRep(sideUsed: 'left' | 'right' | 'both' | 'none', now: number): void {
    const repDurationMs = now - this.repStartTime;
    if (repDurationMs >= this.config.phases.minRepDurationMs) {
      this.validReps++;
      const repDurationSec = Math.round((repDurationMs / 1000) * 10) / 10;
      const repFeedbackList = Array.from(this.currentRepFeedback);
      if (repFeedbackList.length === 0) repFeedbackList.push('Great repetition');

      const repRecord: RepRecord = {
        rep_number: this.validReps,
        duration_seconds: repDurationSec,
        min_knee_angle: Math.round(this.minPeakAngleInCurrentRep * 10) / 10,
        completed_at: new Date().toISOString(),
        feedback: repFeedbackList,
        side_used: sideUsed === 'none' ? 'both' : sideUsed,
      };

      this.repHistory.push(repRecord);
      this.setFeedback(`Rep ${this.validReps} complete!`, now, true);

      if (this.onRepCompletedCallback) {
        this.onRepCompletedCallback(repRecord);
      }
    }
  }

  private checkTargetGoal(): void {
    if (this.targetReachedFired) return;

    if (this.config.mode === 'hold') {
      const target = this.config.defaultTargetHoldSeconds || 45;
      if (this.holdSeconds >= target) {
        this.targetReachedFired = true;
        if (this.onTargetReachedCallback) {
          this.onTargetReachedCallback();
        }
      }
    } else {
      const target = this.config.defaultTargetReps || 15;
      if (this.validReps >= target) {
        this.targetReachedFired = true;
        if (this.onTargetReachedCallback) {
          this.onTargetReachedCallback();
        }
      }
    }
  }

  private handleTrackingLoss(now: number): void {
    if (this.state !== 'READY' && now - this.lastTrackingTime > 2500) {
      this.state = 'READY';
      this.setFeedback('Tracking lost. Reposition in camera.', now, true);
    }
  }

  private createEmptyFrame(message: string): ExerciseAnalysisFrame {
    return {
      state: this.state,
      primaryAngle: 0,
      angles: { ...this.smoothedAngles },
      sideUsed: 'none',
      validReps: this.validReps,
      incompleteAttempts: this.incompleteAttempts,
      holdSeconds: Math.round(this.holdSeconds * 10) / 10,
      feedback: [message],
      confidence: 0,
      isPositionedWell: false,
      minPeakAngleInRep: 0,
      isPausedLowVisibility: true,
      activeCues: [message],
    };
  }
}
