import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { BookOpen, Calculator, Beaker, Atom, Globe } from 'lucide-react';
import Link from 'next/link';

export default function SubjectsPage() {
  const subjects = [
    { title: 'Calculus', icon: Calculator, color: 'text-rose-500', bg: 'bg-rose-100' },
    { title: 'Algebra', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { title: 'Physics', icon: Atom, color: 'text-sky-500', bg: 'bg-sky-100' },
    { title: 'Chemistry', icon: Beaker, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden"><Header /></div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-[var(--color-celeste-text)]">Subjects</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(s => (
                <Link href="/" key={s.title} className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-[var(--color-celeste-light)] group">
                  <div className="\ w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <s.icon className="\ w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-celeste-text)]">{s.title}</h3>
                  <p className="text-sm text-[var(--color-celeste-purple)] mt-2 font-medium">Start a new {s.title.toLowerCase()} session</p>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
