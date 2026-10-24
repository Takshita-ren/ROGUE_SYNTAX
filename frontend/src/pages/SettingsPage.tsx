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
} from 'lucide-react';
import { api } from '../services/api';
import { audioEngine } from '../utils/audioChime';
import { ConfirmModal } from '../components/ConfirmModal';

export const SettingsPage: React.FC = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('repright_sound') !== 'muted';
  });

  const [skeletonDefault, setSkeletonDefault] = useState<boolean>(() => {
    return localStorage.getItem('repright_skeleton') !== 'off';
  });

  // Clear History Modal
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string | null>(null);

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
    </div>
  );
};
