import {
  UserProfile,
  WeeklyWorkoutPlan,
  PlanDay,
  PlanExercise,
  ExerciseVariation,
  FitnessGoal,
  FitnessLevel,
  EquipmentOption,
  PlanProgressMap,
} from '../types/plan';

// ============================================================================
// STORAGE KEYS
// ============================================================================
export const STORAGE_KEYS = {
  USER_PROFILE: 'repright_user_profile',
  WORKOUT_PLAN: 'repright_workout_plan',
  PLAN_PROGRESS: 'repright_plan_progress',
  ONBOARDED: 'repright_onboarded',
};

// ============================================================================
// MEDICAL & SAFETY DISCLAIMER
// ============================================================================
export const SAFETY_DISCLAIMER =
  'General Fitness Guidance Note: This personalized workout plan is provided for general fitness and educational purposes only. Always listen to your body and immediately stop exercising if you feel sharp pain, dizziness, nausea, or shortness of breath. RepRight does not provide medical advice or replace consultation with a physician or physical therapist.';

// ============================================================================
// COMPREHENSIVE EXERCISE VARIATIONS REPOSITORY
// ============================================================================
export const ALL_VARIATIONS: Record<string, ExerciseVariation[]> = {
  squat: [
    {
      id: 'chair_squat',
      name: 'Chair Squat',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Chair',
      instruction:
        'Stand in front of a chair with feet shoulder-width. Lower hips back until your glutes lightly tap the chair seat, then drive through your heels to stand tall.',
      recommendedSetsReps: '3 sets × 8–10 reps',
      isAiTracked: true,
      trackedExerciseId: 'squat',
      trackingLabel: 'AI Auto-Tracked (Squat Engine)',
      illustrationKey: 'chair_squat',
    },
    {
      id: 'bodyweight_squat',
      name: 'Bodyweight Squat',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Stand with feet shoulder-width apart, toes turned slightly out. Bend knees and hips simultaneously until thighs reach parallel with the floor, keeping your chest proud.',
      recommendedSetsReps: '3–4 sets × 12–15 reps',
      isAiTracked: true,
      trackedExerciseId: 'squat',
      trackingLabel: 'AI Auto-Tracked (Squat Engine)',
      illustrationKey: 'bodyweight_squat',
    },
    {
      id: 'goblet_squat',
      name: 'Goblet Squat',
      difficulty: 'Advanced',
      equipment: 'Dumbbells or Gym Weight',
      instruction:
        'Hold a dumbbell vertically against your sternum with elbows tucked. Sink into a deep parallel squat while keeping your spine straight and core braced.',
      recommendedSetsReps: '3–4 sets × 10–12 reps',
      isAiTracked: true,
      trackedExerciseId: 'squat',
      trackingLabel: 'AI Auto-Tracked (Squat Engine)',
      illustrationKey: 'goblet_squat',
    },
  ],

  pushup: [
    {
      id: 'wall_pushup',
      name: 'Wall Push-Up',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Wall',
      instruction:
        'Face a wall about arm’s length away. Place palms flat at shoulder height, bend elbows to lower chest near the wall, and push back with controlled tempo.',
      recommendedSetsReps: '3 sets × 10–12 reps',
      isAiTracked: false,
      trackingLabel: 'Guided Exercise (Timer & Audio Cues)',
      illustrationKey: 'wall_pushup',
    },
    {
      id: 'knee_pushup',
      name: 'Knee Push-Up',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Mat',
      instruction:
        'Position knees and hands on the mat, forming a straight slope from shoulders to knees. Lower your chest until elbows reach 90 degrees, then press back up.',
      recommendedSetsReps: '3 sets × 8–12 reps',
      isAiTracked: false,
      trackingLabel: 'Guided Exercise (Timer & Audio Cues)',
      illustrationKey: 'knee_pushup',
    },
    {
      id: 'standard_pushup',
      name: 'Standard Push-Up',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Start in a high plank with hands under shoulders. Keep your body rigid like a board as you lower chest to floor level and press up to full lockout.',
      recommendedSetsReps: '3 sets × 10–15 reps',
      isAiTracked: true,
      trackedExerciseId: 'pushup',
      trackingLabel: 'AI Auto-Tracked (Push-Up Engine)',
      illustrationKey: 'standard_pushup',
    },
    {
      id: 'diamond_pushup',
      name: 'Diamond / Close-Grip Push-Up',
      difficulty: 'Advanced',
      equipment: 'Bodyweight',
      instruction:
        'Bring hands together under center chest with thumbs and index fingers touching. Lower chest to hands for maximum tricep and inner chest activation.',
      recommendedSetsReps: '3–4 sets × 8–12 reps',
      isAiTracked: true,
      trackedExerciseId: 'pushup',
      trackingLabel: 'AI Auto-Tracked (Push-Up Engine)',
      illustrationKey: 'diamond_pushup',
    },
  ],

  lunge: [
    {
      id: 'supported_reverse_lunge',
      name: 'Supported Reverse Lunge',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Wall Support',
      instruction:
        'Lightly touch a wall or chair for balance. Step one foot backward and drop the rear knee toward the floor until both knees form 90-degree angles.',
      recommendedSetsReps: '3 sets × 8 reps / leg',
      isAiTracked: true,
      trackedExerciseId: 'lunge',
      trackingLabel: 'AI Auto-Tracked (Lunge Engine)',
      illustrationKey: 'supported_lunge',
    },
    {
      id: 'bodyweight_reverse_lunge',
      name: 'Bodyweight Reverse Lunge',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Take a smooth step backward, lower hips until back knee hovers 1 inch above the floor, and push through front heel to return to standing.',
      recommendedSetsReps: '3 sets × 10–12 reps / leg',
      isAiTracked: true,
      trackedExerciseId: 'lunge',
      trackingLabel: 'AI Auto-Tracked (Lunge Engine)',
      illustrationKey: 'reverse_lunge',
    },
    {
      id: 'dumbbell_lunge',
      name: 'Dumbbell Walking / Static Lunge',
      difficulty: 'Advanced',
      equipment: 'Dumbbells',
      instruction:
        'Hold dumbbells at sides with tall posture and shoulders pinned back. Step smoothly into a deep 90-degree lunge without letting front knee collapse inward.',
      recommendedSetsReps: '3–4 sets × 10–12 reps / leg',
      isAiTracked: true,
      trackedExerciseId: 'lunge',
      trackingLabel: 'AI Auto-Tracked (Lunge Engine)',
      illustrationKey: 'dumbbell_lunge',
    },
  ],

  bicep_curl: [
    {
      id: 'band_curl',
      name: 'Resistance-Band Curl',
      difficulty: 'Beginner',
      equipment: 'Resistance Bands',
      instruction:
        'Stand securely on the band with feet hip-width. Curl handles toward shoulders while pinning your elbows against your ribs, feeling peak resistance at top.',
      recommendedSetsReps: '3 sets × 12–15 reps',
      isAiTracked: true,
      trackedExerciseId: 'bicep_curl',
      trackingLabel: 'AI Auto-Tracked (Bicep Curl Engine)',
      illustrationKey: 'band_curl',
    },
    {
      id: 'dumbbell_curl',
      name: 'Dumbbell Bicep Curl',
      difficulty: 'Intermediate',
      equipment: 'Dumbbells',
      instruction:
        'Hold dumbbells at thighs with palms forward. Curl upward with controlled tempo, squeezing biceps at top for a 1-second pause without swinging your torso.',
      recommendedSetsReps: '3 sets × 10–12 reps',
      isAiTracked: true,
      trackedExerciseId: 'bicep_curl',
      trackingLabel: 'AI Auto-Tracked (Bicep Curl Engine)',
      illustrationKey: 'dumbbell_curl',
    },
    {
      id: 'alternating_curl',
      name: 'Alternating Supinated Curl',
      difficulty: 'Advanced',
      equipment: 'Dumbbells',
      instruction:
        'Curl one dumbbell at a time, rotating your wrist outward as you ascend to target the long bicep head. Lower slowly before alternating arms.',
      recommendedSetsReps: '3–4 sets × 10–12 reps / arm',
      isAiTracked: true,
      trackedExerciseId: 'bicep_curl',
      trackingLabel: 'AI Auto-Tracked (Bicep Curl Engine)',
      illustrationKey: 'alternating_curl',
    },
  ],

  plank: [
    {
      id: 'knee_plank',
      name: 'Knee Plank Hold',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Mat',
      instruction:
        'Rest forearms on the floor directly beneath shoulders. Keep knees grounded and squeeze glutes and abs to form an unbroken diagonal line from shoulders to knees.',
      recommendedSetsReps: '3 sets × 20–30s hold',
      isAiTracked: false,
      trackingLabel: 'Guided Exercise (Timer & Audio Cues)',
      illustrationKey: 'knee_plank',
    },
    {
      id: 'standard_plank',
      name: 'Standard Forearm Plank',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Plant forearms under shoulders and extend legs back on toes. Pull belly button toward spine and maintain a rigid, flat body line without sagging or piking.',
      recommendedSetsReps: '3 sets × 35–45s hold',
      isAiTracked: true,
      trackedExerciseId: 'plank',
      trackingLabel: 'AI Auto-Tracked (Plank Engine)',
      illustrationKey: 'standard_plank',
    },
    {
      id: 'shoulder_tap_plank',
      name: 'Shoulder-Tap Plank',
      difficulty: 'Advanced',
      equipment: 'Bodyweight',
      instruction:
        'From high plank position with feet slightly wider than shoulders, tap left shoulder with right hand, then alternate. Prevent hips from rotating or swaying.',
      recommendedSetsReps: '3 sets × 16–20 taps',
      isAiTracked: false,
      trackingLabel: 'Guided Exercise (Timer & Audio Cues)',
      illustrationKey: 'shoulder_tap_plank',
    },
  ],

  shoulder_press: [
    {
      id: 'band_press',
      name: 'Resistance-Band Overhead Press',
      difficulty: 'Beginner',
      equipment: 'Resistance Bands',
      instruction:
        'Stand on the middle of the band, bring handles to ear height, and press straight overhead until arms lock out smoothly without hyperextending your spine.',
      recommendedSetsReps: '3 sets × 10–12 reps',
      isAiTracked: true,
      trackedExerciseId: 'shoulder_press',
      trackingLabel: 'AI Auto-Tracked (Shoulder Press Engine)',
      illustrationKey: 'band_press',
    },
    {
      id: 'dumbbell_press',
      name: 'Dumbbell Overhead Press',
      difficulty: 'Intermediate',
      equipment: 'Dumbbells',
      instruction:
        'Hold dumbbells at ear level with palms facing forward. Press vertically until weights meet overhead, maintaining tight abdominal bracing.',
      recommendedSetsReps: '3–4 sets × 8–10 reps',
      isAiTracked: true,
      trackedExerciseId: 'shoulder_press',
      trackingLabel: 'AI Auto-Tracked (Shoulder Press Engine)',
      illustrationKey: 'dumbbell_press',
    },
    {
      id: 'single_arm_press',
      name: 'Single-Arm Press with Core Anti-Rotation',
      difficulty: 'Advanced',
      equipment: 'Dumbbells',
      instruction:
        'Press a single dumbbell overhead while keeping your torso completely perpendicular to the floor, actively resisting sideways lean or spinal twist.',
      recommendedSetsReps: '3 sets × 8–10 reps / side',
      isAiTracked: true,
      trackedExerciseId: 'shoulder_press',
      trackingLabel: 'AI Auto-Tracked (Shoulder Press Engine)',
      illustrationKey: 'dumbbell_press',
    },
  ],

  situp: [
    {
      id: 'floor_crunch',
      name: 'Floor Abdominal Crunch',
      difficulty: 'Beginner',
      equipment: 'Bodyweight & Mat',
      instruction:
        'Lie on back with knees bent and feet flat. Contract upper abdominals to lift shoulder blades 3–4 inches off the floor while keeping your neck relaxed.',
      recommendedSetsReps: '3 sets × 12–15 reps',
      isAiTracked: true,
      trackedExerciseId: 'situp',
      trackingLabel: 'AI Auto-Tracked (Sit-Up Engine)',
      illustrationKey: 'floor_crunch',
    },
    {
      id: 'standard_situp',
      name: 'Full Sit-Up',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Cross arms over chest or fingertips by temples. Use your abdominal wall to curl all the way up until elbows touch your knees, then lower smoothly.',
      recommendedSetsReps: '3 sets × 12–15 reps',
      isAiTracked: true,
      trackedExerciseId: 'situp',
      trackingLabel: 'AI Auto-Tracked (Sit-Up Engine)',
      illustrationKey: 'situp',
    },
    {
      id: 'butterfly_situp',
      name: 'Butterfly Sit-Up',
      difficulty: 'Advanced',
      equipment: 'Bodyweight',
      instruction:
        'Place soles of feet together with knees dropped open. Touch the floor behind your head, then sit all the way up and touch the tips of your toes.',
      recommendedSetsReps: '3–4 sets × 15–20 reps',
      isAiTracked: true,
      trackedExerciseId: 'situp',
      trackingLabel: 'AI Auto-Tracked (Sit-Up Engine)',
      illustrationKey: 'situp',
    },
  ],

  jumping_jack: [
    {
      id: 'step_jack',
      name: 'Step Jack (Low Impact)',
      difficulty: 'Beginner',
      equipment: 'Bodyweight',
      instruction:
        'Step right foot out while sweeping both arms overhead, then return to center and alternate with the left foot. Zero joint impact, elevated heart rate.',
      recommendedSetsReps: '3 sets × 30s continuous',
      isAiTracked: false,
      trackingLabel: 'Guided Exercise (Timer & Audio Cues)',
      illustrationKey: 'step_jack',
    },
    {
      id: 'standard_jumping_jack',
      name: 'Standard Jumping Jack',
      difficulty: 'Intermediate',
      equipment: 'Bodyweight',
      instruction:
        'Jump feet wide while bringing arms overhead into an arc. Land softly on the balls of your feet with knees slightly bent to absorb impact.',
      recommendedSetsReps: '3 sets × 25–30 reps',
      isAiTracked: true,
      trackedExerciseId: 'jumping_jack',
      trackingLabel: 'AI Auto-Tracked (Jumping Jack Engine)',
      illustrationKey: 'jumping_jack',
    },
    {
      id: 'power_jack',
      name: 'Power Squat Jack',
      difficulty: 'Advanced',
      equipment: 'Bodyweight',
      instruction:
        'Jump feet out and sink immediately into a quarter-squat as arms reach overhead, then spring explosively back to center standing position.',
      recommendedSetsReps: '3 sets × 20–25 reps',
      isAiTracked: true,
      trackedExerciseId: 'jumping_jack',
      trackingLabel: 'AI Auto-Tracked (Jumping Jack Engine)',
      illustrationKey: 'jumping_jack',
    },
  ],
};

