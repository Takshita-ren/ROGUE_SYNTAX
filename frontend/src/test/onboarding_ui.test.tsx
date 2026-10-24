import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingModal } from '../components/OnboardingModal';
import { ExerciseVariationsModal } from '../components/ExerciseVariationsModal';
import { GuidedWorkoutModal } from '../components/GuidedWorkoutModal';
import { MyPlanPage } from '../pages/MyPlanPage';
import { PlanExercise, ExerciseVariation, UserProfile } from '../types/plan';
import { ALL_VARIATIONS } from '../utils/planGenerator';

describe('Personalized Onboarding & Workout Plan UI Components', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockExercise: PlanExercise = {
    id: 'squat_test_1',
    exerciseId: 'squat',
    name: 'Chair Squat',
    category: 'legs',
    targetSets: 3,
    targetRepsOrDuration: '3 sets × 8–10 reps',
    restGuidance: 'Rest 60s between sets',
    selectedVariationId: 'chair_squat',
    variations: ALL_VARIATIONS['squat'],
  };

  it('renders OnboardingModal with all required fields', () => {
    render(
      <OnboardingModal
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText(/Welcome to RepRight/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Body Metrics & Age Range/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Fitness Level/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Main Fitness Goal/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Workout Days Per Week/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Available Equipment/i)).toBeInTheDocument();

    // Verify fitness levels
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();

    // Verify goals
    expect(screen.getByText('Weight Loss')).toBeInTheDocument();
    expect(screen.getByText('Muscle Gain')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('General Fitness')).toBeInTheDocument();
    expect(screen.getByText('Mobility')).toBeInTheDocument();
  });

  it('validates height and weight before submission in OnboardingModal', () => {
    const handleComplete = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={vi.fn()}
        onComplete={handleComplete}
      />
    );

    // Enter invalid height
    const heightInput = screen.getByLabelText(/Height/i);
    fireEvent.change(heightInput, { target: { value: '50' } });

    // Enter invalid weight
    const weightInput = screen.getByLabelText(/Current Weight/i);
    fireEvent.change(weightInput, { target: { value: '15' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Generate My Workout Plan/i });
    fireEvent.click(submitBtn);

    // Validation errors should appear
    expect(screen.getByText(/Please enter a valid height between 90 cm and 250 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter a valid weight between 30 kg and 300 kg/i)).toBeInTheDocument();
    expect(handleComplete).not.toHaveBeenCalled();
  });

  it('successfully submits valid profile and triggers onComplete', () => {
    const handleComplete = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={vi.fn()}
        onComplete={handleComplete}
      />
    );

    const heightInput = screen.getByLabelText(/Height/i);
    fireEvent.change(heightInput, { target: { value: '180' } });

    const weightInput = screen.getByLabelText(/Current Weight/i);
    fireEvent.change(weightInput, { target: { value: '75' } });

    const submitBtn = screen.getByRole('button', { name: /Generate My Workout Plan/i });
    fireEvent.click(submitBtn);

    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('repright_user_profile')).not.toBeNull();
    expect(localStorage.getItem('repright_workout_plan')).not.toBeNull();
  });

  it('renders ExerciseVariationsModal with 2-3 variations, instructions, and equipment', () => {
    const handleSelectVariation = vi.fn();
    const handleStartWorkout = vi.fn();

    render(
      <ExerciseVariationsModal
        isOpen={true}
        onClose={vi.fn()}
        exercise={mockExercise}
        dayNumber={1}
        onSelectVariation={handleSelectVariation}
        onStartWorkout={handleStartWorkout}
      />
    );

    expect(screen.getByText(/Variations for Chair Squat/i)).toBeInTheDocument();
    expect(screen.getByText('Chair Squat')).toBeInTheDocument();
    expect(screen.getByText('Bodyweight Squat')).toBeInTheDocument();
    expect(screen.getByText('Goblet Squat')).toBeInTheDocument();

    // Verify variation selection button
    const selectButtons = screen.getAllByRole('button', { name: /Select this Variation|Selected for Plan/i });
    expect(selectButtons.length).toBeGreaterThanOrEqual(3);

    fireEvent.click(selectButtons[1]);
    expect(handleSelectVariation).toHaveBeenCalledWith('bodyweight_squat');
  });

  it('renders GuidedWorkoutModal with set tracker and timer controls', () => {
    const mockVariation = mockExercise.variations[0];
    const handleCompleteEx = vi.fn();

    render(
      <GuidedWorkoutModal
        isOpen={true}
        onClose={vi.fn()}
        exercise={mockExercise}
        variation={mockVariation}
        onCompleteExercise={handleCompleteEx}
      />
    );

    expect(screen.getByText(/Guided Exercise Session/i)).toBeInTheDocument();
    expect(screen.getByText('Chair Squat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Set Timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Set 1/i })).toBeInTheDocument();
  });

  it('renders MyPlanPage empty state when no plan exists and allows opening setup', () => {
    render(
      <BrowserRouter>
        <MyPlanPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Create Your Personalized Workout Plan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build My Personalized Plan/i })).toBeInTheDocument();
  });

  it('renders populated MyPlanPage with weekly schedule, exercises, and safety disclaimer', () => {
    const testProfile: UserProfile = {
      height: 175,
      heightUnit: 'cm',
      weight: 70,
      weightUnit: 'kg',
      ageRange: '26-35',
      fitnessLevel: 'intermediate',
      mainGoal: 'weight_loss',
      workoutDaysPerWeek: 3,
      equipment: ['bodyweight'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('repright_user_profile', JSON.stringify(testProfile));

    render(
      <BrowserRouter>
        <MyPlanPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Personalized Weekly Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Important Health & Safety Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/Mark Day as Complete/i)).toBeInTheDocument();
  });
});
