"use client";

import { Home, PlusCircle, Clock, BookOpen, Folder, Settings, Moon, Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  onNewSession?: () => void;
  onSettingsClick?: () => void;
  xp?: number;
  streak?: number;
}

export default function Sidebar({ onNewSession, onSettingsClick, xp = 0, streak = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user, signInWithGoogle, loading, stats } = useAuth();
  
  // Calculate level based on XP (every 100 XP is a level for this demo)
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;
  const progressPercentage = (xpInCurrentLevel / 100) * 100;

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Resources', href: '/resources', icon: Folder },
  ];

  return (
    <aside className="w-64 h-screen bg-[var(--color-celeste-dark)]/80 backdrop-blur-md flex flex-col p-6 hidden md:flex shrink-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-10">
      {/* Brand / Logo & Streak */}
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.jpg" alt="Celeste Logo" className="w-10 h-10 rounded-2xl shadow-md shadow-[var(--color-celeste-purple-light)]/50 object-cover" />
          <div>
            <h1 className="text-xl font-bold text-[var(--color-celeste-text)] leading-tight flex items-center gap-1">Celeste <Sparkles className="w-4 h-4 text-amber-400" /></h1>
            <p className="text-xs text-[var(--color-celeste-purple)] font-medium truncate max-w-[100px]">Learn Brighter</p>
          </div>
        </Link>
        
        {user && (stats.streak > 0 || streak > 0) && (
          <button 
            type="button"
            onClick={onSettingsClick}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 px-3 py-1 rounded-full border border-orange-200 shadow-xs shrink-0 cursor-pointer transition-all"
            title={`${stats.streak || streak} Day Streak! Click to view details.`}
          >
            <span className="text-orange-600 text-xs font-bold">{stats.streak || streak}</span>
            <span className="text-xs">🔥</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <button
          onClick={onNewSession}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-[var(--color-celeste-purple)] bg-[var(--color-celeste-purple)]/10 hover:bg-[var(--color-celeste-purple)]/20 font-semibold mb-6`}
        >
          <PlusCircle className="w-5 h-5" />
          New Session
        </button>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-white text-[var(--color-celeste-text)] font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-white/50 hover:text-[var(--color-celeste-text)] font-medium'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-celeste-purple)]' : 'text-slate-400'}`} />
                {item.name}
              </Link>
              {item.name === 'History' && isActive && (
                <div className="pl-12 pr-4 py-2 mt-1">
                  <p className="text-xs text-slate-400 italic">No recent history</p>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile & Gamification */}
      <div className="mt-auto pt-6 border-t border-[var(--color-celeste-purple-light)]/30">
        {!loading && user ? (
          <div className="flex flex-col gap-3">
            <div 
              onClick={onSettingsClick}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/60 transition-all cursor-pointer group"
              title="Click to view Profile & Streaks"
            >
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-white shadow-sm shrink-0 object-cover group-hover:ring-2 group-hover:ring-[var(--color-celeste-purple)] transition-all" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName?.charAt(0) || "S"}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-sm font-semibold text-[var(--color-celeste-text)] truncate">{user.displayName || "Student"}</span>
                  <span className="text-[10px] text-[var(--color-celeste-purple)] font-bold uppercase tracking-wider">Level {level} • Scholar</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettingsClick?.();
                }}
                className="text-slate-400 hover:text-[var(--color-celeste-purple)] transition-colors shrink-0 p-1 hover:bg-white rounded-lg"
                title="Profile & Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full px-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-celeste-purple)] font-bold">{xp} XP</span>
                <span className="text-slate-400 font-medium">{(level) * 100} XP</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner border border-[var(--color-celeste-light)]">
                <div className="h-full bg-gradient-to-r from-[var(--color-celeste-purple)] to-fuchsia-400 rounded-full shadow-sm transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
          </div>
        ) : !loading ? (
          <button 
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white text-[var(--color-celeste-text)] border border-[var(--color-celeste-light)] hover:shadow-md hover:border-[var(--color-celeste-purple-light)] transition-all font-semibold cursor-pointer text-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        ) : (
          <div className="h-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--color-celeste-purple-light)] border-t-[var(--color-celeste-purple)] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </aside>
  );
}
