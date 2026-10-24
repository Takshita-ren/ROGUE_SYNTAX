export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export type SquatState = 'READY' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface RepRecord {
  rep_number: number;
  duration_seconds: floatNumber;
  min_knee_angle: number;
  completed_at: string;
  feedback: string[];
  side_used: 'left' | 'right' | 'both';
}

type floatNumber = number;

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

export interface WorkoutSessionSummary {
  id?: number;
  session_id: string;
  exercise_type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  valid_reps: number;
  incomplete_attempts: number;
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
}
