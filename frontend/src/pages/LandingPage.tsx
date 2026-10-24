import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Activity,
  CheckCircle2,
  Camera,
  LineChart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-neon text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Browser Computer Vision</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Train Smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-neon to-emerald-300">
                Move Better.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              RepRight is an AI-powered fitness coach that uses your webcam and computer vision to analyze your squat technique, count repetitions automatically, and guide you with explainable real-time feedback.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/workout')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-base transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
              >
                <Play className="w-5 h-5 fill-dark-950" />
                <span>Start Your Workout</span>
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-dark-900 hover:bg-dark-850 text-slate-200 border border-white/10 font-semibold text-base transition-all"
              >
                <span>How It Works</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-neon" /> 100% Private (No video uploaded)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-neon" /> No Wearables or Hardware Needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-neon" /> Free & Open-Source
              </span>
            </div>
          </div>

          {/* Visual Preview Card of Live Workout */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="relative rounded-2xl bg-dark-900 border border-white/10 p-3 shadow-2xl overflow-hidden group">
              <div className="relative aspect-video rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-white/5">
                {/* Visual interface mockup */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-transparent to-dark-950/40 z-10" />
                
                {/* Simulated athlete silhouette */}
                <div className="absolute inset-0 flex items-center justify-center opacity-60">
                  <svg className="w-64 h-64 text-brand-500/40" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                    {/* Head */}
                    <circle cx="100" cy="40" r="14" strokeWidth="3" />
                    {/* Torso */}
                    <line x1="100" y1="54" x2="100" y2="105" strokeWidth="4" />
                    {/* Left Leg in Squat */}
                    <polyline points="100,105 75,135 70,180" strokeWidth="4" strokeLinecap="round" stroke="#00f59b" />
                    {/* Right Leg in Squat */}
                    <polyline points="100,105 125,135 130,180" strokeWidth="4" strokeLinecap="round" stroke="#00f59b" />
                    {/* Arms */}
                    <polyline points="100,68 65,90 60,115" strokeWidth="3" strokeLinecap="round" />
                    <polyline points="100,68 135,90 140,115" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Overlaid UI elements in mockup */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-brand-500/30 text-white text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-brand-neon animate-ping" />
                    <span>TRACKING ACTIVE</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-xs text-slate-300">
                    KNEE: <span className="text-brand-neon font-bold">88.5°</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-20">
                  <div className="px-4 py-2 rounded-xl bg-dark-900/90 backdrop-blur-md border border-white/10 text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Repetitions</div>
                    <div className="text-3xl font-black text-white leading-none text-glow">12</div>
                  </div>
                </div>

                {/* Center feedback badge */}
                <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center px-4">
                  <div className="px-5 py-2.5 rounded-xl bg-brand-500/20 backdrop-blur-md border border-brand-500/40 text-brand-neon text-sm font-semibold flex items-center gap-2 shadow-neon">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Great depth! Drive up through your heels.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-[#0a0d12] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Engineered for Technique Mastery
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              RepRight removes the guesswork from bodyweight training with real-time computer vision heuristics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 hover:border-brand-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-neon flex items-center justify-center mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">MediaPipe AI Pose Tracking</h3>
              <p className="text-sm text-slate-400">
                Detects 33 skeletal landmarks at up to 60 FPS directly in your browser without sending a single frame to the cloud.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Squat State Machine</h3>
              <p className="text-sm text-slate-400">
                A robust 4-phase finite state machine (READY, DESCENDING, BOTTOM, ASCENDING) ensures you only get credit for full reps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Biomechanical Feedback</h3>
              <p className="text-sm text-slate-400">
                Computes knee and torso angles to give real-time cues like "Go a little deeper" and "Keep your chest upright".
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-dark-900 border border-white/5 hover:border-amber-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Persistent Analytics</h3>
              <p className="text-sm text-slate-400">
                Every session is stored in an SQLite database via a FastAPI backend, tracking reps, durations, and historical trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section id="how-it-works" className="py-20 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              How RepRight Works
            </h2>
            <p className="text-slate-400">
              Getting started takes less than 10 seconds. No calibration or wearables required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-dark-900 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-dark-950 font-black flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Position Your Device</h3>
              <p className="text-sm text-slate-400">
                Set your phone or laptop at hip height about 6 to 8 feet away so your full body (shoulders down to ankles) is in the camera view.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-dark-900 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-dark-950 font-black flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Perform Your Squats</h3>
              <p className="text-sm text-slate-400">
                Descend smoothly until your knee angle reaches parallel (≤102°). RepRight tracks your joint angles and counts valid reps in real time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-dark-900 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-dark-950 font-black flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Review & Improve</h3>
              <p className="text-sm text-slate-400">
                End your workout to inspect repetition duration breakdown, shallow attempt counts, form cues, and track weekly progress on your dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA banner */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-brand-500/20 text-center max-w-3xl mx-auto shadow-neon">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to perfect your squat?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Step in front of your camera and get started with instant AI form feedback.
            </p>
            <button
              onClick={() => navigate('/workout')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold transition-all"
            >
              <Play className="w-4 h-4 fill-dark-950" />
              <span>Launch Live Coach</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
