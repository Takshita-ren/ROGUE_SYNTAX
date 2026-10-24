import { NormalizedLandmark, SquatState } from '../types/pose';
import { POSE_LANDMARKS, isLandmarkVisible } from './math';

interface SkeletonDrawOptions {
  mirrored?: boolean;
  showAngleBadges?: boolean;
  currentKneeAngle?: number;
  currentPrimaryAngle?: number;
  primaryAngleLabel?: string;
  squatState?: SquatState | string;
  highlightJoints?: number[];
  highlightBones?: [number, number][];
}

// Full standard pose connection pairs: [startIdx, endIdx]
const POSE_CONNECTIONS: [number, number][] = [
  // Upper body
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Legs
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

// Default fallback highlight connections for squats (legs and hips)
const DEFAULT_SQUAT_CONNECTIONS = new Set(['23-25', '25-27', '24-26', '26-28', '23-24']);

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  options: SkeletonDrawOptions = {}
): void {
  const {
    mirrored = true,
    showAngleBadges = true,
    currentKneeAngle,
    currentPrimaryAngle,
    primaryAngleLabel,
    squatState = 'READY',
    highlightJoints,
    highlightBones,
  } = options;

  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  // Determine active color scheme based on movement state
  let activeJointColor = '#00f59b'; // Electric neon green
  let activeBoneColor = 'rgba(0, 245, 155, 0.7)';

  const normalizedState = squatState.toUpperCase();
  if (normalizedState === 'DESCENDING' || normalizedState === 'DOWN') {
    activeJointColor = '#fbbf24'; // Amber
    activeBoneColor = 'rgba(251, 191, 36, 0.7)';
  } else if (normalizedState === 'BOTTOM' || normalizedState === 'HOLDING') {
    activeJointColor = '#38bdf8'; // Sky blue (depth / active hold reached)
    activeBoneColor = 'rgba(56, 189, 248, 0.8)';
  } else if (normalizedState === 'ASCENDING' || normalizedState === 'UP') {
    activeJointColor = '#34d399'; // Emerald
    activeBoneColor = 'rgba(52, 211, 153, 0.75)';
  } else if (normalizedState === 'FORM_BREAK') {
    activeJointColor = '#f43f5e'; // Rose / red alert
    activeBoneColor = 'rgba(244, 63, 94, 0.8)';
  }

  const defaultBoneColor = 'rgba(255, 255, 255, 0.3)';
  const defaultJointColor = '#ffffff';

  // Build lookup set for highlighted bones
  const activeBonesSet = new Set<string>();
  if (highlightBones && highlightBones.length > 0) {
    for (const [a, b] of highlightBones) {
      activeBonesSet.add(`${a}-${b}`);
      activeBonesSet.add(`${b}-${a}`);
    }
  } else {
    for (const key of DEFAULT_SQUAT_CONNECTIONS) {
      activeBonesSet.add(key);
    }
  }

  // Build lookup set for highlighted joints
  const activeJointsSet = new Set<number>(
    highlightJoints && highlightJoints.length > 0
      ? highlightJoints
      : [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
  );

  // Helper to map normalized coordinates to canvas pixels
  const getCanvasCoords = (lm: NormalizedLandmark) => {
    let x = lm.x * width;
    if (mirrored) {
      x = (1 - lm.x) * width;
    }
    const y = lm.y * height;
    return { x, y };
  };

  // 1. Draw connections (bones)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    if (!isLandmarkVisible(p1, 0.45) || !isLandmarkVisible(p2, 0.45)) {
      continue;
    }

    const { x: x1, y: y1 } = getCanvasCoords(p1);
    const { x: x2, y: y2 } = getCanvasCoords(p2);

    const isHighlighted =
      activeBonesSet.has(`${startIdx}-${endIdx}`) || activeBonesSet.has(`${endIdx}-${startIdx}`);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = isHighlighted ? 5 : 2.5;
    ctx.strokeStyle = isHighlighted ? activeBoneColor : defaultBoneColor;
    ctx.stroke();
  }

  // 2. Draw landmarks (nodes)
  const importantIndices = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
  ];

  for (const idx of importantIndices) {
    const lm = landmarks[idx];
    if (!isLandmarkVisible(lm, 0.45)) continue;

    const { x, y } = getCanvasCoords(lm);
    const isTargetJoint = activeJointsSet.has(idx);

    ctx.beginPath();
    const radius = isTargetJoint ? 7 : 4;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isTargetJoint ? activeJointColor : defaultJointColor;
    ctx.fill();

    // Subtle glow on active targeted joints
    if (isTargetJoint) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = activeJointColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  // 3. Draw Angle Indicator Badge
  const angleToDisplay =
    typeof currentPrimaryAngle === 'number' && !isNaN(currentPrimaryAngle)
      ? currentPrimaryAngle
      : currentKneeAngle;

  if (showAngleBadges && typeof angleToDisplay === 'number' && !isNaN(angleToDisplay)) {
    // Find best anchor landmark among highlighted joints or knees
    let anchorLm: NormalizedLandmark | null = null;

    if (highlightJoints && highlightJoints.length > 0) {
      for (const idx of highlightJoints) {
        if (landmarks[idx] && isLandmarkVisible(landmarks[idx], 0.5)) {
          anchorLm = landmarks[idx];
          break;
        }
      }
    }

    if (!anchorLm) {
      const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
      anchorLm = isLandmarkVisible(leftKnee, 0.5) ? leftKnee : rightKnee;
    }

    if (anchorLm && isLandmarkVisible(anchorLm, 0.45)) {
      const { x, y } = getCanvasCoords(anchorLm);
      const badgeText = `${Math.round(angleToDisplay)}°${primaryAngleLabel ? ` ${primaryAngleLabel}` : ''}`;

      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const textWidth = textMetrics.width;
      const badgeWidth = textWidth + 16;
      const badgeHeight = 24;

      const badgeX = x + 12;
      const badgeY = y - 12;

      // Draw rounded background badge
      ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
      ctx.strokeStyle = activeJointColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    }
  }
}
