import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Dumbbell,
  Sparkles,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Edit3,
  AlertTriangle,
  ChevronRight,
  Layers,
  Activity,
  Timer,
  Award,
  HeartPulse,
  Flame,
  Info,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  WeeklyWorkoutPlan,
  PlanDay,
  PlanExercise,
  ExerciseVariation,
  PlanProgressMap,
} from '../types/plan';
import {
  getUserProfile,
  getWorkoutPlan,
  getPlanProgress,
  markDayCompleted,
  toggleExerciseCompleted,
  generateWorkoutPlan,
  saveWorkoutPlan,
  updateExerciseVariation,
  SAFETY_DISCLAIMER,
} from '../utils/planGenerator';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import { ExerciseVariationsModal } from '../components/ExerciseVariationsModal';
import { GuidedWorkoutModal } from '../components/GuidedWorkoutModal';
import { OnboardingModal } from '../components/OnboardingModal';

export const MyPlanPage: React.FC = () => {
  const navigate = useNavigate();

  // Storage states
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [plan, setPlan] = useState<WeeklyWorkoutPlan | null>(() => getWorkoutPlan());
  const [progress, setProgress] = useState<PlanProgressMap>(() => getPlanProgress());

  // UI state
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Variations modal
  const [isVariationsOpen, setIsVariationsOpen] = useState<boolean>(false);
  const [selectedExForVariations, setSelectedExForVariations] = useState<PlanExercise | null>(null);

  // Guided workout modal
  const [isGuidedOpen, setIsGuidedOpen] = useState<boolean>(false);
  const [activeGuidedExercise, setActiveGuidedExercise] = useState<PlanExercise | null>(null);
  const [activeGuidedVariation, setActiveGuidedVariation] = useState<ExerciseVariation | null>(null);

  // Plan regeneration confirm
  const [showRegenConfirm, setShowRegenConfirm] = useState<boolean>(false);

  // Sync state on load
  useEffect(() => {
    const loadedProfile = getUserProfile();
    const loadedPlan = getWorkoutPlan();
    const loadedProgress = getPlanProgress();

    setProfile(loadedProfile);
    setPlan(loadedPlan);
    setProgress(loadedProgress);

    // If profile exists but no plan yet, generate it
    if (loadedProfile && !loadedPlan) {
      const generated = generateWorkoutPlan(loadedProfile);
      saveWorkoutPlan(generated);
      setPlan(generated);
    }
  }, []);

  // Calculate weekly stats
  const totalWorkoutDays = plan?.days.filter((d) => !d.isRestDay).length || 3;
  const completedWorkoutDaysCount = plan
    ? plan.days.filter((d) => !d.isRestDay && progress[d.dayNumber]?.isCompleted).length
    : 0;
  const weeklyCompletionPercent = Math.round(
    (completedWorkoutDaysCount / Math.max(1, totalWorkoutDays)) * 100
  );

  const activeDay: PlanDay | undefined = plan?.days.find(
    (d) => d.dayNumber === activeDayNumber
  );
  const isCurrentDayCompleted = progress[activeDayNumber]?.isCompleted || false;

  // Toggle Day completion
  const handleToggleDayComplete = () => {
    const nextState = !isCurrentDayCompleted;
    const updatedProg = markDayCompleted(activeDayNumber, nextState);
    setProgress(updatedProg);
  };

  // Toggle individual exercise completion
  const handleToggleExercise = (exerciseId: string) => {
    const updatedProg = toggleExerciseCompleted(activeDayNumber, exerciseId);
    setProgress(updatedProg);
  };

  // Switch variation
  const handleSelectVariation = (variationId: string) => {
    if (!selectedExForVariations) return;
    const updatedPlan = updateExerciseVariation(
      activeDayNumber,
      selectedExForVariations.id,
      variationId
    );
    if (updatedPlan) {
      setPlan(updatedPlan);
      // update selectedExForVariations reference
      const updatedDay = updatedPlan.days.find((d) => d.dayNumber === activeDayNumber);
      const updatedEx = updatedDay?.exercises.find((e) => e.id === selectedExForVariations.id);
      if (updatedEx) {
        setSelectedExForVariations(updatedEx);
      }
    }
  };

  // Start workout from plan or variation
  const handleStartWorkout = (exercise: PlanExercise, variation?: ExerciseVariation) => {
    const targetVar =
      variation ||
      exercise.variations.find((v) => v.id === exercise.selectedVariationId) ||
      exercise.variations[0];

    if (targetVar.isAiTracked && targetVar.trackedExerciseId) {
      // Direct navigation to existing AI webcam tracking screen
      navigate(`/workout/${targetVar.trackedExerciseId}`);
    } else {
      // Launch guided workout modal
      setActiveGuidedExercise(exercise);
      setActiveGuidedVariation(targetVar);
      setIsGuidedOpen(true);
    }
  };

  // Regenerate plan
  const handleRegeneratePlan = () => {
    if (!profile) return;
    const newPlan = generateWorkoutPlan(profile);
    saveWorkoutPlan(newPlan);
    setPlan(newPlan);
    setShowRegenConfirm(false);
  };

  // Format goal name
  const formatGoal = (goal?: string) => {
    switch (goal) {
      case 'weight_loss':
        return 'Weight Loss & Calorie Burn';
      case 'muscle_gain':
        return 'Muscle Hypertrophy';
      case 'strength':
        return 'Maximum Strength';
      case 'mobility':
        return 'Mobility & Joint Health';
      case 'general_fitness':
      default:
        return 'General Fitness & Longevity';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* EMPTY STATE: If no profile / plan exists yet */}
      {/* ------------------------------------------------------------- */}
      {!profile || !plan ? (
        <div className="my-10 p-8 sm:p-12 rounded-3xl bg-dark-900 border border-white/10 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-neon flex items-center justify-center text-dark-950 font-bold mx-auto shadow-neon">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Create Your Personalized Workout Plan
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Answer a few quick questions about your height, weight, fitness level, available equipment, and weekly schedule to generate a science-backed weekly routine with AI posture tracking.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400 py-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-brand-neon" /> 2 to 3 Variations per Exercise
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-brand-neon" /> Webcam AI Rep & Depth Tracking
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-brand-neon" /> 100% Private Browser Storage
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setIsOnboardingModalOpen(true);
              }}
              className="px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-base transition-all shadow-neon hover:shadow-neon-strong active:scale-95 inline-flex items-center gap-2"
            >
              <span>Build My Personalized Plan</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* POPULATED PLAN VIEW */
        /* ------------------------------------------------------------- */
        <>
          {/* Header Dashboard Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-dark-900 border border-white/10 relative overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-neon text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Personalized Weekly Plan
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 capitalize">
                    {profile.fitnessLevel} Level
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {profile.workoutDaysPerWeek} Days / Week
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {formatGoal(profile.mainGoal)}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {plan.weeklyGuidance}
                </p>
              </div>

              {/* Weekly Progress Gauge & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-center shrink-0">
                <div className="p-4 rounded-2xl bg-dark-850 border border-white/10 flex items-center gap-4">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#00f59b"
                        strokeWidth="3.5"
                        strokeDasharray="94.2"
                        strokeDashoffset={94.2 - (94.2 * weeklyCompletionPercent) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold text-white">
                      {weeklyCompletionPercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {completedWorkoutDaysCount} of {totalWorkoutDays} Days
                    </span>
                    <span className="text-[11px] text-slate-400">Completed this week</span>
                  </div>
                </div>

                {/* Edit & Regenerate buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditingProfile(true);
                      setIsOnboardingModalOpen(true);
                    }}
                    className="p-3 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Edit Profile & Schedule"
                  >
                    <Edit3 className="w-4 h-4 text-brand-neon" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setShowRegenConfirm(true)}
                    className="p-3 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Regenerate Plan"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* DAY SELECTOR TABS (Day 1 - 7) */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Weekly Schedule
              </span>
              <span className="text-xs text-slate-500">Select day to view session</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {plan.days.map((day) => {
                const isActive = day.dayNumber === activeDayNumber;
                const isDone = progress[day.dayNumber]?.isCompleted;

                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDayNumber(day.dayNumber)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-brand-500/10 border-brand-500 shadow-neon'
                        : 'bg-dark-900 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Top Row: Day Name & Status Check */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-bold ${
                          isActive ? 'text-brand-neon' : 'text-slate-200'
                        }`}
                      >
                        {day.dayName.split(' - ')[1] || `Day ${day.dayNumber}`}
                      </span>

                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-brand-neon text-dark-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div
                          className={`w-2 h-2 rounded-full ${
                            day.isRestDay ? 'bg-sky-400' : 'bg-slate-600'
                          }`}
                        />
                      )}
                    </div>

                    {/* Day Focus label */}
                    <div className="text-[11px] font-medium text-slate-400 truncate">
                      {day.isRestDay ? 'Rest / Recovery' : `${day.exercises.length} Exercises`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* ACTIVE DAY VIEW */}
          {/* ------------------------------------------------------------- */}
          {activeDay && (
            <div className="p-6 sm:p-8 rounded-3xl bg-dark-900 border border-white/10 space-y-6 shadow-xl">
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-bold tracking-wider text-brand-neon">
                      {activeDay.dayName}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        activeDay.isRestDay
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-brand-500/10 text-brand-neon border border-brand-500/20'
                      }`}
                    >
                      {activeDay.isRestDay ? 'Recovery Day' : 'Workout Session'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{activeDay.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                    {activeDay.focus}
                  </p>
                </div>

                {/* Mark Day Complete Button */}
                <button
                  onClick={handleToggleDayComplete}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    isCurrentDayCompleted
                      ? 'bg-brand-500 text-dark-950 shadow-neon'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isCurrentDayCompleted ? 'Completed Day' : 'Mark Day as Complete'}</span>
                </button>
              </div>

              {/* If Rest Day: Show Restorative Guide */}
              {activeDay.isRestDay ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-dark-850/60 border border-white/5">
                  <div className="rounded-xl overflow-hidden border border-white/5">
                    <ExerciseIllustration type="rest_day" className="w-full h-44" />
                  </div>
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <HeartPulse className="w-4 h-4" />
                      <span>Muscle Recovery Protocol</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Active Rest & Regeneration</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Rest is when muscle adaptations and neural consolidation occur. Prioritize 7–9 hours of sleep, light dynamic stretching, and nutrient-dense hydration.
                    </p>
                    {activeDay.recoveryTip && (
                      <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
                        <span className="font-semibold block mb-0.5">Today's Recovery Tip:</span>
                        {activeDay.recoveryTip}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* If Workout Day: Show Planned Exercises with Variations */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {activeDay.exercises.length} exercises scheduled • Click variations to customize your movements
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {activeDay.exercises.map((exercise) => {
                      const selectedVar =
                        exercise.variations.find((v) => v.id === exercise.selectedVariationId) ||
                        exercise.variations[0];
                      const isExDone =
                        progress[activeDayNumber]?.completedExercises?.includes(exercise.id) ||
                        false;

                      return (
                        <div
                          key={exercise.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isExDone
                              ? 'bg-dark-850/30 border-white/5 opacity-80'
                              : 'bg-dark-850/70 border-white/10 hover:border-white/20 shadow-md'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                            {/* Left: Illustration Thumbnail & Details */}
                            <div className="flex items-start sm:items-center gap-4">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-dark-900">
                                <ExerciseIllustration
                                  type={selectedVar.illustrationKey}
                                  className="w-full h-full"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 uppercase">
                                    {exercise.category}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {selectedVar.difficulty}
                                  </span>

                                  {/* Auto-tracked vs Guided badge */}
                                  {selectedVar.isAiTracked ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-brand-500/10 text-brand-neon border border-brand-500/20">
                                      <Activity className="w-3 h-3 animate-pulse" />
                                      {selectedVar.trackingLabel}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                      <Timer className="w-3 h-3" />
                                      {selectedVar.trackingLabel}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                  <span>{selectedVar.name}</span>
                                  {isExDone && (
                                    <CheckCircle2 className="w-4 h-4 text-brand-neon stroke-[2.5]" />
                                  )}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                                  <span>
                                    <strong className="text-white">Target:</strong>{' '}
                                    {exercise.targetSets} sets × {selectedVar.recommendedSetsReps}
                                  </span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">{exercise.restGuidance}</span>
                                </div>

                                <p className="text-xs text-slate-400 max-w-xl line-clamp-2">
                                  {selectedVar.instruction}
                                </p>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                              {/* Exercise Variations Button */}
                              <button
                                onClick={() => {
                                  setSelectedExForVariations(exercise);
                                  setIsVariationsOpen(true);
                                }}
                                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Layers className="w-3.5 h-3.5 text-brand-neon" />
                                <span>Variations ({exercise.variations.length})</span>
                              </button>

                              {/* Start Workout Button */}
                              <button
                                onClick={() => handleStartWorkout(exercise, selectedVar)}
                                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 fill-dark-950" />
                                <span>
                                  {selectedVar.isAiTracked ? 'Start with AI Coach' : 'Start Guided Session'}
                                </span>
                              </button>

                              {/* Toggle Checkmark button */}
                              <button
                                onClick={() => handleToggleExercise(exercise.id)}
                                className={`p-2.5 rounded-xl border transition-all ${
                                  isExDone
                                    ? 'bg-brand-500/20 text-brand-neon border-brand-500/40'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
                                }`}
                                title={isExDone ? 'Mark as Incomplete' : 'Mark as Complete'}
                              >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VISIBLE MEDICAL & GENERAL FITNESS DISCLAIMER */}
          {/* ------------------------------------------------------------- */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-xs text-amber-200/90 leading-relaxed shadow-lg">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">
                Important Health & Safety Disclaimer
              </span>
              <p>{SAFETY_DISCLAIMER}</p>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}
      {/* Onboarding / Profile Editor Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        initialProfile={profile}
        isEditing={isEditingProfile}
        onComplete={(newProfile, newPlan) => {
          setProfile(newProfile);
          setPlan(newPlan);
        }}
      />

      {/* Exercise Variations Modal */}
      <ExerciseVariationsModal
        isOpen={isVariationsOpen}
        onClose={() => setIsVariationsOpen(false)}
        exercise={selectedExForVariations}
        dayNumber={activeDayNumber}
        onSelectVariation={handleSelectVariation}
        onStartWorkout={(variation) => {
          setIsVariationsOpen(false);
          if (selectedExForVariations) {
            handleStartWorkout(selectedExForVariations, variation);
          }
        }}
      />

      {/* Guided Workout Modal */}
      <GuidedWorkoutModal
        isOpen={isGuidedOpen}
        onClose={() => setIsGuidedOpen(false)}
        exercise={activeGuidedExercise}
        variation={activeGuidedVariation}
        onCompleteExercise={() => {
          if (activeGuidedExercise) {
            const updated = toggleExerciseCompleted(activeDayNumber, activeGuidedExercise.id);
            setProgress(updated);
          }
        }}
      />

      {/* Regenerate Plan Confirmation Modal */}
      {showRegenConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="max-w-md w-full bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Regenerate Weekly Plan?</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              This will recalculate and generate a fresh weekly workout schedule based on your current goal ({formatGoal(profile?.mainGoal)}) and equipment. Any custom variations you previously selected will be reset to default.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowRegenConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRegeneratePlan}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
              >
                Yes, Regenerate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
