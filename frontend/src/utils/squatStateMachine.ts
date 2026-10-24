import { NormalizedLandmark, SquatState, SquatAnalysisFrame, RepRecord } from '../types/pose';
import { calculateAngle, isLandmarkVisible, smoothValue, POSE_LANDMARKS } from './math';

export interface SquatConfig {
  standingAngle: number;    // Knee angle considered upright (~160 deg)
  descentAngle: number;     // Knee angle indicating descent (~150 deg)
  bottomAngle: number;      // Knee angle for full squat depth (~100 deg)
  minRepDurationMs: number; // Minimum time for a valid rep (~700ms)
  maxRepDurationMs: number; // Maximum time before resetting a stuck rep (~10000ms)
  confidenceThreshold: number; // Minimum landmark visibility
}

export const DEFAULT_SQUAT_CONFIG: SquatConfig = {
  standingAngle: 158,
  descentAngle: 148,
  bottomAngle: 102,
  minRepDurationMs: 700,
  maxRepDurationMs: 12000,
  confidenceThreshold: 0.5,
};

export class SquatStateMachine {
  private config: SquatConfig;
  private state: SquatState = 'READY';
  private validReps: number = 0;
  private incompleteAttempts: number = 0;
  
  // Tracking angles & smoothing
  private smoothedKneeAngle: number = 175;
  private minKneeAngleInCurrentRep: number = 180;
  private repStartTime: number = 0;
  private stateEnterTime: number = 0;
  private lastTrackingTime: number = 0;

  // Rep history & feedback logging
  private repHistory: RepRecord[] = [];
  private feedbackHistory: Map<string, number> = new Map();
  private activeFeedback: string = 'Stand tall in frame to begin';
  private lastFeedbackChangeTime: number = 0;
  private currentRepFeedback: Set<string> = new Set();
  
  // Rep completion callback
  private onRepCompletedCallback?: (rep: RepRecord) => void;
  private onIncompleteCallback?: (reason: string) => void;

  constructor(
    config: Partial<SquatConfig> = {},
    onRepCompleted?: (rep: RepRecord) => void,
    onIncomplete?: (reason: string) => void
  ) {
    this.config = { ...DEFAULT_SQUAT_CONFIG, ...config };
    this.onRepCompletedCallback = onRepCompleted;
    this.onIncompleteCallback = onIncomplete;
  }

  public reset(): void {
    this.state = 'READY';
    this.validReps = 0;
    this.incompleteAttempts = 0;
    this.smoothedKneeAngle = 175;
    this.minKneeAngleInCurrentRep = 180;
    this.repStartTime = 0;
    this.stateEnterTime = 0;
    this.lastTrackingTime = 0;
    this.repHistory = [];
    this.feedbackHistory.clear();
    this.activeFeedback = 'Stand tall in frame to begin';
    this.lastFeedbackChangeTime = 0;
    this.currentRepFeedback.clear();
  }

  public getStats() {
    const feedbackList = Array.from(this.feedbackHistory.entries()).map(([message, count]) => ({
      message,
      count,
    }));
    return {
      validReps: this.validReps,
      incompleteAttempts: this.incompleteAttempts,
      repHistory: [...this.repHistory],
      feedbackSummary: feedbackList,
    };
  }

  private setFeedback(message: string, now: number, force: boolean = false): void {
    // Debounce feedback to prevent flickering between frames (min 600ms persistence)
    if (!force && this.activeFeedback === message) return;
    if (!force && now - this.lastFeedbackChangeTime < 600) return;

    this.activeFeedback = message;
    this.lastFeedbackChangeTime = now;
    this.currentRepFeedback.add(message);

    // Track historical count
    const currentCount = this.feedbackHistory.get(message) || 0;
    this.feedbackHistory.set(message, currentCount + 1);
  }

  /**
   * Processes a single frame with landmarks and updates state machine.
   */
  public update(
    landmarks: NormalizedLandmark[] | undefined | null,
    now: number = performance.now()
  ): SquatAnalysisFrame {
    // 1. Check landmarks availability
    if (!landmarks || landmarks.length < 29) {
      this.handleTrackingLoss(now);
      return this.createFrameResult(0, null, null, null, 'none', 0, false, ['No landmarks detected. Stand in frame.']);
    }

    // Key landmarks for squats: hips (23, 24), knees (25, 26), ankles (27, 28), shoulders (11, 12)
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];

    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    const leftVisible = isLandmarkVisible(leftHip, this.config.confidenceThreshold) &&
                        isLandmarkVisible(leftKnee, this.config.confidenceThreshold) &&
                        isLandmarkVisible(leftAnkle, this.config.confidenceThreshold);

