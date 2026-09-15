import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';

interface InteractiveHintProps {
  hints: string[];
}

export default function InteractiveHint({ hints }: InteractiveHintProps) {
  const [hintLevel, setHintLevel] = useState(0);

  if (!hints || hints.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col items-start gap-3 w-full">
      <AnimatePresence>
        {hintLevel > 0 && hints.slice(0, hintLevel).map((hint, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-[15px] w-full flex gap-3 shadow-sm transition-colors"
          >
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>{hint}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {hintLevel < hints.length && (
        <button
          onClick={() => setHintLevel(prev => prev + 1)}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-celeste-purple)] hover:text-[var(--color-celeste-purple-light)] bg-white hover:bg-[var(--color-celeste-light)] border border-[var(--color-celeste-light)] shadow-sm px-5 py-2.5 rounded-full transition-all hover:shadow-md"
        >
          <Lightbulb className="w-4 h-4" />
          {hintLevel === 0 ? "Need a hint?" : "Need another hint?"}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
