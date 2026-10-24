export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'strength'
  | 'general_fitness'
  | 'mobility';

export type EquipmentOption =
  | 'bodyweight'
  | 'dumbbells'
  | 'resistance_bands'
  | 'gym_equipment';

export type AgeRange =
  | '<18'
  | '18-25'
  | '26-35'
  | '36-50'
  | '50+'
  | 'prefer_not_to_say';

export interface UserProfile {
  height: number; // Stored in centimeters
  heightUnit: 'cm' | 'ft_in';
  heightFt?: number;
  heightIn?: number;
  weight: number; // Stored in kilograms
  weightUnit: 'kg' | 'lbs';
  ageRange?: AgeRange;
  fitnessLevel: FitnessLevel;
  mainGoal: FitnessGoal;
  workoutDaysPerWeek: number; // 2 to 6
  equipment: EquipmentOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseVariation {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  instruction: string;
  recommendedSetsReps: string;
  isAiTracked: boolean;
  trackedExerciseId?: string; // Links to existing configs: 'squat', 'pushup', 'lunge', 'bicep_curl', 'shoulder_press', 'situp', 'jumping_jack', 'plank'
  trackingLabel: string; // e.g. "AI Auto-Tracked (Squat Engine)" or "Guided Exercise (Timer & Audio Cues)"
  illustrationKey: string;
}

export interface PlanExercise {
  id: string;
  exerciseId: string; // Reference to base exercise or category
  name: string;
  category: 'legs' | 'push' | 'pull' | 'core' | 'full-body' | 'mobility';
  targetSets: number;
  targetRepsOrDuration: string;
  restGuidance: string;
  selectedVariationId: string;
  variations: ExerciseVariation[];
  notes?: string;
}

export interface PlanDay {
  dayNumber: number; // 1 to 7
  dayName: string; // e.g., "Day 1 - Monday"
  title: string; // e.g., "Full-Body Strength & Core"
  focus: string; // Short explanation of the day's focus
  isRestDay: boolean;
  recoveryTip?: string;
  exercises: PlanExercise[];
}

export interface WeeklyWorkoutPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  userGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  workoutDaysPerWeek: number;
  equipment: EquipmentOption[];
  days: PlanDay[];
  weeklyGuidance: string;
  safetyDisclaimer: string;
}

export interface DayProgress {
  isCompleted: boolean;
  completedAt?: string;
  completedExercises?: string[]; // IDs of exercises checked off
}

export type PlanProgressMap = Record<number, DayProgress>; // Key is dayNumber (1-7)
