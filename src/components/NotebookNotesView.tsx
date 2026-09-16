'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  MessageSquare, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  Sigma, 
  Flame, 
  Layers, 
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import { NotebookNote } from '@/types/notebook';

interface NotebookNotesViewProps {
  note: NotebookNote | null;
  isLoading: boolean;
  onAskQuestion: (questionText: string) => void;
  onSwitchToChat: () => void;
  pastNotes?: NotebookNote[];
  onSelectPastNote?: (note: NotebookNote) => void;
}

export const renderMathMarkdown = (text: string) => {
  if (!text) return null;
  // Splits by $$...$$ for display math, and $...$ for inline math
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      return (
        <div key={index} className="my-3 overflow-x-auto py-1">
          <BlockMath math={math} />
        </div>
      );
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      return <InlineMath key={index} math={math} />;
    }
    // Simple line break and bold markdown rendering
    return <span key={index} className="whitespace-pre-line">{part}</span>;
  });
};

export default function NotebookNotesView({
  note,
  isLoading,
  onAskQuestion,
  onSwitchToChat,
  pastNotes = [],
  onSelectPastNote
}: NotebookNotesViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'breakdown' | 'formulas'>('notes');
  const [showOriginal, setShowOriginal] = useState(false);

  const handleCopy = () => {
    if (!note) return;
    const exportText = `# ${note.title}\n\n**Topic:** ${note.topic}\n\n## Clean Transcription\n${note.transcription}\n\n## Concept Breakdown\n${note.explanation}\n\n## Cheat Sheet\n${note.studyNotes.cheatSheetSummary}`;
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!note) return;
    const exportText = `# ${note.title}\n\n**Topic:** ${note.topic}\n\n## Clean Transcription\n${note.transcription}\n\n## Concept Breakdown\n${note.explanation}\n\n## Key Takeaways\n${note.studyNotes.keyTakeaways.map(t => `- ${t}`).join('\n')}\n\n## Formulas\n${note.studyNotes.formulas.map(f => `- ${f.formula}: ${f.meaning}`).join('\n')}\n\n## Cheat Sheet\n${note.studyNotes.cheatSheetSummary}`;
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[var(--color-celeste-purple)] to-purple-400 flex items-center justify-center text-white shadow-xl shadow-[var(--color-celeste-purple)]/20 animate-pulse">
            <BookOpen className="w-8 h-8" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-celeste-text)] mb-2">
          Digitizing & Synthesizing Notes...
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Scanning messy handwriting, formatting KaTeX math, and compiling your study guide without wasting tokens.
        </p>
        <div className="flex flex-col gap-2 max-w-xs w-full text-left text-xs text-slate-600 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[var(--color-celeste-light)] shadow-xs">
          <div className="flex items-center gap-2 text-[var(--color-celeste-purple)] font-semibold">
            <div className="w-2 h-2 rounded-full bg-[var(--color-celeste-purple)] animate-ping" />
            1. Transcribing handwriting & formulas
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            2. Clarifying cryptic shorthand & steps
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            3. Building formula bank & study guide
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State (No Note yet)
  if (!note) {
    return (
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
          <div className="w-16 h-16 rounded-3xl bg-violet-100/80 border border-violet-200 flex items-center justify-center text-[var(--color-celeste-purple)] mb-5 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-celeste-text)] mb-2">
            Celeste Notebook
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Upload your handwritten notes, homework, or attachments on the left and click <span className="font-semibold text-[var(--color-celeste-purple)]">&ldquo;Digitize &amp; Make Notes&rdquo;</span>.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full text-left text-xs">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-[var(--color-celeste-purple)] shrink-0">
                <Sigma className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Messy Math to KaTeX</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Turns rushed equations and shorthand calculations into crystal-clear LaTeX.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Concept Explanations</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Explains skipped steps and cryptic abbreviations in friendly English.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Token-Saving Cache</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Scanned once. Chat and learn without re-sending images or draining tokens.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Past Notes / History */}
        {pastNotes.length > 0 && (
          <div className="mt-auto pt-6 border-t border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent Notebooks (Saved Locally)
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {pastNotes.slice(0, 3).map((pastNote) => (
                <button
                  key={pastNote.id}
                  onClick={() => onSelectPastNote && onSelectPastNote(pastNote)}
                  className="w-full text-left p-3 rounded-xl bg-white hover:bg-violet-50/50 border border-slate-200/80 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs font-bold text-slate-700 truncate group-hover:text-[var(--color-celeste-purple)]">{pastNote.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{pastNote.topic} • {new Date(pastNote.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--color-celeste-purple)] shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Active Note View
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white/40">
      {/* Header */}
      <div className="p-5 border-b border-[var(--color-celeste-light)] bg-white/70 backdrop-blur-md shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-violet-100 text-[var(--color-celeste-purple)] uppercase">
                {note.topic}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-celeste-text)] mt-1 line-clamp-1">
              {note.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {note.sourceDataUrl && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`p-2 rounded-xl transition-all ${
                  showOriginal 
                    ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-[var(--color-celeste-purple)] hover:bg-white'
                }`}
                title="Compare with original upload"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-slate-500 hover:text-[var(--color-celeste-purple)] hover:bg-white transition-all cursor-pointer"
              title="Copy markdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-500 hover:text-[var(--color-celeste-purple)] hover:bg-white transition-all cursor-pointer"
              title="Download notes (.md)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onSwitchToChat}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-celeste-purple)] text-white text-xs font-semibold hover:opacity-90 shadow-sm flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notes'
                ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Clean Notes
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'breakdown'
                ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Deciphered Shorthand ({note.clarifications.length})
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'formulas'
                ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Formula Bank ({note.studyNotes.formulas.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Toggleable Original Image View */}
        {showOriginal && note.sourceDataUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-slate-900/5 border border-slate-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Original Upload: {note.sourceName}
              </span>
              <button 
                onClick={() => setShowOriginal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <img 
              src={note.sourceDataUrl} 
              alt="Original Note" 
              className="max-h-72 w-full object-contain rounded-xl bg-white shadow-inner" 
            />
          </motion.div>
        )}

        {/* Tab 1: Clean Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="bg-white/90 p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Digitized Transcription & Equations
              </h3>
              <div className="text-[14px] text-slate-700 leading-relaxed prose prose-sm max-w-none">
                {renderMathMarkdown(note.transcription)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50/70 to-purple-50/50 p-5 rounded-2xl border border-violet-100">
              <h3 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Core Concept Explanation
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {note.explanation}
              </p>
            </div>

            {/* Key Takeaways */}
            {note.studyNotes.keyTakeaways.length > 0 && (
              <div className="bg-white/90 p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {note.studyNotes.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-celeste-purple)] mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Deciphered Shorthand */}
        {activeTab === 'breakdown' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Messy handwriting, scratched-out steps, or cryptic abbreviations decoded into clear concepts:
            </p>
            {note.clarifications.map((item, idx) => (
              <div key={idx} className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono text-xs border border-amber-200">
                    {item.originalTextOrSymbol}
                  </span>
                  <span className="text-xs text-slate-400">⟶</span>
                  <span className="text-xs font-bold text-emerald-700">Decoded Meaning</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed pl-1">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Formula Bank & Cheat Sheet */}
        {activeTab === 'formulas' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider flex items-center gap-1.5">
                <Sigma className="w-4 h-4" />
                Formula Bank
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {note.studyNotes.formulas.map((form, idx) => (
                  <div key={idx} className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="text-slate-900 font-bold text-sm mb-1.5">
                      {renderMathMarkdown(form.formula)}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {form.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/90 p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                High-Yield Exam Cheat Sheet
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {renderMathMarkdown(note.studyNotes.cheatSheetSummary)}
              </div>
            </div>
          </div>
        )}

        {/* Clickable Suggested Questions */}
        {note.suggestedQuestions.length > 0 && (
          <div className="pt-4 border-t border-slate-200/70">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[var(--color-celeste-purple)]" />
              Ask Celeste About These Notes
            </h4>
            <div className="flex flex-col gap-2">
              {note.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskQuestion(q)}
                  className="text-left p-3 rounded-xl bg-violet-50/60 hover:bg-violet-100 border border-violet-100/80 text-xs font-medium text-[var(--color-celeste-purple)] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">&ldquo;{q}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
