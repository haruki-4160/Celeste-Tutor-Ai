'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  const { user, loading, stats, openAuthModal } = useAuth();

  return (
    <header className="border-b border-[var(--color-celeste-light)] bg-white/70 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Celeste Logo" className="w-8 h-8 rounded-xl shadow-sm object-cover" />
          <h1 className="text-xl font-bold text-[var(--color-celeste-text)]">Celeste</h1>
        </div>

        {/* Right side: Streak & Profile / Sign In */}
        <div className="flex items-center gap-2.5">
          {/* Streak pill */}
          <button
            type="button"
            onClick={onSettingsClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-xs font-bold text-orange-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="Current Streak - click to view stats"
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{stats.streak || 0}</span>
          </button>

          {!loading && user ? (
            <button
              type="button"
              onClick={onSettingsClick}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/80 transition-all cursor-pointer group"
              title="Open Profile"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover group-hover:ring-2 group-hover:ring-[var(--color-celeste-purple)] transition-all" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                  {user.displayName?.charAt(0) || "S"}
                </div>
              )}
            </button>
          ) : !loading ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--color-celeste-purple-light)] text-xs font-semibold text-[var(--color-celeste-text)] hover:border-[var(--color-celeste-purple)] shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