    const rightVisible = isLandmarkVisible(rightHip, this.config.confidenceThreshold) &&
                         isLandmarkVisible(rightKnee, this.config.confidenceThreshold) &&
                         isLandmarkVisible(rightAnkle, this.config.confidenceThreshold);

    // If neither side has visible legs, handle low confidence
    if (!leftVisible && !rightVisible) {
      this.handleTrackingLoss(now);
      this.setFeedback('Low confidence. Keep full body visible.', now);
      return this.createFrameResult(
        this.smoothedKneeAngle,
        null,
        null,
        null,
        'none',
        0.2,
        false,
        [this.activeFeedback]
      );
    }

    this.lastTrackingTime = now;

    // 2. Calculate knee angles
    const leftAngle = leftVisible ? calculateAngle(leftHip, leftKnee, leftAnkle) : null;
    const rightAngle = rightVisible ? calculateAngle(rightHip, rightKnee, rightAnkle) : null;

    let currentRawKneeAngle: number;
    let sideUsed: 'left' | 'right' | 'both';

    if (leftVisible && rightVisible && leftAngle !== null && rightAngle !== null) {
      // Use average of both knees
      currentRawKneeAngle = (leftAngle + rightAngle) / 2;
      sideUsed = 'both';
    } else if (leftVisible && leftAngle !== null) {
      currentRawKneeAngle = leftAngle;
      sideUsed = 'left';
    } else if (rightVisible && rightAngle !== null) {
      currentRawKneeAngle = rightAngle;
      sideUsed = 'right';
    } else {
      return this.createFrameResult(this.smoothedKneeAngle, null, null, null, 'none', 0.3, false, ['Adjust camera position']);
    }

    // Apply EMA filter
    this.smoothedKneeAngle = smoothValue(this.smoothedKneeAngle, currentRawKneeAngle, 0.4);

    // 3. Torso posture check (angle of shoulder-hip vs vertical)
    let torsoAngle: number | null = null;
    const refShoulder = leftVisible ? leftShoulder : rightShoulder;
    const refHip = leftVisible ? leftHip : rightHip;
    if (refShoulder && refHip && typeof refShoulder.x === 'number' && typeof refHip.x === 'number') {
      // Vertical reference point above hip
      const virtualVerticalPoint = { x: refHip.x, y: refHip.y - 0.5 };
      torsoAngle = calculateAngle(refShoulder, refHip, virtualVerticalPoint);
    }

    // Check if body is well positioned in frame (not cut off at top or bottom)
    const ankleY = (leftAnkle?.y ?? rightAnkle?.y ?? 0.8);
    const shoulderY = (leftShoulder?.y ?? rightShoulder?.y ?? 0.2);
    const isPositionedWell = ankleY < 0.98 && shoulderY > 0.05 && (ankleY - shoulderY > 0.4);

    if (!isPositionedWell) {
      this.setFeedback('Step back so your full body is in view', now);
    }

    // 4. State Machine Transition Logic
    this.processStateTransitions(this.smoothedKneeAngle, torsoAngle, sideUsed, now);

