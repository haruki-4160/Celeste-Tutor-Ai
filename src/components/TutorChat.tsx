'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Plus, ArrowUp, Paperclip, BookOpen, MessageSquare } from 'lucide-react';
import InteractiveHint from './InteractiveHint';
import { useEffect, useRef, useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import AttachmentDrawer from './AttachmentDrawer';
import { AttachmentFile, DrawerSnapState } from '@/types/attachment';
import { NotebookNote } from '@/types/notebook';
import NotebookNotesView from './NotebookNotesView';

export type Message = {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  isAnalyzing?: boolean;
  hints?: string[];
  attachment?: AttachmentFile;
};

interface TutorChatProps {
  messages: Message[];
  isAnalyzing: boolean;
  attachment?: AttachmentFile | null;
  questionAttachment?: AttachmentFile | null;
  workingAttachment?: AttachmentFile | null;
  onRemoveAttachment?: (att?: AttachmentFile) => void;
  onSelectPreviewAttachment?: (att: AttachmentFile) => void;
  drawerSnapState?: DrawerSnapState;
  setDrawerSnapState?: (state: DrawerSnapState) => void;
  onAttachFile?: (file: File) => void;
  onSendMessage?: (text: string) => void;
  activeTab?: 'chat' | 'notebook';
  setActiveTab?: (tab: 'chat' | 'notebook') => void;
  notebookNote?: NotebookNote | null;
  isIngestingNote?: boolean;
  pastNotes?: NotebookNote[];
  onSelectPastNote?: (note: NotebookNote) => void;
  onNotebookAskQuestion?: (question: string) => void;
}

const renderTextWithMath = (text: string) => {
  // Simple regex to split text by $...$ for inline math and $$...$$ for block math
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      return <BlockMath key={index} math={math} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <InlineMath key={index} math={math} />;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function TutorChat({ 
  messages, 
  isAnalyzing,
  attachment = null,
  questionAttachment = null,
  workingAttachment = null,
  onRemoveAttachment = () => {},
  onSelectPreviewAttachment,
  drawerSnapState = 'half',
  setDrawerSnapState = () => {},
  onAttachFile,
  onSendMessage,
  activeTab = 'chat',
  setActiveTab = () => {},
  notebookNote = null,
  isIngestingNote = false,
  pastNotes = [],
  onSelectPastNote = () => {},
  onNotebookAskQuestion
}: TutorChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if ((!chatInput.trim() && !attachment) || isAnalyzing) return;
    if (onSendMessage) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div id="tutor-chatbox" data-window="tutor-chatbox" className="relative h-full flex flex-col max-h-full overflow-hidden">
      {/* Header with Segmented Tabs: Chat vs Notebook */}
      <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between border-b border-[var(--color-celeste-light)] bg-white/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab?.('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-[var(--color-celeste-text)] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={13} className={activeTab === 'chat' ? 'text-[var(--color-celeste-purple)]' : ''} />
            <span>Tutor Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab?.('notebook')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'notebook'
                ? 'bg-white text-[var(--color-celeste-text)] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={13} className={activeTab === 'notebook' ? 'text-[var(--color-celeste-purple)]' : ''} />
            <span>Notebook</span>
            {notebookNote && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
            {isIngestingNote && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {attachment && (
            <button
              type="button"
              onClick={() => setDrawerSnapState(drawerSnapState === 'collapsed' ? 'half' : 'collapsed')}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-[var(--color-celeste-purple)] hover:bg-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Toggle preview drawer"
            >
              <Paperclip size={12} />
              <span>1 file attached</span>
            </button>
          )}
        </div>
      </div>

      {/* Body: Either Notebook Notes View OR Tutor Chat */}
      {activeTab === 'notebook' ? (
        <div className="flex-1 overflow-hidden">
          <NotebookNotesView
            note={notebookNote ?? null}
            isLoading={Boolean(isIngestingNote)}
            onAskQuestion={(q) => {
              if (onNotebookAskQuestion) {
                onNotebookAskQuestion(q);
              } else if (onSendMessage) {
                onSendMessage(q);
                setActiveTab?.('chat');
              }
            }}
            onSwitchToChat={() => setActiveTab?.('chat')}
            pastNotes={pastNotes}
            onSelectPastNote={onSelectPastNote}
          />
        </div>
      ) : (
        <>
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-8 space-y-6 custom-scrollbar pb-24">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                    msg.role === 'tutor' 
                      ? 'border border-[var(--color-celeste-purple-light)]' 
                      : 'bg-white text-[var(--color-celeste-purple)] border-2 border-[var(--color-celeste-light)]'
                  }`}>
                    {msg.role === 'tutor' ? <img src="/logo.jpg" alt="Tutor" className="w-full h-full object-cover" /> : <User size={20} />}
                  </div>
                  
                  <div className={`flex flex-col gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`p-5 rounded-3xl text-[15px] leading-relaxed transition-colors ${
                      msg.role === 'tutor' 
                        ? 'shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white bg-white text-[var(--color-celeste-text)] rounded-tl-none' 
                        : 'shadow-inner border border-[var(--color-celeste-light)] bg-[var(--color-celeste-dark)] text-[var(--color-celeste-text)] rounded-tr-none font-medium'
                    }`}>
                      {renderTextWithMath(msg.text)}

                      {/* Render attachment thumbnail inside message bubble if present */}
                      {msg.attachment && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                          {msg.attachment.type.startsWith('image/') ? (
                            <img 
                              src={msg.attachment.dataUrl} 
                              alt={msg.attachment.name}
                              className="max-h-48 rounded-xl object-contain shadow-sm border border-white"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 border border-slate-200 text-xs">
                              <Paperclip size={14} className="text-rose-500" />
                              <span className="font-semibold truncate">{msg.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {msg.hints && msg.hints.length > 0 && (
                      <div className="w-full">
                        <InteractiveHint hints={msg.hints} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 flex-row"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-[var(--color-celeste-purple-light)] overflow-hidden">
                    <img src="/logo.jpg" alt="Tutor" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-3 max-w-[85%] items-start">
                    <div className="p-5 rounded-3xl text-[15px] leading-relaxed shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white bg-white text-[var(--color-celeste-purple)] rounded-tl-none flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-[var(--color-celeste-light)] border-t-[var(--color-celeste-purple)] rounded-full animate-spin" />
                      Analyzing your question...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Light Clean Chat Input Bar at bottom */}
          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-[var(--color-celeste-light)] shrink-0 relative z-20">
            <div className="flex items-center gap-2 bg-slate-50/90 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-celeste-purple)]/30 border border-slate-200/80 rounded-2xl px-3 py-2 transition-all shadow-sm">
              {/* Plus Button to Attach Files */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-8 h-8 rounded-xl bg-[var(--color-celeste-light)] hover:bg-[var(--color-celeste-purple)] text-[var(--color-celeste-purple)] hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-50"
                title="Attach file (Images, PDFs)"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {/* Text Input for question / message */}
              <input
                id="tutor-chat-input"
                data-window="tutor-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  notebookNote 
                    ? "[Notebook Chat] Ask a question about your scanned notes..." 
                    : attachment 
                      ? "[Tutor Chatbox] Add a message or press send..." 
                      : "[Tutor Chatbox] Ask Celeste a question or follow-up..."
                }
                disabled={isAnalyzing}
                className="flex-1 bg-transparent outline-none text-sm text-[var(--color-celeste-text)] placeholder:text-slate-400 font-medium px-1"
              />

              {/* Send Button with Celeste gradient */}
              <button
                type="button"
                onClick={handleSend}
                disabled={isAnalyzing || (!chatInput.trim() && !attachment)}
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-[var(--color-celeste-purple)] to-[var(--color-celeste-purple-light)] text-white flex items-center justify-center shadow-sm hover:shadow transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Drag-Up Preview Window inside Chatbox */}
      <AttachmentDrawer
        attachment={attachment}
        questionAttachment={questionAttachment}
        workingAttachment={workingAttachment}
        onSelectAttachment={onSelectPreviewAttachment}
        onRemove={(att) => onRemoveAttachment?.(att)}
        snapState={drawerSnapState}
        setSnapState={setDrawerSnapState}
      />
    </div>
  );
}
