'use client';

import React, { useRef } from 'react';
import imageCompression from 'browser-image-compression';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { Plus, FileText, X, ArrowUp, BookOpen, Sparkles } from 'lucide-react';
import { AttachmentFile } from '@/types/attachment';

interface ProblemInputProps {
  question: string;
  setQuestion: (val: string) => void;
  studentWorking: string;
  setStudentWorking: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  image?: string | null;
  setImage?: (val: string | null) => void;
  questionAttachment?: AttachmentFile | null;
  setQuestionAttachment?: (val: AttachmentFile | null) => void;
  workingAttachment?: AttachmentFile | null;
  setWorkingAttachment?: (val: AttachmentFile | null) => void;
  attachment?: AttachmentFile | null;
  setAttachment?: (val: AttachmentFile | null) => void;
  onOpenPreview?: (attachment: AttachmentFile) => void;
  onNotebookScan?: (file?: File) => void;
  isScanningNotebook?: boolean;
}

export default function ProblemInput({ 
  question, 
  setQuestion, 
  studentWorking, 
  setStudentWorking, 
  onAnalyze, 
  isAnalyzing, 
  questionAttachment,
  setQuestionAttachment,
  workingAttachment,
  setWorkingAttachment,
  attachment,
  setAttachment,
  image,
  setImage,
  onOpenPreview,
  onNotebookScan,
  isScanningNotebook = false
}: ProblemInputProps) {
  const highlight = (code: string) => (
    Prism.highlight(code, Prism.languages.javascript, 'javascript')
  );

  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const workingFileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, source: 'question' | 'working') => {
    try {
      let finalDataUrl = '';
      let finalSize = file.size;

      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        finalSize = compressedFile.size;
        
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
      } else if (file.type === 'application/pdf') {
        if (file.size > 15 * 1024 * 1024) {
          alert('PDF size should be under 15MB');
          return;
        }
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        alert('Please attach an image or a PDF file.');
        return;
      }

      const fileObj: AttachmentFile = {
        name: file.name,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        size: finalSize,
        dataUrl: finalDataUrl,
        source: source
      };

      if (source === 'question') {
        if (setQuestionAttachment) setQuestionAttachment(fileObj);
      } else {
        if (setWorkingAttachment) setWorkingAttachment(fileObj);
      }

      if (onOpenPreview) {
        onOpenPreview(fileObj);
      }
    } catch (error) {
      console.error(`Error processing ${source} attachment file:`, error);
    }
  };

  const handleQuestionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, 'question');
    if (questionFileInputRef.current) questionFileInputRef.current.value = '';
  };

  const handleWorkingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, 'working');
    if (workingFileInputRef.current) workingFileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-5 bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
      {/* Window 1: Question Box */}
      <div id="question-box" data-window="question-box" className="bg-[var(--color-celeste-light)] p-5 rounded-2xl border border-white/60 shadow-inner flex flex-col transition-all">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider">Question Box</h2>
            <span className="px-2 py-0.5 rounded-md bg-white/80 text-[10px] font-bold text-[var(--color-celeste-purple)] border border-white shadow-xs">
              Window 1
            </span>
          </div>
          <button
            type="button"
            onClick={() => questionFileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="group flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 hover:bg-white text-[var(--color-celeste-purple)] text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            title="Attach problem image or PDF to Question Box"
          >
            <Plus size={13} strokeWidth={2.8} />
            <span>Attach Question File</span>
          </button>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            ref={questionFileInputRef}
            onChange={handleQuestionFileUpload}
          />
        </div>

        {/* Question Box Attachment Preview (Separate from Working) */}
        {questionAttachment && (
          <div className="mb-2.5 relative inline-block self-start">
            <div 
              onClick={() => onOpenPreview?.(questionAttachment)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden relative shadow-sm border-2 border-white/90 bg-white/90 cursor-pointer group hover:ring-2 hover:ring-[var(--color-celeste-purple)] transition-all"
              title="Click to view question file in Preview Drawer"
            >
              {questionAttachment.type.startsWith('image/') ? (
                <img 
                  src={questionAttachment.dataUrl} 
                  alt={questionAttachment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-rose-50">
                  <FileText size={22} className="text-rose-500 mb-0.5" />
                  <span className="text-[10px] font-semibold text-[var(--color-celeste-text)] truncate max-w-[90%]">{questionAttachment.name}</span>
                  <span className="text-[8px] text-rose-600 font-bold uppercase">PDF</span>
                </div>
              )}

              {/* Remove button for question attachment */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuestionAttachment?.(null);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-sm"
                title="Remove question attachment"
              >
                <X size={11} />
              </button>
            </div>
            <div className="text-[10px] font-semibold text-[var(--color-celeste-purple)] mt-1 flex items-center gap-1">
              <span>Question File</span>
            </div>
          </div>
        )}

        <textarea 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="[Question Box] Type the problem statement or question you're trying to solve here..."
          disabled={isAnalyzing}
          className="w-full bg-transparent resize-none outline-none text-[var(--color-celeste-text)] font-medium placeholder:text-[var(--color-celeste-purple)]/50 min-h-[55px]"
        />
      </div>

      {/* Window 2: Working Box */}
      <div id="working-box" data-window="working-box" className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider">Working Box</h2>
            <span className="px-2 py-0.5 rounded-md bg-violet-100 text-[10px] font-bold text-[var(--color-celeste-purple)] border border-violet-200 shadow-xs">
              Window 2
            </span>
          </div>
          {workingAttachment && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-celeste-purple)]">
              <span>Working file attached</span>
              <button
                type="button"
                onClick={() => setWorkingAttachment?.(null)}
                className="text-xs text-rose-500 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* The Pill Container recoloured to Celeste UI */}
        <div className="flex-1 bg-white rounded-[28px] border-2 border-[var(--color-celeste-light)] hover:border-[var(--color-celeste-purple-light)]/70 shadow-[0_8px_30px_rgba(139,127,232,0.08)] p-4 sm:p-5 flex flex-col justify-between transition-all min-h-[240px] relative">
          {/* Top-Left Square Attachment Preview inside the pill for Working (Separate from Question) */}
          {workingAttachment && (
            <div className="mb-3 relative inline-block self-start">
              <div 
                onClick={() => onOpenPreview?.(workingAttachment)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative shadow-sm border-2 border-[var(--color-celeste-purple)]/25 bg-[var(--color-celeste-light)]/30 cursor-pointer group hover:ring-2 hover:ring-[var(--color-celeste-purple)] transition-all"
                title="Click to view working file in Preview Drawer"
              >
                {workingAttachment.type.startsWith('image/') ? (
                  <img 
                    src={workingAttachment.dataUrl} 
                    alt={workingAttachment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-rose-50">
                    <FileText size={26} className="text-rose-500 mb-1" />
                    <span className="text-[11px] font-semibold text-[var(--color-celeste-text)] truncate max-w-[90%]">{workingAttachment.name}</span>
                    <span className="text-[9px] text-rose-600 font-bold uppercase mt-0.5">PDF</span>
                  </div>
                )}

                {/* Remove button on top-right of working thumbnail */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkingAttachment?.(null);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Remove working attachment"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="text-[10px] font-semibold text-[var(--color-celeste-purple)] mt-1 flex items-center gap-1">
                <span>Working File</span>
              </div>
            </div>
          )}

          {/* Working Code Editor Area */}
          <div className="flex-1 overflow-auto min-h-[120px]">
            <Editor
              value={studentWorking}
              onValueChange={code => setStudentWorking(code)}
              highlight={highlight}
              padding={8}
              disabled={isAnalyzing}
              style={{
                fontFamily: '"Fira Code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: '100%',
                backgroundColor: 'transparent',
              }}
              textareaClassName="focus:outline-none text-[var(--color-celeste-text)] placeholder:text-[var(--color-celeste-purple)]/40"
            />
          </div>

          {/* Bottom Action Row inside the Pill: Plus & Digitize on left, Circular send on right */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-celeste-light)] mt-2">
            <div className="flex items-center gap-2">
              {/* Plus button to attach working file */}
              <button
                type="button"
                onClick={() => workingFileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-9 h-9 rounded-full bg-[var(--color-celeste-light)] hover:bg-[var(--color-celeste-purple)] text-[var(--color-celeste-purple)] hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer disabled:opacity-40"
                title="Attach your working file (Images, PDFs)"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                ref={workingFileInputRef}
                onChange={handleWorkingFileUpload}
              />

              {onNotebookScan && (
                <button
                  type="button"
                  onClick={() => onNotebookScan(undefined as any)}
                  disabled={isScanningNotebook || (!studentWorking.trim() && !workingAttachment && !questionAttachment && !image)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 hover:bg-violet-200 text-[var(--color-celeste-purple)] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                  title="Digitize attached notes or handwriting into a study sheet"
                >
                  <BookOpen size={14} />
                  <span>{isScanningNotebook ? "Digitizing..." : "Digitize Notes"}</span>
                </button>
              )}
            </div>

            {/* Right: Circular Send Button with Celeste Purple Gradient (NO mic, NO think) */}
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing || (!question.trim() && !studentWorking.trim() && !questionAttachment && !workingAttachment)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--color-celeste-purple)] to-[var(--color-celeste-purple-light)] hover:shadow-lg hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
              title="Submit for Review"
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Submit Button */}
      <button 
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="bg-gradient-to-r from-[var(--color-celeste-purple)] to-[var(--color-celeste-purple-light)] text-white font-semibold py-3.5 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer text-sm"
      >
        {isAnalyzing ? "Analyzing..." : "Submit for Review"}
      </button>
    </div>
  );
}