    return this.createFrameResult(
      this.smoothedKneeAngle,
      leftAngle,
      rightAngle,
      torsoAngle,
      sideUsed,
      leftVisible && rightVisible ? 0.95 : 0.75,
      isPositionedWell,
      [this.activeFeedback]
    );
  }

  private processStateTransitions(
    kneeAngle: number,
    torsoAngle: number | null,
    sideUsed: 'left' | 'right' | 'both',
    now: number
  ): void {
    // Excessive forward lean check
    if (torsoAngle !== null && torsoAngle > 48 && (this.state === 'DESCENDING' || this.state === 'BOTTOM')) {
      this.setFeedback('Keep your chest upright', now);
    }

    switch (this.state) {
      case 'READY': {
        this.minKneeAngleInCurrentRep = 180;
        if (kneeAngle >= this.config.standingAngle) {
          this.setFeedback('Ready. Begin your squat descent.', now);
        }

        // Transition: Starting to descend
        if (kneeAngle < this.config.descentAngle) {
          this.state = 'DESCENDING';
          this.stateEnterTime = now;
          this.repStartTime = now;
          this.minKneeAngleInCurrentRep = kneeAngle;
          this.currentRepFeedback.clear();
          this.setFeedback('Descend smoothly. Aim for parallel.', now, true);
        }
        break;
      }

      case 'DESCENDING': {
        if (kneeAngle < this.minKneeAngleInCurrentRep) {
          this.minKneeAngleInCurrentRep = kneeAngle;
        }

        // Deep enough: hit bottom!
        if (kneeAngle <= this.config.bottomAngle) {
          this.state = 'BOTTOM';
          this.stateEnterTime = now;
          this.setFeedback('Great depth! Now drive back up.', now, true);
        }
        // Incomplete / Early bailout: user bent knees, then went back up without hitting bottom (< 100°)
        else if (kneeAngle >= this.config.standingAngle && (now - this.repStartTime > 500)) {
          this.incompleteAttempts++;
          const reason = `Squat not deep enough (${Math.round(this.minKneeAngleInCurrentRep)}° reached, needed ≤${this.config.bottomAngle}°). Go deeper!`;
          this.setFeedback(reason, now, true);
          if (this.onIncompleteCallback) {
            this.onIncompleteCallback(reason);
          }
          this.state = 'READY';
          this.stateEnterTime = now;
        } else if (kneeAngle > this.minKneeAngleInCurrentRep + 8 && kneeAngle < this.config.standingAngle) {
          // Starting to ascend before reaching bottom
          this.setFeedback('Go a little deeper before standing up', now);
        }
        break;
      }

      case 'BOTTOM': {
        if (kneeAngle < this.minKneeAngleInCurrentRep) {
          this.minKneeAngleInCurrentRep = kneeAngle;
        }

        // Ascending back up
        if (kneeAngle > this.config.bottomAngle + 10) {
          this.state = 'ASCENDING';
          this.stateEnterTime = now;
          this.setFeedback('Push through heels to standing.', now, true);
        }
        break;
      }

      case 'ASCENDING': {
        // Return to standing: Completed Rep!
        if (kneeAngle >= this.config.standingAngle) {
          const repDurationMs = now - this.repStartTime;
          
          if (repDurationMs >= this.config.minRepDurationMs) {
            // Valid Repetition Confirmed!
            this.validReps++;
            const repDurationSec = Math.round((repDurationMs / 1000) * 10) / 10;
            const repFeedbackList = Array.from(this.currentRepFeedback);
            if (repFeedbackList.length === 0) repFeedbackList.push('Great repetition');

            const repRecord: RepRecord = {
              rep_number: this.validReps,
              duration_seconds: repDurationSec,
              min_knee_angle: Math.round(this.minKneeAngleInCurrentRep * 10) / 10,
              completed_at: new Date().toISOString(),
              feedback: repFeedbackList,
              side_used: sideUsed,
            };

            this.repHistory.push(repRecord);
            this.setFeedback(`Rep ${this.validReps} complete! Excellent.`, now, true);

            if (this.onRepCompletedCallback) {
              this.onRepCompletedCallback(repRecord);
            }
          }

          // Return to READY state
          this.state = 'READY';
          this.stateEnterTime = now;
        }
        break;
      }
    }

    // Safety timeout: If stuck in DESCENDING or BOTTOM for > maxRepDurationMs, reset to READY
    if (
      this.state !== 'READY' &&
      now - this.repStartTime > this.config.maxRepDurationMs
    ) {
      this.state = 'READY';
      this.setFeedback('Stand upright to reset.', now, true);
    }
  }

  private handleTrackingLoss(now: number): void {
    if (this.state !== 'READY' && now - this.lastTrackingTime > 2500) {
      // If tracking lost for > 2.5s mid-rep, safely reset to READY without falsely adding a rep
      this.state = 'READY';
      this.setFeedback('Tracking lost. Reposition in camera.', now, true);
    }
  }

  private createFrameResult(
    kneeAngle: number,
    leftKneeAngle: number | null,
    rightKneeAngle: number | null,
    torsoAngle: number | null,
    sideUsed: 'left' | 'right' | 'both' | 'none',
    confidence: number,
    isPositionedWell: boolean,
    feedback: string[]
  ): SquatAnalysisFrame {
    return {
      state: this.state,
      kneeAngle: Math.round(kneeAngle),
      leftKneeAngle: leftKneeAngle !== null ? Math.round(leftKneeAngle) : null,
      rightKneeAngle: rightKneeAngle !== null ? Math.round(rightKneeAngle) : null,
      torsoAngle: torsoAngle !== null ? Math.round(torsoAngle) : null,
      sideUsed,
      validReps: this.validReps,
      incompleteAttempts: this.incompleteAttempts,
      feedback,
      confidence,
      isPositionedWell,
      minKneeAngleInRep: Math.round(this.minKneeAngleInCurrentRep),
    };
  }
}
