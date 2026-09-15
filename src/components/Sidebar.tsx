import { Home, PlusCircle, Clock, BookOpen, Folder, Settings, Moon, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Home', icon: Home, active: true },
    { name: 'New Session', icon: PlusCircle, active: false },
    { name: 'History', icon: Clock, active: false },
    { name: 'Subjects', icon: BookOpen, active: false },
    { name: 'Resources', icon: Folder, active: false },
  ];

  return (
    <aside className="w-64 h-screen bg-[var(--color-celeste-dark)]/80 backdrop-blur-md flex flex-col p-6 hidden md:flex shrink-0 shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-10">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-[var(--color-celeste-purple)] text-white p-2 rounded-2xl flex items-center justify-center shadow-md shadow-[var(--color-celeste-purple-light)]/50">
          <Moon className="w-6 h-6 fill-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-celeste-text)] leading-tight flex items-center gap-1">Celeste <Sparkles className="w-4 h-4 text-amber-400" /></h1>
          <p className="text-xs text-[var(--color-celeste-purple)] font-medium">Learn Brighter ✨ Go Further</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              item.active
                ? 'bg-white text-[var(--color-celeste-text)] font-semibold shadow-sm'
                : 'text-slate-500 hover:bg-white/50 hover:text-[var(--color-celeste-text)] font-medium'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-[var(--color-celeste-purple)]' : 'text-slate-400'}`} />
            {item.name}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-6 border-t border-[var(--color-celeste-purple-light)]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 shrink-0 border-2 border-white shadow-sm" />
          <span className="text-sm font-semibold text-[var(--color-celeste-text)]">lunar_ash</span>
        </div>
        <button className="text-slate-400 hover:text-[var(--color-celeste-purple)] transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
