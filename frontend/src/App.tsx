import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { WorkoutSummaryPage } from './pages/WorkoutSummaryPage';
import { WorkoutHistoryPage } from './pages/WorkoutHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('repright_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#080b0f] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-black">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/workout/:exerciseId" element={<WorkoutPage />} />
            <Route path="/summary" element={<WorkoutSummaryPage />} />
            <Route path="/history" element={<WorkoutHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
