import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Dumbbell,
  Target,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Activity,
  HeartPulse,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  UserProfile,
  FitnessGoal,
  FitnessLevel,
  EquipmentOption,
  AgeRange,
  WeeklyWorkoutPlan,
} from '../types/plan';
import {
  saveUserProfile,
  generateWorkoutPlan,
  saveWorkoutPlan,
} from '../utils/planGenerator';
import { api } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile, plan: WeeklyWorkoutPlan) => void;
  initialProfile?: UserProfile | null;
  isEditing?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProfile,
  isEditing = false,
}) => {
  // Height state
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>(
    initialProfile?.heightUnit || 'cm'
  );
  const [heightCm, setHeightCm] = useState<string>(
    initialProfile ? initialProfile.height.toString() : '175'
  );
  const [heightFt, setHeightFt] = useState<string>(
    initialProfile?.heightFt ? initialProfile.heightFt.toString() : '5'
  );
  const [heightIn, setHeightIn] = useState<string>(
    initialProfile?.heightIn ? initialProfile.heightIn.toString() : '9'
  );

  // Weight state
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(
    initialProfile?.weightUnit || 'kg'
  );
  const [weightValue, setWeightValue] = useState<string>(
    initialProfile
      ? (initialProfile.weightUnit === 'lbs'
          ? Math.round(initialProfile.weight * 2.20462)
          : initialProfile.weight
        ).toString()
      : '70'
  );

  // Age range (optional)
  const [ageRange, setAgeRange] = useState<AgeRange>(
    initialProfile?.ageRange || '26-35'
  );

  // Fitness Level
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    initialProfile?.fitnessLevel || 'beginner'
  );

  // Main Goal
  const [mainGoal, setMainGoal] = useState<FitnessGoal>(
    initialProfile?.mainGoal || 'general_fitness'
  );

  // Workout Days per Week
  const [workoutDays, setWorkoutDays] = useState<number>(
    initialProfile?.workoutDaysPerWeek || 3
  );

  // Equipment
  const [equipment, setEquipment] = useState<EquipmentOption[]>(
    initialProfile?.equipment || ['bodyweight']
  );

  // Validation errors
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  if (!isOpen) return null;

  // Toggle Equipment checkbox
  const toggleEquipment = (item: EquipmentOption) => {
    if (item === 'bodyweight') return; // Bodyweight always enabled
    if (equipment.includes(item)) {
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  // Unit conversion helpers
  const handleToggleHeightUnit = (unit: 'cm' | 'ft_in') => {
    if (unit === heightUnit) return;
    setHeightUnit(unit);
    if (unit === 'ft_in') {
      const cmVal = parseFloat(heightCm) || 175;
      const totalInches = cmVal / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setHeightFt(ft.toString());
      setHeightIn(inches.toString());
    } else {
      const ft = parseFloat(heightFt) || 5;
      const inches = parseFloat(heightIn) || 9;
      const cm = Math.round((ft * 12 + inches) * 2.54);
      setHeightCm(cm.toString());
    }
  };

  const handleToggleWeightUnit = (unit: 'kg' | 'lbs') => {
    if (unit === weightUnit) return;
    setWeightUnit(unit);
    const curr = parseFloat(weightValue) || 70;
    if (unit === 'lbs') {
      setWeightValue(Math.round(curr * 2.20462).toString());
    } else {
      setWeightValue(Math.round(curr / 2.20462).toString());
    }
  };

  const validateForm = (): boolean => {
    const errs: { height?: string; weight?: string } = {};

    // Validate Height
    if (heightUnit === 'cm') {
      const cm = parseFloat(heightCm);
      if (isNaN(cm) || cm < 90 || cm > 250) {
        errs.height = 'Please enter a valid height between 90 cm and 250 cm.';
      }
    } else {
      const ft = parseFloat(heightFt);
      const inches = parseFloat(heightIn);
      if (isNaN(ft) || ft < 3 || ft > 8 || isNaN(inches) || inches < 0 || inches > 11) {
        errs.height = 'Please enter valid feet (3-8) and inches (0-11).';
      }
    }

    // Validate Weight
    const w = parseFloat(weightValue);
    if (weightUnit === 'kg') {
      if (isNaN(w) || w < 30 || w > 300) {
        errs.weight = 'Please enter a valid weight between 30 kg and 300 kg.';
      }
    } else {
      if (isNaN(w) || w < 66 || w > 660) {
        errs.weight = 'Please enter a valid weight between 66 lbs and 660 lbs.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculate standardized values
    let finalHeightCm = 175;
    let storedFt: number | undefined;
    let storedIn: number | undefined;

    if (heightUnit === 'cm') {
      finalHeightCm = parseFloat(heightCm);
    } else {
      storedFt = parseFloat(heightFt);
      storedIn = parseFloat(heightIn);
      finalHeightCm = Math.round((storedFt * 12 + storedIn) * 2.54);
    }

    let finalWeightKg = 70;
    const inputWeight = parseFloat(weightValue);
    if (weightUnit === 'kg') {
      finalWeightKg = inputWeight;
    } else {
      finalWeightKg = parseFloat((inputWeight / 2.20462).toFixed(1));
    }

    const profile: UserProfile = {
      height: finalHeightCm,
      heightUnit,
      heightFt: storedFt,
      heightIn: storedIn,
      weight: finalWeightKg,
      weightUnit,
      ageRange,
      fitnessLevel,
      mainGoal,
      workoutDaysPerWeek: workoutDays,
      equipment,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveUserProfile(profile);
    const plan = generateWorkoutPlan(profile);
    saveWorkoutPlan(plan);

    // Asynchronously push to backend database
    api.saveUserProfile(profile).catch((err) => console.warn('Database profile sync:', err));
    api.saveWorkoutPlan(plan).catch((err) => console.warn('Database plan sync:', err));

    onComplete(profile, plan);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Banner */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-dark-850 via-dark-850 to-brand-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-neon flex items-center justify-center text-dark-950 font-bold shadow-neon">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-neon">
                  Personalized AI Coaching
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  {isEditing ? 'Update Fitness Profile' : 'Initial Setup'}
                </span>
              </div>
              <h2 id="onboarding-modal-title" className="text-xl sm:text-2xl font-extrabold text-white">
                {isEditing ? 'Edit Your Fitness Profile' : 'Welcome to RepRight'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-7 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Biometrics (Height, Weight, Age) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-2">
              <Activity className="w-4 h-4 text-brand-neon" />
              <span>1. Body Metrics & Age Range</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Height Input */}
              <div className="p-4 rounded-xl bg-dark-850/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="height-cm" className="text-xs font-semibold text-slate-300">Height</label>
                  <div className="flex rounded-lg bg-dark-900 p-0.5 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleHeightUnit('cm')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                        heightUnit === 'cm'
                          ? 'bg-brand-500 text-dark-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleHeightUnit('ft_in')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                        heightUnit === 'ft_in'
                          ? 'bg-brand-500 text-dark-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ft / in
                    </button>
                  </div>
                </div>

                {heightUnit === 'cm' ? (
                  <div className="relative">
                    <input
                      id="height-cm"
                      type="number"
                      value={heightCm}
                      onChange={(e) => {
                        setHeightCm(e.target.value);
                        if (errors.height) setErrors({ ...errors, height: undefined });
                      }}
                      placeholder="e.g. 175"
                      className="w-full bg-dark-900 border border-white/10 focus:border-brand-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none transition-all"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                      cm
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={heightFt}
                        onChange={(e) => {
                          setHeightFt(e.target.value);
                          if (errors.height) setErrors({ ...errors, height: undefined });
                        }}
                        placeholder="5"
                        className="w-full bg-dark-900 border border-white/10 focus:border-brand-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={heightIn}
                        onChange={(e) => {
                          setHeightIn(e.target.value);
                          if (errors.height) setErrors({ ...errors, height: undefined });
                        }}
                        placeholder="9"
                        className="w-full bg-dark-900 border border-white/10 focus:border-brand-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">in</span>
                    </div>
                  </div>
                )}
                {errors.height && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.height}</span>
                  </p>
                )}
              </div>

              {/* Weight Input */}
              <div className="p-4 rounded-xl bg-dark-850/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="current-weight" className="text-xs font-semibold text-slate-300">Current Weight</label>
                  <div className="flex rounded-lg bg-dark-900 p-0.5 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleWeightUnit('kg')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                        weightUnit === 'kg'
                          ? 'bg-brand-500 text-dark-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleWeightUnit('lbs')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                        weightUnit === 'lbs'
                          ? 'bg-brand-500 text-dark-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="current-weight"
                    type="number"
                    value={weightValue}
                    onChange={(e) => {
                      setWeightValue(e.target.value);
                      if (errors.weight) setErrors({ ...errors, weight: undefined });
                    }}
                    placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
                    className="w-full bg-dark-900 border border-white/10 focus:border-brand-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                    {weightUnit}
                  </span>
                </div>
                {errors.weight && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.weight}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Age Range (Optional) */}
            <div className="p-4 rounded-xl bg-dark-850/60 border border-white/5 space-y-2">
              <label htmlFor="age-range" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <span>Age Range</span>
                <span className="text-[11px] text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                id="age-range"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value as AgeRange)}
                className="w-full bg-dark-900 border border-white/10 focus:border-brand-500 rounded-lg py-2.5 px-3 text-white text-sm outline-none"
              >
                <option value="<18">Under 18</option>
                <option value="18-25">18 – 25 years old</option>
                <option value="26-35">26 – 35 years old</option>
                <option value="36-50">36 – 50 years old</option>
                <option value="50+">50+ years old</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Section 2: Fitness Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-brand-neon" />
              <span>2. Fitness Level</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'beginner',
                  name: 'Beginner',
                  desc: 'New to exercise or returning after a break. Focus on form and joint stability.',
                },
                {
                  id: 'intermediate',
                  name: 'Intermediate',
                  desc: 'Comfortable with standard bodyweight exercises and regular weekly training.',
                },
                {
                  id: 'advanced',
                  name: 'Advanced',
                  desc: 'Experienced lifter seeking progressive overload and high-intensity variations.',
                },
              ].map((lvl) => {
                const isSelected = fitnessLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setFitnessLevel(lvl.id as FitnessLevel)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 shadow-neon'
                        : 'bg-dark-850/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{lvl.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-neon" />}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Main Goal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-2">
              <Target className="w-4 h-4 text-brand-neon" />
              <span>3. Main Fitness Goal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'weight_loss',
                  name: 'Weight Loss',
                  desc: 'Balanced strength + light cardio intervals and gradual progression.',
                  icon: TrendingUp,
                },
                {
                  id: 'muscle_gain',
                  name: 'Muscle Gain',
                  desc: 'Progressive resistance hypertrophy with dedicated muscle recovery.',
                  icon: Dumbbell,
                },
                {
                  id: 'strength',
                  name: 'Strength',
                  desc: 'Focus on compound force output and full neurological rest periods.',
                  icon: ShieldCheck,
                },
                {
                  id: 'general_fitness',
                  name: 'General Fitness',
                  desc: 'Harmonious stamina, core stability, and total-body athletic wellness.',
                  icon: HeartPulse,
                },
                {
                  id: 'mobility',
                  name: 'Mobility',
                  desc: 'Lower-impact movement, controlled articulation, and active recovery.',
                  icon: Sparkles,
                },
              ].map((goal) => {
                const isSelected = mainGoal === goal.id;
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setMainGoal(goal.id as FitnessGoal)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 shadow-neon'
                        : 'bg-dark-850/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-500 text-dark-950 font-bold'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">{goal.name}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{goal.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Schedule (Days Per Week) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Calendar className="w-4 h-4 text-brand-neon" />
                <span>4. Workout Days Per Week</span>
              </div>
              <span className="text-xs font-semibold text-brand-neon">{workoutDays} Days / Week</span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[2, 3, 4, 5, 6].map((days) => {
                const isSelected = workoutDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setWorkoutDays(days)}
                    className={`py-3 px-2 rounded-xl text-center border font-bold text-sm transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-dark-950 border-brand-500 shadow-neon'
                        : 'bg-dark-850/40 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>{days} Days</div>
                    <span className="text-[10px] font-normal block opacity-80">
                      {days === 3 ? 'Recommended' : days >= 5 ? 'High Intensity' : 'Moderate'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Available Equipment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-white/5 pb-2">
              <Layers className="w-4 h-4 text-brand-neon" />
              <span>5. Available Equipment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'bodyweight',
                  name: 'Bodyweight',
                  desc: 'No equipment needed. Floor and wall movements.',
                  locked: true,
                },
                {
                  id: 'dumbbells',
                  name: 'Dumbbells / Kettlebells',
                  desc: 'Handheld free weights for progressive resistance.',
                  locked: false,
                },
                {
                  id: 'resistance_bands',
                  name: 'Resistance Bands',
                  desc: 'Elastic loop or tube bands for variable tension.',
                  locked: false,
                },
                {
                  id: 'gym_equipment',
                  name: 'Gym Equipment',
                  desc: 'Full gym setup with bars, benches, and machines.',
                  locked: false,
                },
              ].map((item) => {
                const isChecked = equipment.includes(item.id as EquipmentOption);
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.locked && toggleEquipment(item.id as EquipmentOption)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-brand-500/10 border-brand-500/40'
                        : 'bg-dark-850/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={item.locked}
                      readOnly
                      className="mt-1 h-4 w-4 rounded border-white/20 text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {item.locked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                            Always Available
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medical Notice */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
            <span className="font-semibold text-brand-400 block mb-0.5">Guidance Notice</span>
            Workout plans are general fitness guidance. Immediately stop if you feel pain, nausea, or dizziness. RepRight does not replace medical or physical therapy advice.
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel / Skip for Now
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
            >
              <span>{isEditing ? 'Save & Regenerate Plan' : 'Generate My Workout Plan'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
