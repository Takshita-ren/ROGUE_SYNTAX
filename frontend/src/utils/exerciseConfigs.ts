import { ExerciseConfig } from '../types/pose';
import { POSE_LANDMARKS, calculateAngle, isLandmarkVisible } from './math';

/**
 * REPRIGHT EXERCISE CONFIGURATIONS & THRESHOLDS
 *
 * All biomechanical angles, state transition thresholds, and form cues
 * are centralized here for easy tuning and calibration with real camera feeds.
 *
 * Angle Math:
 * - Angles are calculated in degrees [0, 180] formed by (jointA - vertex jointB - jointC).
 * - Direction "decreasing": rep starts high, reaches peak at low angle (Squat, Push-up, Lunge, Bicep curl, Sit-up).
 * - Direction "increasing": rep starts low, reaches peak at high angle (Shoulder press, Jumping jack).
 * - Mode "hold": timer accumulates elapsed seconds while body line stays within good form thresholds (Plank).
 */

export const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  // =========================================================================
  // 1. SQUAT (Legs - Reps - Decreasing)
  // =========================================================================
  squat: {
    id: 'squat',
    name: 'Bodyweight Squat',
    category: 'legs',
    mode: 'reps',
    camera: {
      recommendedView: 'side',
      setupTip: 'Step back ~6–8 ft so your entire body from head to feet is clearly visible.',
    },
    trackedAngles: [
      {
        name: 'kneeAngle',
        label: 'Knee Angle',
        jointA: POSE_LANDMARKS.LEFT_HIP,
        jointB: POSE_LANDMARKS.LEFT_KNEE,
        jointC: POSE_LANDMARKS.LEFT_ANKLE,
        side: 'both',
      },
      {
        name: 'hipAngle',
        label: 'Hip Angle',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_HIP,
        jointC: POSE_LANDMARKS.LEFT_KNEE,
        side: 'both',
      },
    ],
    primaryAngle: 'kneeAngle',
    direction: 'decreasing',
    phases: {
      // Standing upright knee lockout
      startThreshold: 158,
      // Breaking knees into descent
      bottomThreshold: 102,
      // Standing back up to complete rep
      lockoutThreshold: 158,
      minRepDurationMs: 700,
      maxRepDurationMs: 12000,
    },
    formChecks: [
      {
        id: 'chest_upright',
        description: 'Keep torso upright and avoid excessive forward lean',
        cueText: 'Keep your chest upright and proud',
        evaluate: (landmarks, _angles) => {
          const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
          const hip = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
          if (!shoulder || !hip) return 'ok';
          // Virtual vertical above hip
          const vert = { x: hip.x, y: hip.y - 0.5 };
          const lean = calculateAngle(shoulder, hip, vert);
          if (!isNaN(lean) && lean > 48) return 'warn';
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Squat deeper — hips should reach parallel with knees',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
      [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
      [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
    ],
    defaultTargetReps: 15,
  },

  // =========================================================================
  // 2. PUSH-UP (Push - Reps - Decreasing)
  // =========================================================================
  pushup: {
    id: 'pushup',
    name: 'Push-Up',
    category: 'push',
    mode: 'reps',
    camera: {
      recommendedView: 'side',
      setupTip: 'Position camera at floor height with side profile of your full body.',
    },
    trackedAngles: [
      {
        name: 'elbowAngle',
        label: 'Elbow Angle',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_ELBOW,
        jointC: POSE_LANDMARKS.LEFT_WRIST,
        side: 'best-visible',
      },
      {
        name: 'bodyLineAngle',
        label: 'Body Line',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_HIP,
        jointC: POSE_LANDMARKS.LEFT_ANKLE,
        side: 'best-visible',
      },
    ],
    primaryAngle: 'elbowAngle',
    direction: 'decreasing',
    phases: {
      // High plank lockout
      startThreshold: 155,
      // Chest to floor elbow depth (<= 90-95 deg)
      bottomThreshold: 95,
      // Full arm extension back to plank
      lockoutThreshold: 150,
      minRepDurationMs: 650,
      maxRepDurationMs: 12000,
    },
    formChecks: [
      {
        id: 'bodyline_hip_sag',
        description: 'Maintain straight plank: flag sagging hips',
        cueText: 'Squeeze glutes and core — do not sag your hips',
        evaluate: (_landmarks, angles) => {
          const bodyLine = angles['bodyLineAngle'];
          if (bodyLine !== undefined && !isNaN(bodyLine) && bodyLine < 150) {
            return 'warn';
          }
          return 'ok';
        },
      },
      {
        id: 'bodyline_hip_pike',
        description: 'Maintain straight plank: flag piked hips',
        cueText: 'Lower hips into a flat line with shoulders',
        evaluate: (landmarks, _angles) => {
          const s = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
          const h = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
          const a = landmarks[POSE_LANDMARKS.LEFT_ANKLE] || landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
          if (!s || !h || !a) return 'ok';
          // If hip is significantly higher (lower y) than midpoint of shoulder and ankle
          const midY = (s.y + a.y) / 2;
          if (h.y < midY - 0.12) {
            return 'warn';
          }
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Lower chest closer to floor for full range of motion',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
      [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
    ],
    defaultTargetReps: 12,
  },

  // =========================================================================
  // 3. LUNGE (Legs - Reps - Decreasing)
  // =========================================================================
  lunge: {
    id: 'lunge',
    name: 'Walking / Static Lunge',
    category: 'legs',
    mode: 'reps',
    camera: {
      recommendedView: 'side',
      setupTip: 'Stand sideways to camera with room to step forward/backward.',
    },
    trackedAngles: [
      {
        name: 'leadKneeAngle',
        label: 'Lead Knee',
        jointA: POSE_LANDMARKS.LEFT_HIP,
        jointB: POSE_LANDMARKS.LEFT_KNEE,
        jointC: POSE_LANDMARKS.LEFT_ANKLE,
        side: 'best-visible',
      },
    ],
    primaryAngle: 'leadKneeAngle',
    direction: 'decreasing',
    phases: {
      startThreshold: 160,
      bottomThreshold: 98,
      lockoutThreshold: 155,
      minRepDurationMs: 800,
      maxRepDurationMs: 12000,
    },
    formChecks: [
      {
        id: 'torso_lean',
        description: 'Keep torso upright during lunge descent',
        cueText: 'Keep shoulders stacked over hips',
        evaluate: (landmarks, _angles) => {
          const s = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
          const h = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
          if (!s || !h) return 'ok';
          const vert = { x: h.x, y: h.y - 0.5 };
          const lean = calculateAngle(s, h, vert);
          if (!isNaN(lean) && lean > 35) return 'warn';
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Drop back knee deeper toward the floor',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
      [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
      [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
    ],
    defaultTargetReps: 16,
  },

  // =========================================================================
  // 4. BICEP CURL (Pull - Reps - Decreasing)
  // =========================================================================
  bicep_curl: {
    id: 'bicep_curl',
    name: 'Bicep Curl',
    category: 'pull',
    mode: 'reps',
    camera: {
      recommendedView: 'side',
      setupTip: 'Stand sideways or at 45° angle so your arm and torso are clear.',
    },
    trackedAngles: [
      {
        name: 'elbowAngle',
        label: 'Elbow Angle',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_ELBOW,
        jointC: POSE_LANDMARKS.LEFT_WRIST,
        side: 'best-visible',
      },
      {
        name: 'elbowDriftAngle',
        label: 'Elbow-Torso Angle',
        jointA: POSE_LANDMARKS.LEFT_HIP,
        jointB: POSE_LANDMARKS.LEFT_SHOULDER,
        jointC: POSE_LANDMARKS.LEFT_ELBOW,
        side: 'best-visible',
      },
    ],
    primaryAngle: 'elbowAngle',
    direction: 'decreasing',
    phases: {
      // Arms fully extended down
      startThreshold: 148,
      // Full curl flexion at top
      bottomThreshold: 62,
      // Complete lowering back down
      lockoutThreshold: 145,
      minRepDurationMs: 650,
      maxRepDurationMs: 10000,
    },
    formChecks: [
      {
        id: 'elbow_swing',
        description: 'Pin elbows to ribcage, avoid swinging torso or flaring forward',
        cueText: 'Pin elbows to your sides — do not swing momentum',
        evaluate: (landmarks, _angles) => {
          const s = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
          const e = landmarks[POSE_LANDMARKS.LEFT_ELBOW] || landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
          const h = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
          if (!s || !e || !h) return 'ok';
          const driftAngle = calculateAngle(h, s, e);
          if (!isNaN(driftAngle) && driftAngle > 42) {
            return 'warn';
          }
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Curl all the way up and fully extend at bottom',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
      [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
    ],
    defaultTargetReps: 12,
  },

  // =========================================================================
  // 5. SHOULDER PRESS (Push - Reps - Increasing)
  // =========================================================================
  shoulder_press: {
    id: 'shoulder_press',
    name: 'Overhead Shoulder Press',
    category: 'push',
    mode: 'reps',
    camera: {
      recommendedView: 'front',
      setupTip: 'Face camera directly with head, arms, and hips in frame.',
    },
    trackedAngles: [
      {
        name: 'elbowAngle',
        label: 'Elbow Lockout',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_ELBOW,
        jointC: POSE_LANDMARKS.LEFT_WRIST,
        side: 'both',
      },
    ],
    primaryAngle: 'elbowAngle',
    direction: 'increasing',
    phases: {
      // Rack position at chin level (~85 deg)
      startThreshold: 90,
      // Full overhead extension lockout (>= 155 deg)
      bottomThreshold: 155,
      // Returning to starting rack position (<= 95 deg)
      lockoutThreshold: 95,
      minRepDurationMs: 700,
      maxRepDurationMs: 12000,
    },
    formChecks: [
      {
        id: 'back_arch',
        description: 'Avoid excessive lumbar arching when pressing overhead',
        cueText: 'Keep ribs pulled down and core tight — avoid arching',
        evaluate: (landmarks, _angles) => {
          const s = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
          const h = landmarks[POSE_LANDMARKS.LEFT_HIP];
          const k = landmarks[POSE_LANDMARKS.LEFT_KNEE];
          if (!s || !h || !k) return 'ok';
          const torsoAngle = calculateAngle(s, h, k);
          if (!isNaN(torsoAngle) && torsoAngle < 155) return 'warn';
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Press fully overhead until elbows lock out',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
      [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    ],
    defaultTargetReps: 10,
  },

  // =========================================================================
  // 6. SIT-UP / CRUNCH (Core - Reps - Decreasing)
  // =========================================================================
  situp: {
    id: 'situp',
    name: 'Sit-Up / Crunch',
    category: 'core',
    mode: 'reps',
    camera: {
      recommendedView: 'side',
      setupTip: 'Position mat sideways to camera so your torso and knees are in view.',
    },
    trackedAngles: [
      {
        name: 'torsoHipAngle',
        label: 'Torso-Hip Flexion',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_HIP,
        jointC: POSE_LANDMARKS.LEFT_KNEE,
        side: 'best-visible',
      },
    ],
    primaryAngle: 'torsoHipAngle',
    direction: 'decreasing',
    phases: {
      // Lying back on floor
      startThreshold: 140,
      // Curled up at top of sit-up
      bottomThreshold: 72,
      // Returning to mat
      lockoutThreshold: 135,
      minRepDurationMs: 650,
      maxRepDurationMs: 12000,
    },
    formChecks: [
      {
        id: 'neck_pull',
        description: 'Keep neck relaxed without jerking head forward',
        cueText: 'Drive with your abs, not by pulling on your neck',
        evaluate: (landmarks, _angles) => {
          const nose = landmarks[POSE_LANDMARKS.NOSE];
          const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
          const hip = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
          if (!nose || !shoulder || !hip) return 'ok';
          const headTuck = calculateAngle(nose, shoulder, hip);
          if (!isNaN(headTuck) && headTuck < 80) return 'warn';
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Lift chest higher toward your knees',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    ],
    defaultTargetReps: 15,
  },

  // =========================================================================
  // 7. JUMPING JACK (Full-Body - Reps - Increasing)
  // =========================================================================
  jumping_jack: {
    id: 'jumping_jack',
    name: 'Jumping Jack',
    category: 'full-body',
    mode: 'reps',
    camera: {
      recommendedView: 'front',
      setupTip: 'Stand centered with arms and legs free to jump wide.',
    },
    trackedAngles: [
      {
        name: 'armSpreadAngle',
        label: 'Arm Elevation',
        jointA: POSE_LANDMARKS.LEFT_HIP,
        jointB: POSE_LANDMARKS.LEFT_SHOULDER,
        jointC: POSE_LANDMARKS.LEFT_WRIST,
        side: 'both',
      },
    ],
    primaryAngle: 'armSpreadAngle',
    direction: 'increasing',
    phases: {
      // Arms down at sides
      startThreshold: 45,
      // Arms raised high overhead
      bottomThreshold: 125,
      // Arms returned back down
      lockoutThreshold: 55,
      minRepDurationMs: 450,
      maxRepDurationMs: 5000,
    },
    formChecks: [
      {
        id: 'full_arm_reach',
        description: 'Raise arms all the way overhead',
        cueText: 'Clap or reach hands fully overhead',
        evaluate: (_landmarks, angles) => {
          const armAngle = angles['armSpreadAngle'];
          if (armAngle !== undefined && armAngle > 70 && armAngle < 110) {
            return 'warn';
          }
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Raise arms overhead and jump feet wide',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_WRIST],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE],
    ],
    defaultTargetReps: 25,
  },

  // =========================================================================
  // 8. PLANK (Core - Hold - Timed)
  // =========================================================================
  plank: {
    id: 'plank',
    name: 'Isometric Forearm Plank',
    category: 'core',
    mode: 'hold',
    camera: {
      recommendedView: 'side',
      setupTip: 'Floor level side view showing head, shoulders, hips, and heels.',
    },
    trackedAngles: [
      {
        name: 'bodyLineAngle',
        label: 'Body Line Angle',
        jointA: POSE_LANDMARKS.LEFT_SHOULDER,
        jointB: POSE_LANDMARKS.LEFT_HIP,
        jointC: POSE_LANDMARKS.LEFT_ANKLE,
        side: 'best-visible',
      },
    ],
    primaryAngle: 'bodyLineAngle',
    direction: 'decreasing',
    phases: {
      // Good plank line is near ~180° straight. Threshold between 155° - 195°
      startThreshold: 155,
      bottomThreshold: 155,
      lockoutThreshold: 155,
      minRepDurationMs: 1000,
      maxRepDurationMs: 600000,
    },
    formChecks: [
      {
        id: 'plank_sag_pike',
        description: 'Body straight from shoulders through hips to ankles',
        cueText: 'Keep body in a straight line — do not sag or pike hips',
        evaluate: (_landmarks, angles) => {
          const bodyLine = angles['bodyLineAngle'];
          if (bodyLine !== undefined && !isNaN(bodyLine)) {
            // Sagging (< 152) or extreme pike (< 152 when inverted)
            if (bodyLine < 152) return 'fail';
            if (bodyLine < 162) return 'warn';
          }
          return 'ok';
        },
      },
    ],
    partialRepMessage: 'Re-align hips into a straight plank to resume timer',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE,
    ],
    highlightJoints: [
      POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    highlightBones: [
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE],
    ],
    defaultTargetHoldSeconds: 45,
  },
};

export const EXERCISE_LIST = Object.values(EXERCISE_CONFIGS);
