import { NormalizedLandmark, SquatState } from '../types/pose';
import { POSE_LANDMARKS, isLandmarkVisible } from './math';

interface SkeletonDrawOptions {
  mirrored?: boolean;
  showAngleBadges?: boolean;
  currentKneeAngle?: number;
  squatState?: SquatState;
}

// Landmark connection pairs: [startIdx, endIdx]
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

// Highlight connections for squats (legs and hips)
const SQUAT_CONNECTIONS = new Set([
  '23-25', '25-27', '24-26', '26-28', '23-24'
]);

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
    squatState = 'READY'
  } = options;

  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  // Determine active color scheme based on squat state
  let activeJointColor = '#00f59b'; // Electric neon green
  let activeBoneColor = 'rgba(0, 245, 155, 0.7)';

  if (squatState === 'DESCENDING') {
    activeJointColor = '#fbbf24'; // Amber
    activeBoneColor = 'rgba(251, 191, 36, 0.7)';
  } else if (squatState === 'BOTTOM') {
    activeJointColor = '#38bdf8'; // Sky blue (depth reached)
    activeBoneColor = 'rgba(56, 189, 248, 0.8)';
  } else if (squatState === 'ASCENDING') {
    activeJointColor = '#34d399'; // Emerald
    activeBoneColor = 'rgba(52, 211, 153, 0.75)';
  }

  const defaultBoneColor = 'rgba(255, 255, 255, 0.35)';
  const defaultJointColor = '#ffffff';

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

    const connectionKey = `${startIdx}-${endIdx}`;
    const isSquatBone = SQUAT_CONNECTIONS.has(connectionKey);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = isSquatBone ? 5 : 2.5;
    ctx.strokeStyle = isSquatBone ? activeBoneColor : defaultBoneColor;
    ctx.stroke();
  }

  // 2. Draw landmarks (nodes)
  const importantIndices = [
    POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE,
  ];

  for (const idx of importantIndices) {
    const lm = landmarks[idx];
    if (!isLandmarkVisible(lm, 0.45)) continue;

    const { x, y } = getCanvasCoords(lm);
    const isKnee = idx === POSE_LANDMARKS.LEFT_KNEE || idx === POSE_LANDMARKS.RIGHT_KNEE;
    const isHip = idx === POSE_LANDMARKS.LEFT_HIP || idx === POSE_LANDMARKS.RIGHT_HIP;

    ctx.beginPath();
    const radius = isKnee ? 8 : (isHip ? 6 : 4);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = (isKnee || isHip) ? activeJointColor : defaultJointColor;
    ctx.fill();

    // Subtle glow on knees
    if (isKnee) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = activeJointColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 3. Draw Knee Angle Indicator Badge
  if (showAngleBadges && typeof currentKneeAngle === 'number' && !isNaN(currentKneeAngle)) {
    // Pick the most visible knee
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const targetKnee = isLandmarkVisible(leftKnee, 0.5) ? leftKnee : rightKnee;

    if (targetKnee && isLandmarkVisible(targetKnee, 0.5)) {
      const { x, y } = getCanvasCoords(targetKnee);
      const badgeText = `${Math.round(currentKneeAngle)}°`;
      
      ctx.font = 'bold 15px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const textWidth = textMetrics.width;
      const badgeWidth = textWidth + 18;
      const badgeHeight = 26;

      const badgeX = x + 14;
      const badgeY = y - 13;

      // Draw rounded background badge
      ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
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