// ============================================================================
// HELPER: FILTER AND SELECT VARIATIONS ACCORDING TO USER PROFILE
// ============================================================================
export const getFilteredVariations = (
  baseExerciseKey: string,
  profile: Pick<UserProfile, 'fitnessLevel' | 'equipment' | 'mainGoal'>
): { variations: ExerciseVariation[]; defaultVariationId: string } => {
  const allForEx = ALL_VARIATIONS[baseExerciseKey] || ALL_VARIATIONS['squat'];
  const hasDumbbells = profile.equipment.includes('dumbbells') || profile.equipment.includes('gym_equipment');
  const hasBands = profile.equipment.includes('resistance_bands');

  // Filter variations compatible with available equipment
  let compatible = allForEx.filter((v) => {
    const eq = v.equipment.toLowerCase();
    if (eq.includes('dumbbell') && !hasDumbbells) return false;
    if (eq.includes('resistance band') && !hasBands && !hasDumbbells) return false;
    return true;
  });

  // Always keep at least 2 variations (fallback to all if filter was too restrictive)
  if (compatible.length < 2) {
    compatible = allForEx;
  }

  // Cap to 2-3 variations as requested
  const variations = compatible.slice(0, 3);

  // Pick default based on user level
  let defaultVar = variations[0];
  if (profile.fitnessLevel === 'beginner') {
    defaultVar = variations.find((v) => v.difficulty === 'Beginner') || variations[0];
  } else if (profile.fitnessLevel === 'intermediate') {
    defaultVar = variations.find((v) => v.difficulty === 'Intermediate') || variations[0];
  } else if (profile.fitnessLevel === 'advanced') {
    defaultVar =
      variations.find((v) => v.difficulty === 'Advanced') ||
      variations.find((v) => v.difficulty === 'Intermediate') ||
      variations[0];
  }

  return {
    variations,
    defaultVariationId: defaultVar.id,
  };
};

