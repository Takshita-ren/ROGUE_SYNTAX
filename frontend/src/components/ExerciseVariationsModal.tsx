import React from 'react';
import { X, Check, Dumbbell, Sparkles, Activity, Timer, ChevronRight, Layers } from 'lucide-react';
import { PlanExercise, ExerciseVariation } from '../types/plan';
import { ExerciseIllustration } from './ExerciseIllustration';

interface ExerciseVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: PlanExercise | null;
  dayNumber: number;
  onSelectVariation: (variationId: string) => void;
  onStartWorkout: (variation: ExerciseVariation) => void;
}

export const ExerciseVariationsModal: React.FC<ExerciseVariationsModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onSelectVariation,
  onStartWorkout,
}) => {
  if (!isOpen || !exercise) return null;

  const getDifficultyBadge = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Advanced':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="variations-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-dark-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-neon">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-neon">
                  Exercise Variations
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 capitalize">{exercise.category} focus</span>
              </div>
              <h2 id="variations-modal-title" className="text-xl sm:text-2xl font-bold text-white">
                Variations for {exercise.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Description & Guidance */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-dark-900/40 text-xs sm:text-sm text-slate-300">
          <p>
            Choose the variation that matches your current strength and equipment. Beginner variations prioritize joint stability and foundational movement patterns, while intermediate and advanced variations add progressive load or intensity.
          </p>
        </div>

        {/* Variations Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto">
          {exercise.variations.map((variation) => {
            const isSelected = exercise.selectedVariationId === variation.id;

            return (
              <div
                key={variation.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'bg-brand-500/5 border-brand-500 shadow-neon'
                    : 'bg-dark-850/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Visual Illustration */}
                  <div className="relative mb-3 rounded-lg overflow-hidden border border-white/5">
                    <ExerciseIllustration
                      type={variation.illustrationKey}
                      className="w-full h-32 sm:h-36"
                    />
                    {/* Selected Badge Overlay */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-brand-500 text-dark-950 text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active Choice
                      </div>
                    )}
                  </div>

                  {/* Badges: Difficulty & Equipment */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                        variation.difficulty
                      )}`}
                    >
                      {variation.difficulty}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                      <Dumbbell className="w-2.5 h-2.5 text-slate-400" />
                      {variation.equipment}
                    </span>
                  </div>

                  {/* Variation Name */}
                  <h3 className="text-base font-bold text-white mb-1.5">{variation.name}</h3>

                  {/* Tracking Engine Distinction */}
                  <div className="mb-3">
                    {variation.isAiTracked ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-500/10 text-brand-neon border border-brand-500/20 text-[11px] font-medium">
                        <Activity className="w-3 h-3 text-brand-neon animate-pulse" />
                        <span>{variation.trackingLabel}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-medium">
                        <Timer className="w-3 h-3 text-sky-400" />
                        <span>{variation.trackingLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Instruction */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {variation.instruction}
                  </p>

                  {/* Target Sets & Reps */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 mb-4 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Target Volume
                    </span>
                    <span className="text-white font-medium">{variation.recommendedSetsReps}</span>
                  </div>
                </div>

                {/* Actions: Select or Start */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onSelectVariation(variation.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-brand-500/20 text-brand-neon border border-brand-500/40 cursor-default'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected for Plan
                      </>
                    ) : (
                      'Select this Variation'
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSelectVariation(variation.id);
                      onStartWorkout(variation);
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-brand-500 hover:bg-brand-400 text-dark-950 flex items-center justify-center gap-1.5 transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
                  >
                    <span>Start Workout</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-dark-850/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
