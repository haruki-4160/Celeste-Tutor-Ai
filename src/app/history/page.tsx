import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Clock } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden"><Header /></div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-10 h-10 text-[var(--color-celeste-purple)]/60" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-celeste-text)]">History is empty</h2>
            <p className="text-[var(--color-celeste-purple)] font-medium max-w-sm">
              You haven't completed any sessions yet. Once you do, they will appear here.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
