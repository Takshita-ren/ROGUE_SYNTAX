import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  Calendar,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Play,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { WorkoutSessionSummary } from '../types/pose';
import { ConfirmModal } from '../components/ConfirmModal';

export const WorkoutHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<'created_at' | 'valid_reps' | 'duration_seconds'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Deletion Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchWorkouts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getWorkouts({
        sort_by: sortBy,
        order: sortOrder,
        limit: 100,
      });
      setWorkouts(data);
    } catch (err: unknown) {
      console.error('Failed to load workouts:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve workout history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [sortBy, sortOrder]);

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await api.deleteWorkout(deleteTargetId);
      setWorkouts((prev) => prev.filter((w: any) => w.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert('Failed to delete workout session');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const toggleSort = (field: 'created_at' | 'valid_reps' | 'duration_seconds') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-neon text-xs font-semibold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Database Records</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Workout History</h1>
          <p className="text-sm text-slate-400">
            {workouts.length} recorded session{workouts.length !== 1 ? 's' : ''} stored in SQLite
          </p>
        </div>

        <button
          onClick={() => navigate('/workout')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm shadow-neon transition-all"
        >
          <Play className="w-4 h-4 fill-dark-950" />
          <span>New Workout</span>
        </button>
      </div>

      {/* Sorting & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-dark-900 border border-white/5 text-xs text-slate-300">
        <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-brand-neon" /> Sort By:
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSort('created_at')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              sortBy === 'created_at'
                ? 'bg-brand-500/10 text-brand-neon border-brand-500/30'
                : 'bg-dark-850 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <span>Date</span>
            {sortBy === 'created_at' && (
              <span className="text-[10px] font-mono">{sortOrder === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>

          <button
            onClick={() => toggleSort('valid_reps')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              sortBy === 'valid_reps'
                ? 'bg-brand-500/10 text-brand-neon border-brand-500/30'
                : 'bg-dark-850 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <span>Repetitions</span>
            {sortBy === 'valid_reps' && (
              <span className="text-[10px] font-mono">{sortOrder === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>

          <button
            onClick={() => toggleSort('duration_seconds')}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              sortBy === 'duration_seconds'
                ? 'bg-brand-500/10 text-brand-neon border-brand-500/30'
                : 'bg-dark-850 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <span>Duration</span>
            {sortBy === 'duration_seconds' && (
              <span className="text-[10px] font-mono">{sortOrder === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-neon animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading workout history...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-1">Failed to load history</h3>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-white text-xs font-semibold border border-white/10 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : workouts.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-dark-900 border border-white/5 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-neon flex items-center justify-center mx-auto">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Workout History Yet</h3>
          <p className="text-xs text-slate-400">
            Start a live camera squat workout to automatically record and track your sessions here.
          </p>
          <button
            onClick={() => navigate('/workout')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm shadow-neon"
          >
            <Play className="w-4 h-4 fill-dark-950" />
            <span>Start Workout</span>
          </button>
        </div>
      ) : (
        /* Workout Sessions List */
        <div className="space-y-4">
          {workouts.map((workout: any) => {
            const isExpanded = expandedId === workout.id;
            return (
              <div
                key={workout.id}
                className="rounded-2xl bg-dark-900 border border-white/5 overflow-hidden transition-all duration-200 hover:border-white/10"
              >
                {/* Main Card Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-neon flex items-center justify-center font-black text-lg">
                      {workout.valid_reps}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white capitalize">
                          {workout.exercise_type} Session
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                          ID: #{workout.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(workout.start_time || workout.created_at)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDuration(workout.duration_seconds)}
                        </span>
                        {workout.incomplete_attempts > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">
                              {workout.incomplete_attempts} shallow
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                      className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-white/5 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setDeleteTargetId(workout.id)}
                      className="p-2 rounded-lg bg-dark-850 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors"
                      title="Delete workout record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-5 border-t border-white/5 bg-dark-850/50 space-y-4 text-xs">
                    {/* Common cues */}
                    {workout.feedback_summary && workout.feedback_summary.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Form Feedback Cues
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {workout.feedback_summary.map((f: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-dark-900 border border-white/5 text-slate-300"
                            >
                              {f.message} <strong className="text-brand-neon font-mono">x{f.count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rep-by-rep data */}
                    {workout.rep_data && workout.rep_data.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Repetition Speeds & Minimum Joint Angles
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {workout.rep_data.map((r: any) => (
                            <div
                              key={r.rep_number}
                              className="p-2 rounded-lg bg-dark-900 border border-white/5 text-center font-mono"
                            >
                              <div className="text-[10px] text-slate-500">Rep {r.rep_number}</div>
                              <div className="text-white font-bold">{r.min_knee_angle}°</div>
                              <div className="text-[10px] text-brand-neon">{r.duration_seconds}s</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Workout Record"
        message="Are you sure you want to permanently delete this workout session from the database? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Record'}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
