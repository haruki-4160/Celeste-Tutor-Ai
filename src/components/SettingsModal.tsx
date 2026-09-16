'use client';

import React, { useState } from 'react';
import { 
  X, 
  LogOut, 
  Flame, 
  Target, 
  Award, 
  CheckCircle2, 
  RotateCw, 
  Calendar, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, signOut, stats, refreshStats } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await refreshStats();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const level = Math.floor((stats.xp || 0) / 100) + 1;
  const xpInCurrentLevel = (stats.xp || 0) % 100;
  const progressPercentage = (xpInCurrentLevel / 100) * 100;

  // Generate current week days (Monday to Sunday)
  const getWeeklyStreakDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const weekDays = [];
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isPastOrToday = date <= today;
      const isActive = stats.activeDays?.includes(dateStr) || (isToday && (stats.streak || 0) > 0);

      weekDays.push({
        label: dayNames[i],
        dateStr,
        isToday,
        isPastOrToday,
        isActive
      });
    }

    return weekDays;
  };

  const weekDays = getWeeklyStreakDays();

  return (
    <div className="fixed inset-0 bg-indigo-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-lg w-full shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col border border-[var(--color-celeste-light)]">
        {/* Decorative background header */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-br from-[var(--color-celeste-purple)] via-[#9A8EF5] to-fuchsia-500 opacity-95" />
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white/90 hover:text-white z-20 bg-black/20 hover:bg-black/35 rounded-full p-1.5 backdrop-blur-sm transition-all cursor-pointer"
          title="Close profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar relative z-10 pt-8 pb-1 pr-1">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-fuchsia-400 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold">
                  {user?.displayName?.charAt(0) || "S"}
                </div>
              )}
              
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 text-xs font-bold px-2.5 py-1 rounded-full border-2 border-white shadow-md flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Lvl {level}
              </div>
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{user?.displayName || "Student Scholar"}</h2>
                {user && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Google Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{user?.email || "Signed in with Google"}</p>
            </div>
          </div>

          {/* Streak Banner & 7-Day Visual Tracker */}
          <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-950">
                    {stats.streak} Day Study Streak!
                  </h3>
                  <p className="text-[11px] text-orange-700 font-medium">
                    {stats.streak > 0 
                      ? "You are building unstoppable daily learning momentum!"
                      : "Complete a problem today to ignite your streak!"}
                  </p>
                </div>
              </div>

              {stats.bestStreak > 0 && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-orange-400 block tracking-wider">Record</span>
                  <span className="text-xs font-bold text-orange-700">🏆 {stats.bestStreak} Days</span>
                </div>
              )}
            </div>

            {/* Weekly Streak Circles */}
            <div className="bg-white/80 rounded-xl p-2.5 border border-orange-100 flex items-center justify-between">
              {weekDays.map((d, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold ${d.isToday ? 'text-orange-600' : 'text-slate-400'}`}>
                    {d.label}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    d.isActive 
                      ? 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-sm ring-2 ring-orange-200' 
                      : d.isToday 
                        ? 'border-2 border-dashed border-orange-400 bg-orange-50 text-orange-400'
                        : 'bg-slate-100 text-slate-300'
                  }`}>
                    {d.isActive ? (
                      <Flame className="w-3.5 h-3.5 fill-white text-white" />
                    ) : d.isToday ? (
                      <span className="text-[10px] font-bold">•</span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400">{d.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3.5 mt-4">
            <div className="bg-violet-50/80 rounded-2xl p-4 border border-violet-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-[var(--color-celeste-purple)] flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-[var(--color-celeste-purple)]" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-[var(--color-celeste-text)] block leading-tight">
                  {stats.xp}
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-celeste-purple)] uppercase tracking-wider">
                  Total XP
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-emerald-950 block leading-tight">
                  {stats.problemsSolved || 0}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Solved Problems
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress to Next Level */}
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-[var(--color-celeste-text)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-celeste-purple)]" />
                Level {level} Progress
              </span>
              <span className="font-semibold text-slate-500">{xpInCurrentLevel} / 100 XP</span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-celeste-purple)] to-fuchsia-500 rounded-full shadow-sm transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
            
            <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
              Earn +15 XP for every question or problem you submit for review!
            </p>
          </div>

          {/* Account Management & Actions */}
          <div className="mt-5 flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Sync latest data with cloud"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--color-celeste-purple)]' : ''}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Stats"}</span>
            </button>

            <button 
              type="button"
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
