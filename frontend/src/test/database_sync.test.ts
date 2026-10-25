import { describe, it, expect } from 'vitest';
import {
  profileToBackend,
  profileFromBackend,
  planToBackend,
  planFromBackend,
  progressFromBackend,
} from '../services/api';
import { UserProfile, WeeklyWorkoutPlan } from '../types/plan';

describe('Database Serializers & API Client Transformers', () => {
  const mockProfile: UserProfile = {
    height: 180,
    heightUnit: 'cm',
    weight: 75,
    weightUnit: 'kg',
    ageRange: '26-35',
    fitnessLevel: 'intermediate',
    mainGoal: 'muscle_gain',
    workoutDaysPerWeek: 4,
    equipment: ['bodyweight', 'dumbbells'],
    createdAt: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-25T08:00:00Z',
  };

  it('converts frontend UserProfile to backend snake_case model', () => {
    const payload = profileToBackend(mockProfile, 'user_123');
    expect(payload.user_id).toBe('user_123');
    expect(payload.height).toBe(180);
    expect(payload.height_unit).toBe('cm');
    expect(payload.weight).toBe(75);
    expect(payload.weight_unit).toBe('kg');
    expect(payload.fitness_level).toBe('intermediate');
    expect(payload.main_goal).toBe('muscle_gain');
    expect(payload.workout_days_per_week).toBe(4);
    expect(payload.equipment).toEqual(['bodyweight', 'dumbbells']);
  });

  it('converts backend UserProfileResponse to frontend camelCase model', () => {
    const backendData = {
      id: 1,
      user_id: 'user_123',
      height: 180.0,
      height_unit: 'cm',
      weight: 75.0,
      weight_unit: 'kg',
      age_range: '26-35',
      fitness_level: 'intermediate',
      main_goal: 'muscle_gain',
      workout_days_per_week: 4,
      equipment: ['bodyweight', 'dumbbells'],
      created_at: '2026-10-25T08:00:00Z',
      updated_at: '2026-10-25T08:00:00Z',
    };

    const profile = profileFromBackend(backendData);
    expect(profile.height).toBe(180);
    expect(profile.heightUnit).toBe('cm');
    expect(profile.weight).toBe(75);
    expect(profile.weightUnit).toBe('kg');
    expect(profile.fitnessLevel).toBe('intermediate');
    expect(profile.mainGoal).toBe('muscle_gain');
    expect(profile.workoutDaysPerWeek).toBe(4);
  });

  it('converts WeeklyWorkoutPlan to backend WorkoutPlanCreate payload', () => {
    const mockPlan: WeeklyWorkoutPlan = {
      id: 'plan_abc',
      createdAt: '2026-10-25T08:00:00Z',
      updatedAt: '2026-10-25T08:00:00Z',
      userGoal: 'strength',
      fitnessLevel: 'advanced',
      workoutDaysPerWeek: 5,
      equipment: ['gym_equipment'],
      days: [],
      weeklyGuidance: 'Focus on progressive overload.',
      safetyDisclaimer: 'Warm up thoroughly.',
    };

    const payload = planToBackend(mockPlan, 'user_abc');
    expect(payload.plan_id).toBe('plan_abc');
    expect(payload.user_id).toBe('user_abc');
    expect(payload.user_goal).toBe('strength');
    expect(payload.fitness_level).toBe('advanced');
    expect(payload.workout_days_per_week).toBe(5);
    expect(payload.weekly_guidance).toBe('Focus on progressive overload.');
  });

  it('converts backend PlanProgressResponse to frontend progress map', () => {
    const backendRes = {
      progress: {
        '1': {
          day_number: 1,
          is_completed: true,
          completed_at: '2026-10-25T08:30:00Z',
          completed_exercises: ['squat_1', 'pushup_1'],
        },
        '2': {
          day_number: 2,
          is_completed: false,
          completed_at: null,
          completed_exercises: [],
        },
      },
    };

    const progressMap = progressFromBackend(backendRes);
    expect(progressMap[1].isCompleted).toBe(true);
    expect(progressMap[1].completedExercises).toEqual(['squat_1', 'pushup_1']);
    expect(progressMap[2].isCompleted).toBe(false);
  });
});
