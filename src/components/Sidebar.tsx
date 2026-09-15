"use client";

import { Home, PlusCircle, Clock, BookOpen, Folder, Settings, Moon, Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  onNewSession?: () => void;
  onSettingsClick?: () => void;
}

export default function Sidebar({ onNewSession, onSettingsClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, signInWithGoogle, loading } = useAuth();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Resources', href: '/resources', icon: Folder },
  ];

  return (
    <aside className="w-64 h-screen bg-[var(--color-celeste-dark)]/80 backdrop-blur-md flex flex-col p-6 hidden md:flex shrink-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-10">
      {/* Brand / Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10 cursor-pointer">
        <img src="/logo.jpg" alt="Celeste Logo" className="w-10 h-10 rounded-2xl shadow-md shadow-[var(--color-celeste-purple-light)]/50 object-cover" />
        <div>
          <h1 className="text-xl font-bold text-[var(--color-celeste-text)] leading-tight flex items-center gap-1">Celeste <Sparkles className="w-4 h-4 text-amber-400" /></h1>
          <p className="text-xs text-[var(--color-celeste-purple)] font-medium">Learn Brighter ✨ Go Further</p>
        </div>
      </Link>

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

      {/* User Profile */}
      <div className="mt-auto pt-6 border-t border-[var(--color-celeste-purple-light)]/30">
        {!loading && user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 max-w-[150px]">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-white shadow-sm shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 shrink-0 border-2 border-white shadow-sm" />
              )}
              <span className="text-sm font-semibold text-[var(--color-celeste-text)] truncate">{user.displayName || "Student"}</span>
            </div>
            <button 
              onClick={onSettingsClick}
              className="text-slate-400 hover:text-[var(--color-celeste-purple)] transition-colors shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        ) : !loading ? (
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white text-[var(--color-celeste-purple)] border border-[var(--color-celeste-light)] hover:shadow-md transition-all font-semibold"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
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
