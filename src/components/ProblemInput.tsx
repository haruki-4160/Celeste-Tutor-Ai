import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';

interface ProblemInputProps {
  studentWorking: string;
  setStudentWorking: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}
export default function ProblemInput({ studentWorking, setStudentWorking, onAnalyze, isAnalyzing }: ProblemInputProps) {
  const highlight = (code: string) => (
    Prism.highlight(code, Prism.languages.javascript, 'javascript')
  );

  return (
    <div className="flex flex-col gap-6 bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
      <div className="bg-[var(--color-celeste-light)] p-5 rounded-2xl border border-white/50 shadow-inner">
        <h2 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider mb-2">Question</h2>
        <p className="text-[var(--color-celeste-text)] font-medium">
          A car accelerates from 10 m/s to 30 m/s in 5 seconds. Find the acceleration.
        </p>
      </div>
      <div className="flex-1 flex flex-col">
        <h2 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider mb-2">Your Working</h2>
        <div className="flex-1 bg-white rounded-2xl border border-[var(--color-celeste-light)] shadow-sm overflow-hidden min-h-[200px]">
          <Editor
            value={studentWorking}
            onValueChange={code => setStudentWorking(code)}
            highlight={highlight}
            padding={16}
            disabled={isAnalyzing}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 14,
              minHeight: '100%',
              backgroundColor: 'transparent',
            }}
            textareaClassName="focus:outline-none text-[var(--color-celeste-text)]"
          />
        </div>
      </div>
      <button 
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="bg-gradient-to-r from-[var(--color-celeste-purple)] to-[var(--color-celeste-purple-light)] text-white font-semibold py-4 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isAnalyzing ? "Analyzing..." : "Submit for Review"}
      </button>
    </div>
  );
}