// ============================================================================
// WORKOUT PLAN GENERATOR
// ============================================================================
export const generateWorkoutPlan = (profile: UserProfile): WeeklyWorkoutPlan => {
  const { fitnessLevel, mainGoal, workoutDaysPerWeek } = profile;

  // Reps & sets scaling by fitness level
  const setMulti = fitnessLevel === 'beginner' ? 2 : fitnessLevel === 'intermediate' ? 3 : 4;
  const restGuidance =
    mainGoal === 'strength'
      ? 'Rest 90–120s between sets for full neural recovery'
      : mainGoal === 'weight_loss'
      ? 'Keep rest tight at 45–60s to maintain elevated heart rate'
      : mainGoal === 'mobility'
      ? 'Rest 45s between movements with slow, controlled breathing'
      : 'Rest 60s between sets to balance strength and conditioning';

  // Build Day Templates based on Goal and Days per week
  const days: PlanDay[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Determine active workout day indices based on frequency (2 to 6 days)
  let activeDayIndices: number[] = [0, 2, 4]; // default 3 days
  if (workoutDaysPerWeek === 2) {
    activeDayIndices = [0, 3]; // Mon, Thu
  } else if (workoutDaysPerWeek === 3) {
    activeDayIndices = [0, 2, 4]; // Mon, Wed, Fri
  } else if (workoutDaysPerWeek === 4) {
    activeDayIndices = [0, 1, 3, 4]; // Mon, Tue, Thu, Fri
  } else if (workoutDaysPerWeek === 5) {
    activeDayIndices = [0, 1, 2, 4, 5]; // Mon, Tue, Wed, Fri, Sat
  } else if (workoutDaysPerWeek === 6) {
    activeDayIndices = [0, 1, 2, 3, 4, 5]; // Mon-Sat
  }

  // Create exercises helper
  const createExercise = (baseKey: string, customSets?: number, customReps?: string): PlanExercise => {
    const { variations, defaultVariationId } = getFilteredVariations(baseKey, profile);
    const selectedVar = variations.find((v) => v.id === defaultVariationId) || variations[0];

    return {
      id: `${baseKey}_${Math.random().toString(36).substr(2, 6)}`,
      exerciseId: baseKey,
      name: selectedVar.name,
      category:
        baseKey === 'squat' || baseKey === 'lunge'
          ? 'legs'
          : baseKey === 'pushup' || baseKey === 'shoulder_press'
          ? 'push'
          : baseKey === 'bicep_curl'
          ? 'pull'
          : baseKey === 'plank' || baseKey === 'situp'
          ? 'core'
          : 'full-body',
      targetSets: customSets || setMulti,
      targetRepsOrDuration: customReps || selectedVar.recommendedSetsReps,
      restGuidance,
      selectedVariationId: defaultVariationId,
      variations,
    };
  };

  // Build each of the 7 calendar days
  for (let i = 0; i < 7; i++) {
    const dayNumber = i + 1;
    const dayName = `Day ${dayNumber} - ${dayNames[i]}`;
    const isWorkoutDay = activeDayIndices.includes(i);

    if (!isWorkoutDay) {
      // Recovery Day
      days.push({
        dayNumber,
        dayName,
        title: i % 2 === 1 ? 'Active Recovery & Gentle Mobility' : 'Full Rest & Muscle Repair',
        focus:
          mainGoal === 'mobility'
            ? 'Light dynamic stretching, diaphragmatic breathing, and joint decompression.'
            : 'Allow muscle tissues and central nervous system to rebuild. Focus on hydration, quality sleep, and light walking.',
        isRestDay: true,
        recoveryTip:
          'Take a 20-minute relaxed walk, drink 2.5–3L water, and aim for 8 hours of restorative sleep.',
        exercises: [],
      });
      continue;
    }

    // Workout Day - Customize routine by user goal
    let dayTitle = 'Full-Body Foundation';
    let dayFocus = 'Balanced compound movements to build baseline athletic capacity.';
    let dayExercises: PlanExercise[] = [];

    if (mainGoal === 'weight_loss') {
      // Prioritize balanced mix of strength training, light cardio (jumping jacks), core, and gradual progression
      if (i === 0 || i === 1) {
        dayTitle = 'Metabolic Strength & Cardio Burst';
        dayFocus = 'High-density circuit pairing lower body power with cardio intervals for elevated caloric expenditure.';
        dayExercises = [
          createExercise('squat', setMulti, fitnessLevel === 'beginner' ? '10–12 reps' : '15–20 reps'),
          createExercise('jumping_jack', setMulti, '30–45s paced tempo'),
          createExercise('pushup', setMulti, fitnessLevel === 'beginner' ? '8–10 reps' : '12–15 reps'),
          createExercise('plank', setMulti, fitnessLevel === 'beginner' ? '25s hold' : '45s hold'),
        ];
      } else if (i === 2 || i === 3) {
        dayTitle = 'Full-Body Calorie Burn & Core Sculpt';
        dayFocus = 'Unilateral leg strength combined with core stability and cardio conditioning.';
        dayExercises = [
          createExercise('lunge', setMulti, '10–12 reps / leg'),
          createExercise('jumping_jack', setMulti, '30–45s continuous'),
          createExercise('bicep_curl', setMulti, '12–15 reps'),
          createExercise('situp', setMulti, '15 reps with steady breathing'),
        ];
      } else {
        dayTitle = 'Cardio-Strength Hybrid Finale';
        dayFocus = 'Total body endurance challenge designed to maximize afterburn (EPOC).';
        dayExercises = [
          createExercise('squat', setMulti, '15 reps'),
          createExercise('shoulder_press', setMulti, '10–12 reps'),
          createExercise('jumping_jack', setMulti, '40s high-cadence'),
          createExercise('plank', setMulti, '40s isometric brace'),
        ];
      }
    } else if (mainGoal === 'muscle_gain' || mainGoal === 'strength') {
      // Prioritize progressive resistance work and recovery
      if (i === 0 || i === 1) {
        dayTitle = 'Upper-Body Hypertrophy & Press Power';
        dayFocus = 'Progressive loading for chest, shoulders, and arms with strict eccentric control.';
        dayExercises = [
          createExercise('pushup', setMulti, fitnessLevel === 'advanced' ? '12–15 reps' : '8–12 reps'),
          createExercise('shoulder_press', setMulti, '8–10 reps (controlled lowering)'),
          createExercise('bicep_curl', setMulti, '10–12 reps with 1s peak squeeze'),
          createExercise('plank', setMulti, '45s solid core lockout'),
        ];
      } else if (i === 2 || i === 3) {
        dayTitle = 'Lower-Body Power & Leg Drive';
        dayFocus = 'Targeting quadriceps, hamstrings, and glute activation through full range of motion.';
        dayExercises = [
          createExercise('squat', setMulti, '10–12 deep reps'),
          createExercise('lunge', setMulti, '10 reps / leg'),
          createExercise('situp', setMulti, '15 controlled reps'),
          createExercise('plank', setMulti, '40s brace'),
        ];
      } else {
        dayTitle = 'Total Body Compound Overload';
        dayFocus = 'Compound multi-joint integration to build full-body structural density.';
        dayExercises = [
          createExercise('squat', setMulti, '12 reps'),
          createExercise('pushup', setMulti, '10–12 reps'),
          createExercise('shoulder_press', setMulti, '10 reps'),
          createExercise('bicep_curl', setMulti, '12 reps'),
        ];
      }
    } else if (mainGoal === 'mobility') {
      // Lower-impact movement, controlled pause, and recovery-focused sessions
      dayTitle = i === 0 ? 'Hip & Lower-Body Mobility Flow' : i === 2 ? 'Thoracic Spine & Postural Restoration' : 'Core Stability & Fluid Movement';
      dayFocus = 'Slow-tempo joint articulation, controlled eccentric contractions, and isometric posture reinforcement.';
      dayExercises = [
        createExercise('squat', setMulti, '8–10 slow reps (3s down, 2s pause at bottom)'),
        createExercise('lunge', setMulti, '6–8 smooth reps / leg with tall spine'),
        createExercise('plank', setMulti, '20–30s hold focused on deep abdominal breathing'),
        createExercise('situp', setMulti, '8–10 gentle crunches with chin tucked'),
      ];
    } else {
      // General Fitness - Balanced functional routine
      dayTitle = i === 0 ? 'Full-Body Strength & Stamina' : i === 2 ? 'Athletic Conditioning & Core Control' : 'Functional Power & Longevity';
      dayFocus = 'All-around athletic conditioning balancing cardiovascular vitality, posture, and muscular endurance.';
      dayExercises = [
        createExercise('squat', setMulti, '12–15 reps'),
        createExercise('pushup', setMulti, '10–12 reps'),
        createExercise('jumping_jack', setMulti, '30s cardio warm-up/interval'),
        createExercise('bicep_curl', setMulti, '12 reps'),
        createExercise('plank', setMulti, '30–45s hold'),
      ];
    }

    days.push({
      dayNumber,
      dayName,
      title: dayTitle,
      focus: dayFocus,
      isRestDay: false,
      exercises: dayExercises,
    });
  }

  // Generate weekly guidance message
  let weeklyGuidance = '';
  if (mainGoal === 'weight_loss') {
    weeklyGuidance =
      'Focus on completing every workout session with consistent pacing. Keep rest intervals brief, prioritize fluid form over raw speed, and stay active during your recovery days with gentle walking.';
  } else if (mainGoal === 'muscle_gain' || mainGoal === 'strength') {
    weeklyGuidance =
      'Progressively challenge your muscles by focusing on the eccentric (lowering) phase of each rep. Ensure adequate dietary protein and take rest days seriously so muscle fibers can repair and adapt.';
  } else if (mainGoal === 'mobility') {
    weeklyGuidance =
      'Prioritize smooth, pain-free range of motion. Do not force joints beyond comfort; breathe deeply into each movement to relax tense muscles and improve joint lubrication.';
  } else {
    weeklyGuidance =
      'Consistency is your superpower. Strive to complete all scheduled workouts this week, use the AI coach to refine your squat and posture depth, and enjoy moving your body every single day.';
  }

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userGoal: mainGoal,
    fitnessLevel,
    workoutDaysPerWeek,
    equipment: profile.equipment,
    days,
    weeklyGuidance,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
};

// ============================================================================
// LOCAL STORAGE PERSISTENCE HELPERS
// ============================================================================
export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
};

