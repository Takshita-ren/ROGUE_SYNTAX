import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Sparkles,
  Flame,
  ArrowRight,
  Shield,
  Activity,
  Timer,
  Camera,
  Layers,
} from 'lucide-react';
import { EXERCISE_LIST, EXERCISE_CONFIGS } from '../utils/exerciseConfigs';
import { ExerciseCategory, ExerciseConfig } from '../types/pose';

interface ExercisePickerProps {
  currentExerciseId?: string;
  onSelect?: (exercise: ExerciseConfig) => void;
  compact?: boolean;
}

const CATEGORY_TABS: { id: 'all' | ExerciseCategory; label: string }[] = [
  { id: 'all', label: 'All Exercises' },
  { id: 'legs', label: 'Legs' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'core', label: 'Core' },
  { id: 'full-body', label: 'Full-Body' },
];

export const ExercisePicker: React.FC<ExercisePickerProps> = ({
  currentExerciseId,
  onSelect,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExerciseCategory>('all');

  const filteredExercises =
    selectedCategory === 'all'
      ? EXERCISE_LIST
      : EXERCISE_LIST.filter((ex) => ex.category === selectedCategory);

  const handleExerciseClick = (ex: ExerciseConfig) => {
    if (onSelect) {
      onSelect(ex);
    } else {
      navigate(`/workout/${ex.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-500 text-dark-950 shadow-neon font-bold'
                  : 'bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Exercise Cards Grid */}
      <div
        className={`grid grid-cols-1 ${
          compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
        } gap-4`}
      >
        {filteredExercises.map((ex) => {
          const isCurrent = currentExerciseId === ex.id;
          return (
            <div
              key={ex.id}
              onClick={() => handleExerciseClick(ex)}
              className={`group cursor-pointer p-5 rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-dark-850 border-2 border-brand-neon shadow-neon'
                  : 'bg-dark-900 hover:bg-dark-850 border border-white/5 hover:border-brand-500/30'
              }`}
            >
              <div>
                {/* Header row: Category & Mode Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-neon border border-brand-500/20">
                    {ex.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    {ex.mode === 'hold' ? (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-mono">
                        <Timer className="w-3 h-3" /> Hold
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300 font-mono">
                        <Activity className="w-3 h-3 text-brand-neon" /> Reps
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-brand-neon transition-colors mb-1">
                  {ex.name}
                </h3>

                {/* Camera view & Setup tip */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Camera className="w-3.5 h-3.5 text-brand-neon shrink-0" />
                  <span className="capitalize">{ex.camera.recommendedView} view recommended</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {ex.camera.setupTip}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-brand-neon group-hover:translate-x-0.5 transition-transform">
                <span>{isCurrent ? 'Current Session' : 'Start Workout'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
