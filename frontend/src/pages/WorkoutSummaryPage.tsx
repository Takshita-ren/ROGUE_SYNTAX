import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { WorkoutSessionSummary } from '../types/pose';
import { StatCard } from '../components/StatCard';

export const WorkoutSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<WorkoutSessionSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve summary stored from WorkoutPage
    const savedData = sessionStorage.getItem('current_workout_summary');
    if (!savedData) {
      // If no session data, navigate back to dashboard
      navigate('/dashboard');
      return;
    }

    try {
      const parsed: WorkoutSessionSummary = JSON.parse(savedData);
      setSummary(parsed);
      persistSession(parsed);
    } catch {
      navigate('/dashboard');
    }
  }, [navigate]);

  const persistSession = async (session: WorkoutSessionSummary) => {
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      await api.saveWorkout(session);
      setSaveStatus('saved');
    } catch (err: unknown) {
      console.error('Failed to persist workout session to backend:', err);
      setSaveStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Database persistence failed. Backend may be offline.'
      );
    }
  };

  const handleRetrySave = () => {
    if (summary) {
      persistSession(summary);
    }
  };

  if (!summary) {
    return null;
  }

  const formatDuration = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    if (mins === 0) return `${secs} seconds`;
    return `${mins} min ${secs} sec`;
  };

  // Calculate average rep duration
  const avgRepDuration =
    summary.rep_data.length > 0
      ? (
          summary.rep_data.reduce((acc, r) => acc + r.duration_seconds, 0) /
          summary.rep_data.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-neon text-xs font-semibold">
          <Award className="w-4 h-4" />
          <span>Session Completed</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Workout Summary</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Here is your measured biomechanical breakdown for this session.
        </p>
      </div>

      {/* Save Status Notification Banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900 border border-white/5">
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-5 h-5 text-brand-neon animate-spin" />
              <span className="text-sm font-medium text-slate-300">
                Saving workout session to SQLite database...
              </span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-brand-neon" />
              <span className="text-sm font-medium text-brand-neon">
                Workout session safely recorded and persisted to backend.
              </span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">
                Failed to save: {errorMessage}
              </span>
            </>
          )}
        </div>

        {saveStatus === 'error' && (
          <button
            onClick={handleRetrySave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Save</span>
          </button>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Valid Repetitions"
          value={summary.valid_reps}
          subtitle="Full depth squats"
          icon={Flame}
          accentColor="brand"
        />
        <StatCard
          title="Workout Duration"
          value={formatDuration(summary.duration_seconds)}
          subtitle="Total elapsed time"
          icon={Clock}
          accentColor="blue"
        />
        <StatCard
          title="Avg Rep Speed"
          value={`${avgRepDuration}s`}
          subtitle="Average descent & drive"
          icon={Award}
          accentColor="purple"
        />
      </div>

      {/* Incomplete / Shallow Reps Alert if any */}
      {summary.incomplete_attempts > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-amber-300">
              {summary.incomplete_attempts} Shallow Attempt
              {summary.incomplete_attempts > 1 ? 's' : ''} Detected
            </span>
            <p className="text-slate-400 text-xs mt-0.5">
              These movements reversed before hitting full parallel depth (knee angle ≤ 102°).
              Focus on driving your hips deeper on each repetition.
            </p>
          </div>
        </div>
      )}

      {/* Form Feedback Summary Breakdown */}
      {summary.feedback_summary && summary.feedback_summary.length > 0 && (
        <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white">Technique Coaching Notes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.feedback_summary.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 font-medium">{item.message}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-slate-400 font-bold">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repetition-by-Repetition Breakdown Table */}
      {summary.rep_data && summary.rep_data.length > 0 && (
        <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white">Repetition Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-dark-850 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-2.5 rounded-l-lg">Rep #</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Lowest Knee Angle</th>
                  <th className="px-4 py-2.5">Tracking Side</th>
                  <th className="px-4 py-2.5 rounded-r-lg">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {summary.rep_data.map((rep) => (
                  <tr key={rep.rep_number} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-bold text-brand-neon">#{rep.rep_number}</td>
                    <td className="px-4 py-2.5">{rep.duration_seconds}s</td>
                    <td className="px-4 py-2.5 text-white font-bold">{rep.min_knee_angle}°</td>
                    <td className="px-4 py-2.5 capitalize text-slate-400">{rep.side_used}</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">
                      {rep.feedback?.join(', ') || 'Good repetition'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => navigate('/workout')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all shadow-neon"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start Another Workout</span>
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-200 border border-white/10 font-bold text-sm transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-200 border border-white/10 font-bold text-sm transition-all"
        >
          <span>View History</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
