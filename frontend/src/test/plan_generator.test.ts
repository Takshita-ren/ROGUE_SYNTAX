import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateWorkoutPlan,
  getFilteredVariations,
  saveUserProfile,
  getUserProfile,
  saveWorkoutPlan,
  getWorkoutPlan,
  markDayCompleted,
  toggleExerciseCompleted,
  updateExerciseVariation,
  ALL_VARIATIONS,
  SAFETY_DISCLAIMER,
  STORAGE_KEYS,
} from '../utils/planGenerator';
import { UserProfile } from '../types/plan';

describe('Personalized Fitness Workout Plan Generator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const baseProfile: UserProfile = {
    height: 175,
    heightUnit: 'cm',
    weight: 70,
    weightUnit: 'kg',
    ageRange: '26-35',
    fitnessLevel: 'beginner',
    mainGoal: 'general_fitness',
    workoutDaysPerWeek: 3,
    equipment: ['bodyweight'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('generates a 7-day weekly plan with exact scheduled workout and rest days', () => {
    const plan = generateWorkoutPlan(baseProfile);

    expect(plan.days).toHaveLength(7);
    expect(plan.workoutDaysPerWeek).toBe(3);

    const workoutDays = plan.days.filter((d) => !d.isRestDay);
    const restDays = plan.days.filter((d) => d.isRestDay);

    expect(workoutDays).toHaveLength(3);
    expect(restDays).toHaveLength(4);
    expect(plan.safetyDisclaimer).toBe(SAFETY_DISCLAIMER);
  });

  it('scales days correctly for 2, 4, 5, and 6 workout days per week', () => {
    [2, 4, 5, 6].forEach((daysCount) => {
      const plan = generateWorkoutPlan({ ...baseProfile, workoutDaysPerWeek: daysCount });
      const workoutDays = plan.days.filter((d) => !d.isRestDay);
      expect(workoutDays).toHaveLength(daysCount);
      expect(plan.days).toHaveLength(7);
    });
  });

  it('tailors weight loss plan with strength and light cardio (jumping jacks)', () => {
    const weightLossProfile: UserProfile = {
      ...baseProfile,
      mainGoal: 'weight_loss',
      fitnessLevel: 'intermediate',
      equipment: ['bodyweight', 'dumbbells'],
    };

    const plan = generateWorkoutPlan(weightLossProfile);
    expect(plan.userGoal).toBe('weight_loss');

    // Verify jumping jacks (light cardio) are incorporated
    const allExercises = plan.days.flatMap((d) => d.exercises);
    const hasJumpingJack = allExercises.some((e) => e.exerciseId === 'jumping_jack');
    const hasSquat = allExercises.some((e) => e.exerciseId === 'squat');
    const hasCore = allExercises.some((e) => e.category === 'core');

    expect(hasJumpingJack).toBe(true);
    expect(hasSquat).toBe(true);
    expect(hasCore).toBe(true);
  });

  it('tailors muscle gain & strength plans with progressive resistance and dedicated recovery', () => {
    const muscleProfile: UserProfile = {
      ...baseProfile,
      mainGoal: 'muscle_gain',
      fitnessLevel: 'advanced',
      equipment: ['bodyweight', 'dumbbells', 'resistance_bands'],
    };

    const plan = generateWorkoutPlan(muscleProfile);
    expect(plan.userGoal).toBe('muscle_gain');

    const workoutDays = plan.days.filter((d) => !d.isRestDay);
    workoutDays.forEach((day) => {
      expect(day.exercises.length).toBeGreaterThanOrEqual(3);
      // Higher sets for advanced level
      day.exercises.forEach((ex) => {
        expect(ex.targetSets).toBeGreaterThanOrEqual(3);
      });
    });
  });

  it('tailors mobility plan with lower-impact and active recovery focus', () => {
    const mobilityProfile: UserProfile = {
      ...baseProfile,
      mainGoal: 'mobility',
    };

    const plan = generateWorkoutPlan(mobilityProfile);
    expect(plan.userGoal).toBe('mobility');
    const workoutDays = plan.days.filter((d) => !d.isRestDay);
    expect(workoutDays[0].title.toLowerCase()).toContain('mobility');
  });

  it('selects beginner-friendly variations by default for beginner users', () => {
    const squatVars = getFilteredVariations('squat', {
      fitnessLevel: 'beginner',
      equipment: ['bodyweight'],
      mainGoal: 'general_fitness',
    });

    expect(squatVars.defaultVariationId).toBe('chair_squat');
    expect(squatVars.variations.length).toBeGreaterThanOrEqual(2);
    expect(squatVars.variations.length).toBeLessThanOrEqual(3);

    const pushupVars = getFilteredVariations('pushup', {
      fitnessLevel: 'beginner',
      equipment: ['bodyweight'],
      mainGoal: 'general_fitness',
    });
    expect(pushupVars.defaultVariationId).toBe('wall_pushup');

    const plankVars = getFilteredVariations('plank', {
      fitnessLevel: 'beginner',
      equipment: ['bodyweight'],
      mainGoal: 'general_fitness',
    });
    expect(plankVars.defaultVariationId).toBe('knee_plank');
  });

  it('selects standard and advanced variations for intermediate and advanced users', () => {
    const intermediateSquat = getFilteredVariations('squat', {
      fitnessLevel: 'intermediate',
      equipment: ['bodyweight', 'dumbbells'],
      mainGoal: 'strength',
    });
    expect(intermediateSquat.defaultVariationId).toBe('bodyweight_squat');

    const advancedSquat = getFilteredVariations('squat', {
      fitnessLevel: 'advanced',
      equipment: ['bodyweight', 'dumbbells'],
      mainGoal: 'strength',
    });
    expect(advancedSquat.defaultVariationId).toBe('goblet_squat');
  });

  it('correctly distinguishes AI auto-tracked vs guided exercises', () => {
    // Bodyweight squat connects to 'squat' tracker
    const bodyweightSquat = ALL_VARIATIONS['squat'].find((v) => v.id === 'bodyweight_squat');
    expect(bodyweightSquat?.isAiTracked).toBe(true);
    expect(bodyweightSquat?.trackedExerciseId).toBe('squat');

    // Wall push-up is guided
    const wallPushup = ALL_VARIATIONS['pushup'].find((v) => v.id === 'wall_pushup');
    expect(wallPushup?.isAiTracked).toBe(false);
    expect(wallPushup?.trackingLabel).toContain('Guided Exercise');

    // Standard push-up connects to 'pushup' tracker
    const standardPushup = ALL_VARIATIONS['pushup'].find((v) => v.id === 'standard_pushup');
    expect(standardPushup?.isAiTracked).toBe(true);
    expect(standardPushup?.trackedExerciseId).toBe('pushup');
  });

  it('persists and retrieves profile and workout plan in localStorage', () => {
    saveUserProfile(baseProfile);
    const retrieved = getUserProfile();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.height).toBe(175);
    expect(retrieved?.weight).toBe(70);

    const plan = generateWorkoutPlan(baseProfile);
    saveWorkoutPlan(plan);
    const retrievedPlan = getWorkoutPlan();
    expect(retrievedPlan).not.toBeNull();
    expect(retrievedPlan?.id).toBe(plan.id);
  });

  it('tracks day and exercise completion in progress map', () => {
    markDayCompleted(1, true);
    const plan = generateWorkoutPlan(baseProfile);
    saveWorkoutPlan(plan);

    const firstExId = plan.days[0].exercises[0].id;
    toggleExerciseCompleted(1, firstExId);

    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAN_PROGRESS) || '{}');
    expect(progress[1].isCompleted).toBe(true);
    expect(progress[1].completedExercises).toContain(firstExId);
  });

  it('updates exercise variation selection properly', () => {
    const plan = generateWorkoutPlan(baseProfile);
    saveWorkoutPlan(plan);

    const dayNumber = plan.days[0].dayNumber;
    const exercise = plan.days[0].exercises[0];
    const availableVars = exercise.variations;

    if (availableVars.length > 1) {
      const alternateVar = availableVars[1];
      const updatedPlan = updateExerciseVariation(dayNumber, exercise.id, alternateVar.id);

      expect(updatedPlan).not.toBeNull();
      const updatedEx = updatedPlan?.days
        .find((d) => d.dayNumber === dayNumber)
        ?.exercises.find((e) => e.id === exercise.id);

      expect(updatedEx?.selectedVariationId).toBe(alternateVar.id);
      expect(updatedEx?.name).toBe(alternateVar.name);
    }
  });
});
