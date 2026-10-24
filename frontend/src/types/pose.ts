export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export type SquatState = 'READY' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';
export type MovementPhase = 'READY' | 'DOWN' | 'BOTTOM' | 'UP' | 'HOLDING' | 'FORM_BREAK';

export type ExerciseCategory = 'legs' | 'push' | 'pull' | 'core' | 'full-body';
export type ExerciseMode = 'reps' | 'hold';
export type AngleSide = 'left' | 'right' | 'both' | 'best-visible';
export type FormCheckEvaluation = 'ok' | 'warn' | 'fail';

export interface TrackedAngleConfig {
  name: string;
  label?: string;
  jointA: number;
  jointB: number; // vertex
  jointC: number;
  side: AngleSide;
}

export interface PhaseThresholds {
  startThreshold: number;
  bottomThreshold: number;
  lockoutThreshold: number;
  minRepDurationMs: number;
  maxRepDurationMs?: number;
}

export interface FormCheckConfig {
  id: string;
  description: string;
  evaluate: (landmarks: NormalizedLandmark[], angles: Record<string, number>) => FormCheckEvaluation;
  cueText: string;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  category: ExerciseCategory;
  mode: ExerciseMode;
  camera: {
    recommendedView: 'front' | 'side';
    setupTip: string;
  };
  trackedAngles: TrackedAngleConfig[];
  primaryAngle: string;
  phases: PhaseThresholds;
  direction: 'decreasing' | 'increasing';
  formChecks: FormCheckConfig[];
  partialRepMessage: string;
  requiredLandmarks?: number[];
  highlightJoints?: number[];
  highlightBones?: [number, number][];
  defaultTargetReps?: number;
  defaultTargetHoldSeconds?: number;
}

export interface RepRecord {
  rep_number: number;
  duration_seconds: number;
  min_knee_angle: number;
  completed_at: string;
  feedback: string[];
  side_used: 'left' | 'right' | 'both';
}

export interface SquatFeedbackMessage {
  text: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

export interface SquatAnalysisFrame {
  state: SquatState;
  kneeAngle: number;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  torsoAngle: number | null;
  sideUsed: 'left' | 'right' | 'both' | 'none';
  validReps: number;
  incompleteAttempts: number;
  feedback: string[];
  confidence: number;
  isPositionedWell: boolean;
  minKneeAngleInRep: number;
}

export interface ExerciseAnalysisFrame {
  state: string;
  primaryAngle: number;
  angles: Record<string, number>;
  sideUsed: 'left' | 'right' | 'both' | 'none';
  validReps: number;
  incompleteAttempts: number;
  holdSeconds: number;
  feedback: string[];
  confidence: number;
  isPositionedWell: boolean;
  minPeakAngleInRep: number;
  isPausedLowVisibility: boolean;
  activeCues: string[];
}

export interface WorkoutSessionSummary {
  id?: number;
  session_id: string;
  exercise_type: string;
  exercise_id?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  valid_reps: number;
  incomplete_attempts: number;
  reps?: number;
  hold_seconds?: number;
  feedback_summary: { message: string; count: number }[];
  rep_data: RepRecord[];
  created_at?: string;
}

export interface DayActivity {
  date: string;
  reps: number;
  workouts: number;
  duration_seconds: number;
}

export interface StatsSummary {
  total_workouts: number;
  total_reps: number;
  total_duration_seconds: number;
  avg_reps_per_workout: number;
  total_incomplete_attempts: number;
  weekly_activity: DayActivity[];
  latest_workout: WorkoutSessionSummary | null;
  exercise_stats?: Record<string, { workouts: number; reps: number; duration_seconds: number }>;
}

