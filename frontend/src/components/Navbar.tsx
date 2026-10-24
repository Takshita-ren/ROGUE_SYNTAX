import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Activity, Dumbbell, LayoutDashboard, History, Settings, Play, Calendar } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Plan', path: '/plan', icon: Calendar },
    { name: 'Live Workout', path: '/workout', icon: Activity },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-neon flex items-center justify-center text-dark-950 font-black shadow-neon transition-transform group-hover:scale-105">
            <Dumbbell className="w-6 h-6 rotate-45" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>RepRight</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                AI Coach
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Perfect Every Rep</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-brand-neon border border-brand-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workout')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-950 font-semibold text-sm transition-all shadow-neon hover:shadow-neon-strong active:scale-95"
          >
            <Play className="w-4 h-4 fill-dark-950" />
            <span className="hidden sm:inline">Start Workout</span>
            <span className="sm:hidden">Start</span>
          </button>
        </div>
      </div>
    </header>
  );
};
