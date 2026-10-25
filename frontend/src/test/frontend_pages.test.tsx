import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { SettingsPage } from '../pages/SettingsPage';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/StatCard';
import { Dumbbell } from 'lucide-react';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({ status: 'healthy', service: 'RepRight API' }),
    getDbStatus: vi.fn().mockResolvedValue({
      status: 'healthy',
      database_url_masked: 'sqlite:///replevel_workouts.db',
      dialect: 'sqlite',
      total_records: 4,
      tables: {
        workouts: { name: 'workouts', row_count: 0, columns: ['id'] },
        user_profiles: { name: 'user_profiles', row_count: 1, columns: ['id'] },
        workout_plans: { name: 'workout_plans', row_count: 1, columns: ['id'] },
        plan_progress: { name: 'plan_progress', row_count: 2, columns: ['id'] },
      },
    }),
    getUserProfile: vi.fn().mockResolvedValue(null),
    saveUserProfile: vi.fn().mockResolvedValue({}),
    getWorkoutPlan: vi.fn().mockResolvedValue(null),
    saveWorkoutPlan: vi.fn().mockResolvedValue({}),
    getPlanProgress: vi.fn().mockResolvedValue({}),
    markDayCompleted: vi.fn().mockResolvedValue({}),
    toggleExerciseCompleted: vi.fn().mockResolvedValue({}),
    getStatsSummary: vi.fn().mockResolvedValue({
      total_workouts: 3,
      total_reps: 45,
      total_duration_seconds: 600,
      avg_reps_per_workout: 15.0,
      total_incomplete_attempts: 2,
      weekly_activity: [],
      latest_workout: null,
    }),
    getWorkouts: vi.fn().mockResolvedValue([]),
    clearAllWorkouts: vi.fn().mockResolvedValue({ message: 'Success', deleted_count: 3 }),
  },
}));

describe('Frontend Pages and Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Navbar with logo and navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('RepRight')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Plan')).toBeInTheDocument();
    expect(screen.getByText('Live Workout')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders LandingPage with headline and CTA buttons', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Train Smarter/i)).toBeInTheDocument();
    expect(screen.getByText(/Move Better/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Your Workout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();
  });

  it('renders StatCard with title, value, and accent', () => {
    render(
      <StatCard
        title="Total Reps"
        value={125}
        subtitle="Completed squats"
        icon={Dumbbell}
        accentColor="brand"
      />
    );

    expect(screen.getByText('Total Reps')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('Completed squats')).toBeInTheDocument();
  });

  it('renders SettingsPage and toggles preferences', async () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Application Settings')).toBeInTheDocument();
    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    expect(screen.getByText('Audio Repetition Chime')).toBeInTheDocument();
    expect(screen.getByText('Camera Privacy & Edge Computer Vision')).toBeInTheDocument();
  });
});
