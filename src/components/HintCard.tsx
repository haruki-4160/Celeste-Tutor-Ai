import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle } from 'lucide-react';
export default function HintCard({ errorFound, hints = [] }: { errorFound: boolean, hints: string[] }) {
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => setHintIndex(0), [hints]);
  if (!hints || hints.length === 0) return null;
  if (!errorFound) return <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mt-6">Correct!</div>;
  return (
    <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl mt-6 shadow-sm">
      <h3 className="font-semibold text-amber-900 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Hint {hintIndex + 1}</h3>
      <p className="text-amber-800 text-sm mt-2">{hints[hintIndex]}</p>
      {hintIndex < hints.length - 1 && (
        <button onClick={() => setHintIndex(i => i + 1)} className="mt-4 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded">
          Next hint
        </button>
      )}
    </div>
  );
}
