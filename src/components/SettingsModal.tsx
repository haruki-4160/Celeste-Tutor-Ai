import { Settings, X, LogOut, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-indigo-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-celeste-text)] flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Account</h3>
            <div className="flex items-center gap-4 bg-[var(--color-celeste-light)]/50 p-3 rounded-2xl overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 shrink-0 border-2 border-white" />
              )}
              <div className="overflow-hidden">
                <p className="font-semibold text-[var(--color-celeste-text)] truncate">{user?.displayName || "Student"}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || "Not signed in"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Preferences</h3>
            <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100">
              <span className="flex items-center gap-3 text-[var(--color-celeste-text)] font-medium">
                <Sun className="w-5 h-5 text-amber-500" />
                Theme
              </span>
              <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Light</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-red-500 font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
