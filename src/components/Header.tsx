import { Lightbulb } from 'lucide-react';
export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-2">
        <Lightbulb className="text-indigo-600 h-6 w-6" />
        <h1 className="text-xl font-bold text-gray-900">Socratic</h1>
      </div>
    </header>
  );
}