export const getUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse user profile from localStorage:', err);
    return null;
  }
};

export const saveWorkoutPlan = (plan: WeeklyWorkoutPlan): void => {
  localStorage.setItem(STORAGE_KEYS.WORKOUT_PLAN, JSON.stringify(plan));
};

export const getWorkoutPlan = (): WeeklyWorkoutPlan | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_PLAN);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse workout plan from localStorage:', err);
    return null;
  }
};

export const getPlanProgress = (): PlanProgressMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAN_PROGRESS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse plan progress from localStorage:', err);
    return {};
  }
};

export const savePlanProgress = (progress: PlanProgressMap): void => {
  localStorage.setItem(STORAGE_KEYS.PLAN_PROGRESS, JSON.stringify(progress));
};

export const markDayCompleted = (dayNumber: number, isCompleted: boolean): PlanProgressMap => {
  const current = getPlanProgress();
  current[dayNumber] = {
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : undefined,
    completedExercises: current[dayNumber]?.completedExercises || [],
  };
  savePlanProgress(current);
  return { ...current };
};

export const toggleExerciseCompleted = (
  dayNumber: number,
  exerciseId: string
): PlanProgressMap => {
  const current = getPlanProgress();
  const dayProg = current[dayNumber] || { isCompleted: false, completedExercises: [] };
  const completedList = dayProg.completedExercises || [];

  const isAlreadyDone = completedList.includes(exerciseId);
  const nextList = isAlreadyDone
    ? completedList.filter((id) => id !== exerciseId)
    : [...completedList, exerciseId];

  current[dayNumber] = {
    ...dayProg,
    completedExercises: nextList,
  };
  savePlanProgress(current);
  return { ...current };
};

export const updateExerciseVariation = (
  dayNumber: number,
  exerciseId: string,
  newVariationId: string
): WeeklyWorkoutPlan | null => {
  const plan = getWorkoutPlan();
  if (!plan) return null;

  const targetDay = plan.days.find((d) => d.dayNumber === dayNumber);
  if (!targetDay) return plan;

  const targetEx = targetDay.exercises.find((e) => e.id === exerciseId);
  if (!targetEx) return plan;

  const matchedVar = targetEx.variations.find((v) => v.id === newVariationId);
  if (matchedVar) {
    targetEx.selectedVariationId = newVariationId;
    targetEx.name = matchedVar.name;
    targetEx.targetRepsOrDuration = matchedVar.recommendedSetsReps;
    plan.updatedAt = new Date().toISOString();
    saveWorkoutPlan(plan);
  }

  return { ...plan };
};
