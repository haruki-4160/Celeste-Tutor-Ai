import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { FileText, Bookmark, Download } from 'lucide-react';

export default function ResourcesPage() {
  const resources = [
    { title: 'Physics Formulas Cheat Sheet', desc: 'A quick reference for kinematics, forces, and energy.', icon: FileText },
    { title: 'Math Constants & Properties', desc: 'Pi, e, gravitational constant, and logarithm rules.', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden"><Header /></div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-[var(--color-celeste-text)]">Resources</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map(r => (
                <div key={r.title} className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-[var(--color-celeste-light)] flex items-start gap-4">
                  <div className="bg-[var(--color-celeste-purple)]/10 p-3 rounded-2xl">
                    <r.icon className="w-6 h-6 text-[var(--color-celeste-purple)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--color-celeste-text)] text-lg mb-1">{r.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-[var(--color-celeste-purple)] bg-slate-50 hover:bg-white rounded-xl transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
