import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Award,
  ChevronRight,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ExerciseVariation, PlanExercise } from '../types/plan';
import { ExerciseIllustration } from './ExerciseIllustration';
import { audioEngine } from '../utils/audioChime';

interface GuidedWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: PlanExercise | null;
  variation: ExerciseVariation | null;
  onCompleteExercise: () => void;
}

export const GuidedWorkoutModal: React.FC<GuidedWorkoutModalProps> = ({
  isOpen,
  onClose,
  exercise,
  variation,
  onCompleteExercise,
}) => {
  if (!isOpen || !exercise || !variation) return null;

  const totalSets = exercise.targetSets || 3;
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restCountdown, setRestCountdown] = useState<number>(45);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Active workout timer
  useEffect(() => {
    if (isTimerRunning && !isResting) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, isResting]);

  // Rest countdown timer
  useEffect(() => {
    let restInterval: any = null;
    if (isResting) {
      restInterval = setInterval(() => {
        setRestCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(restInterval);
            setIsResting(false);
            audioEngine.playRepCompleteSound();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [isResting]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = () => {
    audioEngine.playRepCompleteSound();
    if (currentSet < totalSets) {
      setCurrentSet((prev) => prev + 1);
      setIsResting(true);
      setRestCountdown(45);
    } else {
      setIsFinished(true);
      setIsTimerRunning(false);
    }
  };

  const handleFinishAndSave = () => {
    audioEngine.playNoticeSound();
    onCompleteExercise();
    onClose();
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setIsResting(false);
    setRestCountdown(45);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-dark-850/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Guided Exercise Session
                </span>
                <span className="text-xs text-slate-400">
                  Set {currentSet} of {totalSets}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{variation.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guided workout"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Finished Celebration View */}
          {isFinished ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-neon flex items-center justify-center mx-auto shadow-neon">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">All Sets Completed!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Great work executing {totalSets} sets of {variation.name}. Your workout plan progress will be recorded.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleFinishAndSave}
                  className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
                >
                  Mark Exercise Complete & Return to Plan
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Illustration & Form Guidance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <ExerciseIllustration
                    type={variation.illustrationKey}
                    className="w-full h-40"
                  />
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                      Execution Cues
                    </span>
                    <p className="text-slate-200 leading-relaxed">{variation.instruction}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-dark-850 border border-white/5">
                    <span className="text-slate-400">Target Volume:</span>
                    <span className="text-white font-semibold">{variation.recommendedSetsReps}</span>
                  </div>
                </div>
              </div>

              {/* Set Progress Indicators */}
              <div className="flex items-center justify-center gap-2 py-1">
                {Array.from({ length: totalSets }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2.5 rounded-full transition-all ${
                      idx + 1 < currentSet
                        ? 'w-10 bg-brand-neon'
                        : idx + 1 === currentSet
                        ? 'w-14 bg-brand-500 animate-pulse'
                        : 'w-8 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Rest Countdown Overlay OR Live Session Timer */}
              {isResting ? (
                <div className="p-6 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center space-y-2">
                  <div className="text-xs uppercase tracking-wider font-semibold text-sky-400">
                    Rest Between Sets
                  </div>
                  <div className="text-4xl sm:text-5xl font-mono font-black text-sky-300">
                    {restCountdown}s
                  </div>
                  <p className="text-xs text-slate-300">
                    Take slow, deep breaths. Get ready for Set {currentSet} of {totalSets}.
                  </p>
                  <button
                    onClick={() => {
                      setIsResting(false);
                      setRestCountdown(45);
                    }}
                    className="mt-2 text-xs font-semibold px-4 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all"
                  >
                    Skip Rest Countdown
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-dark-850/80 border border-white/10 text-center space-y-4">
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Set {currentSet} Active Duration
                  </div>
                  <div className="text-4xl sm:text-5xl font-mono font-black text-white">
                    {formatTime(timerSeconds)}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        isTimerRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-brand-500 hover:bg-brand-400 text-dark-950 shadow-neon'
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Timer</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-dark-950" />
                          <span>Start Set Timer</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action: Complete Set */}
              {!isResting && (
                <button
                  onClick={handleCompleteSet}
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-neon hover:shadow-neon-strong active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {currentSet === totalSets
                      ? 'Finish Final Set & Complete Exercise'
                      : `Complete Set ${currentSet} (Start Rest)`}
                  </span>
                </button>
              )}

              {/* Safety notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <p>
                  Perform reps with slow and controlled tempo. Stop immediately if you experience joint pain, dizziness, or sharp discomfort.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
