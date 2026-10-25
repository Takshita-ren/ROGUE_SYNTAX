import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  Trash2,
  Cpu,
  Info,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Edit3,
  RotateCcw,
  Calendar,
  Dumbbell,
  Database,
  RefreshCw,
  Server,
  HardDrive,
  Table,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api, DbStatusResponse } from '../services/api';
import { audioEngine } from '../utils/audioChime';
import { ConfirmModal } from '../components/ConfirmModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { getUserProfile, getWorkoutPlan, saveWorkoutPlan, saveUserProfile } from '../utils/planGenerator';
import { UserProfile } from '../types/plan';

export const SettingsPage: React.FC = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  // Profile & Plan state
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('repright_sound') !== 'muted';
  });

  const [skeletonDefault, setSkeletonDefault] = useState<boolean>(() => {
    return localStorage.getItem('repright_skeleton') !== 'off';
  });

  // Database Diagnostics state
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [syncLocalSuccessMsg, setSyncLocalSuccessMsg] = useState<string | null>(null);

  // Clear History Modal
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string | null>(null);

  // Load and test database status
  const checkDbStatus = async () => {
    setIsTestingDb(true);
    setDbError(null);
    try {
      const status = await api.getDbStatus();
      setDbStatus(status);
      setLastCheckedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn('Database health check error:', err);
      setDbError(err?.message || 'Failed to connect to database server.');
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    checkDbStatus();

    // Check if backend has a newer profile
    api
      .getUserProfile()
      .then((remote) => {
        if (remote) {
          setProfile(remote);
          saveUserProfile(remote);
        }
      })
      .catch(() => {
        // Fall back to local profile
      });
  }, []);

  // Sync local storage profile & plan to backend DB
  const handleSyncLocalToDb = async () => {
    if (!profile) return;
    setIsTestingDb(true);
    setSyncLocalSuccessMsg(null);
    try {
      await api.saveUserProfile(profile);
      const plan = getWorkoutPlan();
      if (plan) {
        await api.saveWorkoutPlan(plan);
      }
      setSyncLocalSuccessMsg('Local profile & workout plan successfully synced to the database!');
      await checkDbStatus();
      setTimeout(() => setSyncLocalSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('repright_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('repright_theme', 'light');
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    audioEngine.setMuted(!nextSound);
    localStorage.setItem('repright_sound', nextSound ? 'enabled' : 'muted');
    if (nextSound) {
      audioEngine.playRepCompleteSound();
    }
  };

  // Toggle Skeleton Default
  const handleToggleSkeleton = () => {
    const nextVal = !skeletonDefault;
    setSkeletonDefault(nextVal);
    localStorage.setItem('repright_skeleton', nextVal ? 'on' : 'off');
  };

  // Handle Clear All History
  const handleClearHistory = async () => {
    setIsClearing(true);
    setClearSuccessMsg(null);
    try {
      const res = await api.clearAllWorkouts();
      setShowClearModal(false);
      setClearSuccessMsg(`Successfully cleared ${res.deleted_count} workout sessions from database.`);
      await checkDbStatus();
    } catch (err: unknown) {
      console.error('Failed to clear history:', err);
      alert('Failed to clear workout history. Check backend connection.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-brand-neon text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System & Preferences</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Application Settings</h1>
        <p className="text-sm text-slate-400">
          Manage your camera preferences, workout audio, and database records.
        </p>
      </div>

      {clearSuccessMsg && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-neon text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{clearSuccessMsg}</span>
        </div>
      )}

      {profileSuccessMsg && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-neon text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {syncLocalSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{syncLocalSuccessMsg}</span>
        </div>
      )}

      {/* Fitness Profile & Workout Plan Preferences */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-neon">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fitness Profile & Weekly Plan</h3>
              <p className="text-xs text-slate-400">
                Manage your biometrics, goal, level, schedule, and equipment
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-neon"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{profile ? 'Edit Profile' : 'Set Up Profile'}</span>
          </button>
        </div>

        {profile ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
              <span className="text-slate-500 block mb-1">Height & Weight</span>
              <span className="text-white font-semibold">
                {profile.heightUnit === 'ft_in' && profile.heightFt !== undefined
                  ? `${profile.heightFt}'${profile.heightIn || 0}"`
                  : `${profile.height} cm`}{' '}
                •{' '}
                {profile.weightUnit === 'lbs'
                  ? `${Math.round(profile.weight * 2.20462)} lbs`
                  : `${profile.weight} kg`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
              <span className="text-slate-500 block mb-1">Level & Age</span>
              <span className="text-white font-semibold capitalize">
                {profile.fitnessLevel} • {profile.ageRange || 'Not set'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
              <span className="text-slate-500 block mb-1">Goal</span>
              <span className="text-white font-semibold capitalize">
                {profile.mainGoal.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
              <span className="text-slate-500 block mb-1">Schedule & Gear</span>
              <span className="text-white font-semibold">
                {profile.workoutDaysPerWeek} days/wk • {profile.equipment.length} gear
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-dark-850/60 border border-white/5 text-xs text-slate-400 flex items-center justify-between">
            <span>No personalized fitness profile configured yet.</span>
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-brand-neon hover:underline font-semibold"
            >
              Configure Now →
            </button>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-6">
        <h3 className="text-base font-bold text-white mb-2">Display & Audio Preferences</h3>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dark-850 text-slate-300">
              {isDarkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Dark Theme</div>
              <div className="text-xs text-slate-400">High-contrast fitness dark mode</div>
            </div>
          </div>
          <button
            onClick={handleToggleTheme}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isDarkMode ? 'bg-brand-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-dark-950 shadow-md" />
          </button>
        </div>

        {/* Rep Audio Chime */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dark-850 text-slate-300">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-brand-neon" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Audio Repetition Chime</div>
              <div className="text-xs text-slate-400">Play synthesized audio chime upon completed repetitions</div>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              soundEnabled ? 'bg-brand-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-dark-950 shadow-md" />
          </button>
        </div>

        {/* Skeleton Overlay Default */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dark-850 text-slate-300">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Live Skeleton Bones</div>
              <div className="text-xs text-slate-400">Display biomechanical joints and bones overlaid on camera feed</div>
            </div>
          </div>
          <button
            onClick={handleToggleSkeleton}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              skeletonDefault ? 'bg-brand-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-dark-950 shadow-md" />
          </button>
        </div>
      </div>

      {/* Target Workout Goals (Reps / Sets / Hold Duration) */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-neon" />
          <span>Workout Target Goals & Sets</span>
        </h3>
        <p className="text-xs text-slate-400">
          Configure default repetition and isometric hold targets. Reaching these targets triggers the &ldquo;Set Complete&rdquo; celebration cue.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-dark-850 border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Default Rep Target (Per Set)
            </label>
            <select
              defaultValue={localStorage.getItem('repright_default_target_reps') || '15'}
              onChange={(e) => {
                localStorage.setItem('repright_default_target_reps', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-white font-mono text-xs outline-none focus:border-brand-500"
            >
              <option value="8">8 Reps (Strength / Hypertrophy)</option>
              <option value="10">10 Reps (Standard)</option>
              <option value="12">12 Reps (Fitness)</option>
              <option value="15">15 Reps (Endurance - Recommended)</option>
              <option value="20">20 Reps (High Volume)</option>
              <option value="25">25 Reps (Cardio Burn)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-dark-850 border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Default Plank Hold Target
            </label>
            <select
              defaultValue={localStorage.getItem('repright_default_target_hold') || '45'}
              onChange={(e) => {
                localStorage.setItem('repright_default_target_hold', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/10 text-white font-mono text-xs outline-none focus:border-brand-500"
            >
              <option value="20">20 Seconds (Beginner)</option>
              <option value="30">30 Seconds (Moderate)</option>
              <option value="45">45 Seconds (Intermediate - Recommended)</option>
              <option value="60">60 Seconds (1 Minute Goal)</option>
              <option value="90">90 Seconds (Advanced)</option>
              <option value="120">120 Seconds (2 Minutes Pro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy & Computer Vision Architecture */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-neon" />
          <span>Camera Privacy & Edge Computer Vision</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          RepRight executes Google MediaPipe Pose Landmarker models directly inside your browser via WebAssembly and WebGL/GPU acceleration.
          <strong> Raw video frames never leave your computer.</strong> No video, image, or audio recordings are uploaded, stored, or transmitted to any server.
        </p>
        <div className="p-3 rounded-xl bg-dark-850 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-neon flex-shrink-0" />
          <span>Only quantified workout metrics (rep counts, timestamps, duration, and calculated angles) are sent to the local SQLite database for persistence.</span>
        </div>
      </div>

      {/* Relational Database Diagnostics & Health */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-neon">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Relational Database Diagnostics</h3>
                {dbStatus ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected ({dbStatus.dialect.toUpperCase()})
                  </span>
                ) : dbError ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Offline / Connecting
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    Testing...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Full-stack SQLAlchemy ORM persistence with SQLite / PostgreSQL support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={checkDbStatus}
              disabled={isTestingDb}
              className="px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin text-brand-neon' : ''}`} />
              <span>{isTestingDb ? 'Testing...' : 'Test Connection'}</span>
            </button>
            {profile && (!dbStatus || (dbStatus.tables?.user_profiles?.row_count === 0)) && (
              <button
                onClick={handleSyncLocalToDb}
                disabled={isTestingDb}
                className="px-3.5 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-neon border border-brand-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Sync Local to DB</span>
              </button>
            )}
          </div>
        </div>

        {/* Database Connection Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
            <span className="text-slate-500 block text-[11px] font-sans">Engine / Dialect</span>
            <span className="text-brand-neon font-bold">
              {dbStatus ? dbStatus.dialect.toUpperCase() : 'SQLite (Local)'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-dark-850 border border-white/5 truncate">
            <span className="text-slate-500 block text-[11px] font-sans">Database Location</span>
            <span className="text-slate-300 font-bold truncate block" title={dbStatus?.database_url_masked}>
              {dbStatus?.database_url_masked || 'replevel_workouts.db'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-dark-850 border border-white/5">
            <span className="text-slate-500 block text-[11px] font-sans">Total Database Records</span>
            <span className="text-white font-bold">
              {dbStatus ? `${dbStatus.total_records} records` : '—'}
            </span>
          </div>
        </div>

        {/* Tables Breakdown Grid */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-brand-neon" />
            <span>Database Tables & Record Counts</span>
            {lastCheckedTime && (
              <span className="text-[10px] text-slate-500 font-normal ml-auto">
                Checked at {lastCheckedTime}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Table 1: Workouts */}
            <div className="p-3.5 rounded-xl bg-dark-850/80 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">workouts</span>
                <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-neon font-bold text-xs">
                  {dbStatus?.tables?.workouts?.row_count ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Exercise logs, repetitions, scores, and durations
              </p>
            </div>

            {/* Table 2: User Profiles */}
            <div className="p-3.5 rounded-xl bg-dark-850/80 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">user_profiles</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-bold text-xs">
                  {dbStatus?.tables?.user_profiles?.row_count ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Height, weight, fitness level, goals, equipment
              </p>
            </div>

            {/* Table 3: Workout Plans */}
            <div className="p-3.5 rounded-xl bg-dark-850/80 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">workout_plans</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold text-xs">
                  {dbStatus?.tables?.workout_plans?.row_count ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Weekly routine, schedule, exercise variations
              </p>
            </div>

            {/* Table 4: Plan Progress */}
            <div className="p-3.5 rounded-xl bg-dark-850/80 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">plan_progress</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                  {dbStatus?.tables?.plan_progress?.row_count ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Completed days and exercise checkoffs
              </p>
            </div>
          </div>
        </div>

        {dbError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{dbError}</span>
          </div>
        )}
      </div>

      {/* Data Management & Clear History */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-rose-500/20 space-y-4">
        <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <span>Data Storage & Database Management</span>
        </h3>
        <p className="text-xs text-slate-400">
          Delete all recorded workout sessions, repetition records, and statistics from your SQLite database.
        </p>

        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
        >
          Clear Workout History
        </button>
      </div>

      {/* Technical Specifications */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          System Information
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">App Version</span>
            <span className="text-white font-bold">1.0.0 (MVP)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Vision Engine</span>
            <span className="text-brand-neon font-bold">MediaPipe Tasks 1.1</span>
          </div>
          <div>
            <span className="text-slate-500 block">Backend</span>
            <span className="text-white font-bold">FastAPI + SQLAlchemy</span>
          </div>
          <div>
            <span className="text-slate-500 block">License</span>
            <span className="text-white font-bold">MIT Open Source</span>
          </div>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear All Workout History"
        message="Are you sure you want to delete all saved workout records and statistics? This will permanently wipe your SQLite history."
        confirmLabel={isClearing ? 'Clearing...' : 'Wipe All History'}
        isDestructive={true}
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Edit Profile Modal */}
      <OnboardingModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialProfile={profile}
        isEditing={!!profile}
        onComplete={(newProfile) => {
          setProfile(newProfile);
          setProfileSuccessMsg('Successfully updated your fitness profile and regenerated your workout plan.');
          setTimeout(() => setProfileSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};
