import React from 'react';
import { Dumbbell, ShieldCheck, Cpu, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0a0d12] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-neon">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">RepRight</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4">
              AI-powered exercise coach that uses browser computer vision to analyze your squat form, automatically count repetitions, and help you train with confidence.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> 100% Client-Side Vision
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> MediaPipe Tasks
              </span>
              <span className="flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-amber-400" /> MIT Open Source
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-300 mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Real-Time Pose Tracking</li>
              <li>Joint Angle Calculation</li>
              <li>Squat State Machine</li>
              <li>Workout Persistence</li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-300 mb-3">Stack</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>MediaPipe Pose Landmarker</li>
              <li>React 19 + TypeScript + Vite</li>
              <li>FastAPI + SQLAlchemy + SQLite</li>
              <li>Tailwind CSS + Recharts</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RepRight. Open-source fitness technology under the MIT License.</p>
          <p className="text-slate-500">
            Disclaimer: RepRight provides biomechanical heuristics for fitness practice and is not a medical device.
          </p>
        </div>
      </div>
    </footer>
  );
};
