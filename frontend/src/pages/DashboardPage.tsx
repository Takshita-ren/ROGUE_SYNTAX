import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Flame,
  Award,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
  RefreshCw,
  Dumbbell,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { StatsSummary, WorkoutSessionSummary } from '../types/pose';
import { StatCard } from '../components/StatCard';
import { ExercisePicker } from '../components/ExercisePicker';
import { EXERCISE_LIST } from '../utils/exerciseConfigs';
import { getUserProfile, getWorkoutPlan } from '../utils/planGenerator';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSessionSummary[]>([]);
  const userProfile = getUserProfile();
  const workoutPlan = getWorkoutPlan();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (exerciseIdFilter?: string) => {
    setIsLoading(true);
    setIsRetrying(true);
    setError(null);
    const activeEx = exerciseIdFilter !== undefined ? exerciseIdFilter : selectedExercise;
    try {
      const filterParam = activeEx !== 'all' ? activeEx : undefined;
      const [statsData, workoutsData] = await Promise.all([
        api.getStatsSummary({ exercise_id: filterParam }),
        api.getWorkouts({ limit: 5, sort_by: 'created_at', order: 'desc', exercise_id: filterParam }),
      ]);
      setStats(statsData);
      setRecentWorkouts(workoutsData);
    } catch (err: unknown) {
      console.error('Failed to load dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedExercise);
  }, [selectedExercise]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-brand-neon animate-spin" />
        <p className="text-sm text-slate-400">Loading your workout analytics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Unable to load dashboard data</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-lg mx-auto">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-white border border-white/10 text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying Connection...' : 'Retry Connection'}</span>
        </button>
      </div>
    );
  }

  const isBrandNew = !stats || stats.total_workouts === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-brand-neon text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Movement Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            Welcome back, Athlete
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            {isBrandNew
              ? 'Ready to test your form? Choose any exercise below to complete your coached workout.'
              : `You have completed ${stats.total_workouts} session${stats.total_workouts > 1 ? 's' : ''} with ${stats.total_reps} total repetitions & hold achievements.`}
          </p>
        </div>

        <div className="relative z-10 sm:self-center">
          <button
            onClick={() => navigate('/workout')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm shadow-neon hover:shadow-neon-strong transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-dark-950" />
            <span>Start Quick Workout</span>
          </button>
        </div>
      </div>

      {/* Personalized Weekly Plan Quick Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-dark-900 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-neon shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500/10 text-brand-neon border border-brand-500/20">
                Personalized Plan
              </span>
              {userProfile && (
                <span className="text-xs text-slate-400 capitalize">
                  {userProfile.fitnessLevel} • {userProfile.mainGoal.replace('_', ' ')}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {workoutPlan
                ? `Weekly Routine: ${workoutPlan.workoutDaysPerWeek} Days / Week Scheduled`
                : 'Build Your Custom Science-Backed Workout Plan'}
            </h3>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-neon hover:text-white border border-brand-500/30 text-xs font-semibold transition-all shrink-0"
        >
          <span>{workoutPlan ? 'Open My Plan' : 'Setup Plan in 60s'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Exercise Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-dark-900 border border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Filter Analytics:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedExercise('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedExercise === 'all'
                ? 'bg-brand-500 text-dark-950 font-bold shadow-neon'
                : 'bg-dark-850 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Exercises
          </button>
          {EXERCISE_LIST.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedExercise === ex.id
                  ? 'bg-brand-500 text-dark-950 font-bold shadow-neon'
                  : 'bg-dark-850 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workouts"
          value={stats?.total_workouts ?? 0}
          subtitle={selectedExercise === 'all' ? 'All completed sessions' : `${selectedExercise} sessions`}
          icon={Dumbbell}
          accentColor="brand"
        />
        <StatCard
          title="Total Reps / Holds"
          value={stats?.total_reps ?? 0}
          subtitle="Validated repetitions"
          icon={Flame}
          accentColor="blue"
        />
        <StatCard
          title="Total Training Time"
          value={formatDuration(stats?.total_duration_seconds ?? 0)}
          subtitle="Active exercise duration"
          icon={Clock}
          accentColor="purple"
        />
        <StatCard
          title="Avg Reps / Session"
          value={stats?.avg_reps_per_workout ?? 0}
          subtitle="Repetition consistency"
          icon={TrendingUp}
          accentColor="amber"
        />
      </div>

      {/* Exercise Catalog Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Exercise Catalog</h2>
            <p className="text-xs text-slate-400">Select any movement to launch camera-based form coaching</p>
          </div>
        </div>
        <ExercisePicker compact />
      </div>

      {/* First-time Onboarding State if empty */}
      {isBrandNew ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-dark-900 border border-white/5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-neon flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Workout Sessions Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Your workout statistics, repetition counts, and biomechanical feedback will automatically show up here as soon as you finish your first session.
          </p>
          <button
            onClick={() => navigate('/workout')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all shadow-neon"
          >
            <Play className="w-4 h-4 fill-dark-950" />
            <span>Start First Workout</span>
          </button>
        </div>
      ) : (
        /* Analytics Grid: Chart + Recent Workouts */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Activity Chart (2 columns) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-900 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Weekly Activity (Past 7 Days)</h3>
                <p className="text-xs text-slate-400">Total squats completed per day</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-neon font-medium bg-brand-500/10 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last 7 Days</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return `${parts[1]}/${parts[2]}`;
                    }}
                  />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d1117',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number | string | undefined) => [`${value ?? 0} reps`, 'Squats']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar
                    dataKey="reps"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latest Session & Quick Info (1 column) */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Latest Workout Session</h3>
              <p className="text-xs text-slate-400 mb-4">Summary of most recent workout</p>

              {stats.latest_workout ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Exercise</span>
                      <span className="font-semibold text-white capitalize">
                        {stats.latest_workout.exercise_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Completed At</span>
                      <span className="text-slate-200">
                        {formatDate(stats.latest_workout.created_at || stats.latest_workout.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Duration</span>
                      <span className="text-slate-200">
                        {formatDuration(stats.latest_workout.duration_seconds)}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-300">Valid Reps</span>
                      <span className="text-2xl font-black text-brand-neon">
                        {stats.latest_workout.valid_reps}
                      </span>
                    </div>
                  </div>

                  {stats.latest_workout.feedback_summary && stats.latest_workout.feedback_summary.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Common Cues Received
                      </h4>
                      <div className="space-y-1.5">
                        {stats.latest_workout.feedback_summary.slice(0, 3).map((f, i) => (
                          <div key={i} className="text-xs p-2 rounded-lg bg-dark-850 text-slate-300 flex justify-between">
                            <span className="truncate pr-2">{f.message}</span>
                            <span className="text-slate-400 font-mono">x{f.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No workout records available.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => navigate('/history')}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-neon hover:text-brand-400 py-2 transition-colors"
              >
                <span>View Full Workout History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Workouts List */}
      {!isBrandNew && recentWorkouts.length > 0 && (
        <div className="p-6 rounded-2xl bg-dark-900 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Sessions</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-brand-neon hover:underline flex items-center gap-1"
            >
              <span>See all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-dark-850 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Exercise</th>
                  <th className="px-4 py-3">Reps</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentWorkouts.map((w) => (
                  <tr key={w.session_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {formatDate(w.start_time)}
                    </td>
                    <td className="px-4 py-3 capitalize">{w.exercise_type}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-neon">{w.valid_reps}</span>
                      {w.incomplete_attempts > 0 && (
                        <span className="text-xs text-slate-500 ml-1.5">
                          ({w.incomplete_attempts} shallow)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatDuration(w.duration_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-neon border border-brand-500/20">
                        Saved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
