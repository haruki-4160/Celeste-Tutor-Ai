import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen  flex flex-col transition-colors">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <div className=" p-12 rounded-3xl shadow-lg border border-violet-200 dark:border-indigo-800 bg-white dark:bg-indigo-900 transition-colors flex flex-col items-center text-center max-w-lg w-full">
          <div className="w-24 h-24 mb-6 rounded-full bg-violet-200 dark:bg-indigo-900 shadow-inner border border-violet-200 dark:border-indigo-800 bg-violet-50 dark:bg-indigo-950/50 flex items-center justify-center text-fuchsia-500">
            <Compass size={48} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-6xl font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-tighter mb-4">404</h1>
          <h2 className="text-2xl font-bold text-violet-900 dark:text-indigo-100 mb-4 tracking-wide">Page Not Found</h2>
          
          <p className="text-violet-700 dark:text-indigo-300 mb-8 leading-relaxed">
            Oops! It looks like this page wandered off into another dimension. 
            Celeste couldn't find the physics problem you were looking for.
          </p>
          
          <Link 
            href="/"
            className="flex items-center gap-2  text-fuchsia-600 dark:text-fuchsia-400 font-bold py-4 px-8 rounded-2xl shadow-md border border-violet-200 dark:border-indigo-800 bg-white dark:bg-indigo-900 hover:shadow-lg active:shadow-inner active:scale-95 transition-all uppercase tracking-wider"
          >
            <Home size={20} />
            Back to Tutor
          </Link>
        </div>
      </main>
    </div>
  );
}
