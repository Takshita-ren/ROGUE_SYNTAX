import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  Camera,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  FlipHorizontal,
  ChevronRight,
  Timer,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { getPoseLandmarker } from '../utils/poseLandmarker';
import { ExerciseEngine } from '../utils/exerciseEngine';
import { EXERCISE_CONFIGS, EXERCISE_LIST } from '../utils/exerciseConfigs';
import { drawSkeleton } from '../utils/skeletonDrawer';
import { audioEngine } from '../utils/audioChime';
import {
  ExerciseAnalysisFrame,
  ExerciseConfig,
  WorkoutSessionSummary,
} from '../types/pose';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

export const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId?: string }>();

  // Resolve active exercise configuration
  const activeExerciseKey = exerciseId && EXERCISE_CONFIGS[exerciseId] ? exerciseId : 'squat';
  const exerciseConfig: ExerciseConfig = EXERCISE_CONFIGS[activeExerciseKey];

  // Webcam Hook
  const {
    videoRef,
    stream,
    isLoading: isCameraLoading,
    error: cameraError,
    devices,
    selectedDeviceId,
    isMirrored,
    startCamera,
    stopCamera,
    toggleMirror,
    selectDevice,
    retry: retryCamera,
  } = useWebcam();

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State Management
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Real-time Metrics
  const [repCount, setRepCount] = useState<number>(0);
  const [incompleteCount, setIncompleteCount] = useState<number>(0);
  const [holdSeconds, setHoldSeconds] = useState<number>(0);
  const [currentPrimaryAngle, setCurrentPrimaryAngle] = useState<number>(175);
  const [movementPhase, setMovementPhase] = useState<string>('READY');
  const [activeFeedback, setActiveFeedback] = useState<string>(exerciseConfig.camera.setupTip);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(0);
  const [isPositionedWell, setIsPositionedWell] = useState<boolean>(false);
  const [isLowVisibilityPaused, setIsLowVisibilityPaused] = useState<boolean>(false);

  // Target Goal & Set Completion
  const [targetGoal, setTargetGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`repright_target_${exerciseConfig.id}`);
    if (saved) return parseInt(saved, 10);
    return exerciseConfig.mode === 'hold'
      ? exerciseConfig.defaultTargetHoldSeconds || 45
      : exerciseConfig.defaultTargetReps || 15;
  });
  const [isGoalCompleted, setIsGoalCompleted] = useState<boolean>(false);

  // Settings & Modals
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showExerciseSwitcher, setShowExerciseSwitcher] = useState<boolean>(false);

  // Timer & Session Duration
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const workoutStartTimeRef = useRef<string>('');

  // Refs for State Machine & MediaPipe
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const engineRef = useRef<ExerciseEngine | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const isPausedRef = useRef<boolean>(false);

  // Keep isPausedRef synced
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Sync engine when exerciseConfig changes
  useEffect(() => {
    engineRef.current = new ExerciseEngine(
      exerciseConfig,
      (_completedRep) => {
        audioEngine.playRepCompleteSound();
      },
      (_incompleteReason) => {
        audioEngine.playNoticeSound();
      },
      () => {
        // Target reached callback
        setIsGoalCompleted(true);
        audioEngine.playRepCompleteSound();
      }
    );

    setRepCount(0);
    setIncompleteCount(0);
    setHoldSeconds(0);
    setIsGoalCompleted(false);
    setActiveFeedback(exerciseConfig.camera.setupTip);

    return () => {
      engineRef.current = null;
    };
  }, [exerciseConfig]);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isCancelled = false;
    setIsModelLoading(true);
    setModelError(null);

    getPoseLandmarker()
      .then((landmarker) => {
        if (!isCancelled) {
          landmarkerRef.current = landmarker;
          setIsModelLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load PoseLandmarker:', err);
          setModelError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize computer vision model. Check your internet connection.'
          );
          setIsModelLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Workout Timer logic
  useEffect(() => {
    if (isWorkoutActive && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isWorkoutActive, isPaused]);

  // Main Computer Vision & Pose Inference Loop
  const runInferenceLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    const engine = engineRef.current;

    if (!video || !canvas || !landmarker || !engine) {
      animFrameIdRef.current = requestAnimationFrame(runInferenceLoop);
      return;
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      const currentTime = video.currentTime;

      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;

        try {
          const startTimeMs = performance.now();
          const results = landmarker.detectForVideo(video, startTimeMs);
          const landmarks = results.landmarks && results.landmarks.length > 0 ? results.landmarks[0] : null;

          if (landmarks && isWorkoutActive && !isPausedRef.current) {
            const frame: ExerciseAnalysisFrame = engine.update(landmarks, startTimeMs);

            setRepCount(frame.validReps);
            setIncompleteCount(frame.incompleteAttempts);
            setHoldSeconds(frame.holdSeconds);
            setCurrentPrimaryAngle(frame.primaryAngle);
            setMovementPhase(frame.state);
            setTrackingConfidence(frame.confidence);
            setIsPositionedWell(frame.isPositionedWell);
            setIsLowVisibilityPaused(frame.isPausedLowVisibility);

            if (frame.feedback.length > 0) {
              setActiveFeedback(frame.feedback[0]);
            }
          } else if (!landmarks) {
            setTrackingConfidence(0);
            if (isWorkoutActive && !isPausedRef.current) {
              engine.update(null, startTimeMs);
              setActiveFeedback('No pose detected. Position yourself in camera.');
            }
          }

          // Render skeleton canvas with per-exercise joint/bone highlights
          if (ctx) {
            if (showSkeleton && landmarks) {
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height, {
                mirrored: isMirrored,
                showAngleBadges: true,
                currentPrimaryAngle: currentPrimaryAngle,
                primaryAngleLabel: exerciseConfig.trackedAngles[0]?.label,
                squatState: movementPhase,
                highlightJoints: exerciseConfig.highlightJoints,
                highlightBones: exerciseConfig.highlightBones,
              });
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        } catch (inferErr) {
          console.warn('Inference error:', inferErr);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(runInferenceLoop);
  }, [
    videoRef,
    isWorkoutActive,
    showSkeleton,
    isMirrored,
    currentPrimaryAngle,
    movementPhase,
    exerciseConfig,
  ]);

  // Start inference loop when video stream is active
  useEffect(() => {
    if (stream && !isModelLoading && !modelError) {
      animFrameIdRef.current = requestAnimationFrame(runInferenceLoop);
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [stream, isModelLoading, modelError, runInferenceLoop]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  // Workout Controls
  const handleStartWorkout = async () => {
    if (!stream) {
      const ok = await startCamera();
      if (!ok) return;
    }
    engineRef.current?.reset();
    setRepCount(0);
    setIncompleteCount(0);
    setHoldSeconds(0);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsGoalCompleted(false);
    workoutStartTimeRef.current = new Date().toISOString();
    setIsWorkoutActive(true);
    setActiveFeedback(exerciseConfig.camera.setupTip);
  };

  const handlePauseWorkout = () => {
    setIsPaused(true);
  };

  const handleResumeWorkout = () => {
    setIsPaused(false);
  };

  const handleEndWorkout = () => {
    const stats = engineRef.current?.getStats();
    const endTime = new Date().toISOString();
    const duration = elapsedSeconds;

    const isHoldMode = exerciseConfig.mode === 'hold';

    const summary: WorkoutSessionSummary = {
      session_id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exercise_type: exerciseConfig.name,
      exercise_id: exerciseConfig.id,
      start_time: workoutStartTimeRef.current || new Date(Date.now() - duration * 1000).toISOString(),
      end_time: endTime,
      duration_seconds: duration,
      valid_reps: isHoldMode ? Math.floor(stats?.holdSeconds ?? holdSeconds) : (stats?.validReps ?? repCount),
      incomplete_attempts: stats?.incompleteAttempts ?? incompleteCount,
      reps: isHoldMode ? undefined : (stats?.validReps ?? repCount),
      hold_seconds: isHoldMode ? (stats?.holdSeconds ?? holdSeconds) : undefined,
      feedback_summary: stats?.feedbackSummary ?? [],
      rep_data: stats?.repHistory ?? [],
    };

    sessionStorage.setItem('current_workout_summary', JSON.stringify(summary));

    setIsWorkoutActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    navigate('/summary');
  };

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isHoldMode = exerciseConfig.mode === 'hold';
  const progressPercent = isHoldMode
    ? Math.min(100, (holdSeconds / Math.max(1, targetGoal)) * 100)
    : Math.min(100, (repCount / Math.max(1, targetGoal)) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar / Exercise Details */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-dark-900 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-neon">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{exerciseConfig.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500/10 text-brand-neon border border-brand-500/20">
                {exerciseConfig.category}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-850 text-slate-300 border border-white/5">
                {isHoldMode ? 'Timed Hold' : 'Reps'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {exerciseConfig.camera.recommendedView.toUpperCase()} VIEW &bull; {exerciseConfig.camera.setupTip}
            </p>
          </div>
        </div>

        {/* Workout Actions & Timer */}
        <div className="flex items-center gap-3">
          {/* Change Exercise Button */}
          <button
            onClick={() => setShowExerciseSwitcher(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-xs font-semibold text-slate-300 hover:text-white border border-white/5 transition-all"
          >
            <Layers className="w-4 h-4 text-brand-neon" />
            <span>Switch Exercise</span>
          </button>

          {/* Workout Timer */}
          <div className="px-4 py-2 rounded-xl bg-dark-850 border border-white/5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Elapsed Time
            </span>
            <span className="font-mono text-xl font-bold text-white">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-white/5 transition-colors"
            title="Form Guide & Camera Positioning"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Video Preview & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Camera Viewport (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Live HTML5 Video element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onLoadedMetadata={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
            />

            {/* Overlaid Skeleton Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover canvas-skeleton pointer-events-none"
            />

            {/* Inactive or Loading Camera Overlay */}
            {!stream && (
              <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                {isCameraLoading || isModelLoading ? (
                  <div className="space-y-4">
                    <RefreshCw className="w-12 h-12 text-brand-neon animate-spin mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {isModelLoading ? 'Loading MediaPipe AI Model...' : 'Accessing Webcam...'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Preparing real-time landmark tracking pipeline for {exerciseConfig.name}...
                      </p>
                    </div>
                  </div>
                ) : cameraError || modelError ? (
                  <div className="max-w-md space-y-4">
                    <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Initialization Error</h3>
                      <p className="text-xs text-slate-400 mb-4">{cameraError || modelError}</p>
                      <button
                        onClick={retryCamera}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all shadow-neon"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry Camera</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-neon flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Camera Inactive</h3>
                      <p className="text-sm text-slate-400 mb-6">
                        Allow webcam access to track {exerciseConfig.name} form in real-time. Video is processed 100% locally on your device.
                      </p>
                      <button
                        onClick={handleStartWorkout}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-base transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-dark-950" />
                        <span>Enable Camera & Begin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overlaid Live HUD when Active */}
            {stream && (
              <>
                {/* Top HUD: Status badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        trackingConfidence > 0.5 ? 'bg-brand-neon animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span>
                      {trackingConfidence > 0.5
                        ? `TRACKING (${Math.round(trackingConfidence * 100)}%)`
                        : 'POSITIONING'}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-300">
                    PHASE: <span className="text-brand-neon uppercase font-bold">{movementPhase}</span>
                  </div>

                  {isLowVisibilityPaused && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-500/80 backdrop-blur-md text-xs font-bold text-white border border-rose-400 animate-pulse">
                      PAUSED: MOVE BACK INTO VIEW
                    </div>
                  )}
                </div>

                {/* Top Right HUD: Live Joint Angle */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {exerciseConfig.trackedAngles[0]?.label || 'Primary Angle'}
                    </span>
                    <span className="text-2xl font-black text-brand-neon font-mono">
                      {Math.round(currentPrimaryAngle)}°
                    </span>
                  </div>
                </div>

                {/* Target Reached Banner */}
                {isGoalCompleted && (
                  <div className="absolute top-20 inset-x-8 z-20 p-3 rounded-xl bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md text-white text-center font-bold text-sm shadow-neon flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
                    <span>Target Goal Reached! Excellent set completion.</span>
                  </div>
                )}

                {/* Bottom HUD: Live Form Feedback Banner */}
                <div className="absolute bottom-4 inset-x-4 z-10 flex flex-col items-center gap-2">
                  <div className="w-full max-w-lg px-4 py-3 rounded-xl bg-dark-900/90 backdrop-blur-md border border-brand-500/30 text-center shadow-neon flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-neon flex-shrink-0" />
                    <span className="text-sm font-semibold text-white truncate">
                      {activeFeedback}
                    </span>
                  </div>

                  {trackingConfidence === 0 && (
                    <div className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>If screen is black: check camera privacy shutter or switch camera in dropdown below.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Camera & Overlay Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-dark-900 border border-white/5 text-xs text-slate-400">
            {/* Left Controls: Devices & Mirroring */}
            <div className="flex flex-wrap items-center gap-3">
              {devices.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-neon" />
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => selectDevice(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-dark-850 border border-white/10 text-xs text-slate-200 outline-none focus:border-brand-500 max-w-[200px] sm:max-w-xs truncate"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={toggleMirror}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 transition-colors"
                title="Mirror camera display"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>{isMirrored ? 'Mirrored' : 'Normal'}</span>
              </button>
            </div>

            {/* Right Controls: Skeleton & Sound Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  showSkeleton
                    ? 'bg-brand-500/10 text-brand-neon border border-brand-500/20'
                    : 'bg-dark-850 text-slate-400'
                }`}
              >
                {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Skeleton {showSkeleton ? 'On' : 'Off'}</span>
              </button>

              <button
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  audioEngine.setMuted(nextMuted);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  !isMuted
                    ? 'bg-brand-500/10 text-brand-neon border border-brand-500/20'
                    : 'bg-dark-850 text-slate-400'
                }`}
              >
                {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Audio {isMuted ? 'Muted' : 'On'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics & Workout Action Controls (1 Column) */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Prominent Repetition or Hold Counter */}
          <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 text-center relative overflow-hidden">
            <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
              {isHoldMode ? 'Accumulated Hold Time' : 'Completed Repetitions'}
            </div>
            <div className="text-7xl font-black text-brand-neon tracking-tight font-mono text-glow my-3">
              {isHoldMode ? `${Math.floor(holdSeconds)}s` : repCount}
            </div>

            {/* Target indicator */}
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-brand-neon" />
              <span>Target: {targetGoal} {isHoldMode ? 'seconds' : 'reps'}</span>
            </div>

            {!isHoldMode && incompleteCount > 0 && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <span>{incompleteCount} shallow attempt{incompleteCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Goal Progress Bar */}
          <div className="p-5 rounded-2xl bg-dark-900 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Set Progress</span>
              <span className="font-mono text-brand-neon font-bold">{Math.round(progressPercent)}%</span>
            </div>

            <div className="w-full bg-dark-850 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-300 bg-brand-neon shadow-neon"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0</span>
              <span>{targetGoal} {isHoldMode ? 'sec' : 'reps'}</span>
            </div>
          </div>

          {/* Primary Workout Controls */}
          <div className="space-y-3 pt-2">
            {!isWorkoutActive ? (
              <button
                onClick={handleStartWorkout}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-extrabold text-base transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
              >
                <Play className="w-5 h-5 fill-dark-950" />
                <span>Start Workout Session</span>
              </button>
            ) : (
              <div className="space-y-3">
                {isPaused ? (
                  <button
                    onClick={handleResumeWorkout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-dark-950" />
                    <span>Resume Workout</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseWorkout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 border border-white/10 font-bold text-sm transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Workout</span>
                  </button>
                )}

                <button
                  onClick={handleEndWorkout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>End Workout & Review Summary</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Switcher Modal */}
      {showExerciseSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-dark-900 border border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-neon" />
                  <span>Select Exercise</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Switch to any of the 8 AI-coached exercises
                </p>
              </div>
              <button
                onClick={() => setShowExerciseSwitcher(false)}
                className="px-3 py-1.5 rounded-lg bg-dark-850 text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {EXERCISE_LIST.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    setShowExerciseSwitcher(false);
                    navigate(`/workout/${ex.id}`);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    ex.id === exerciseConfig.id
                      ? 'bg-brand-500/10 border-brand-neon shadow-neon'
                      : 'bg-dark-850 hover:bg-dark-800 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-brand-neon">
                      {ex.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ex.mode === 'hold' ? 'Hold' : 'Reps'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{ex.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{ex.camera.setupTip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Positioning Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-dark-900 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-neon" />
              <span>{exerciseConfig.name} &bull; Camera Setup</span>
            </h3>

            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <strong className="text-white">1. Recommended Angle:</strong> Position camera for a{' '}
                <span className="text-brand-neon uppercase font-bold">
                  {exerciseConfig.camera.recommendedView}
                </span>{' '}
                view.
              </p>
              <p>
                <strong className="text-white">2. Positioning:</strong> {exerciseConfig.camera.setupTip}
              </p>
              <p>
                <strong className="text-white">3. Mode:</strong>{' '}
                {isHoldMode
                  ? 'Isometric hold — time accumulates while maintaining good posture.'
                  : 'Repetitions — each full cycle through start and lockout counts as 1 rep.'}
              </p>
              <p>
                <strong className="text-white">4. Biomechanical Cues:</strong> Follow real-time on-screen coaching cues to perfect your technique.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-dark-950 font-bold text-sm shadow-neon"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
