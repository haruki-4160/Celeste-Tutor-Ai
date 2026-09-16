"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SettingsModal from '@/components/SettingsModal';
import { useAuth } from '@/context/AuthContext';
import { fetchSessions, deleteSession } from '@/lib/sessionStore';
import { fetchNotes, deleteNote } from '@/lib/notebookStore';
import { ProblemSession, StepItem } from '@/types/session';
import { NotebookNote } from '@/types/notebook';
import { renderMathMarkdown } from '@/components/NotebookNotesView';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  BookOpen,
  Sparkles,
  FileText,
  ChevronRight,
  X,
  Calendar,
  Layers,
  Search,
  MessageSquare,
  Lightbulb,
  ExternalLink,
  Sigma,
  ArrowRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, stats } = useAuth();

  const [sessions, setSessions] = useState<ProblemSession[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'sessions' | 'notes'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ProblemSession | null>(null);
  const [selectedNote, setSelectedNote] = useState<NotebookNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch sessions and notes on mount / user change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchSessions(user?.uid).catch((err) => {
        console.warn('Error fetching sessions:', err);
        return [] as ProblemSession[];
      }),
      fetchNotes(user?.uid).catch((err) => {
        console.warn('Error fetching notes:', err);
        return [] as NotebookNote[];
      })
    ]).then(([fetchedSessions, fetchedNotes]) => {
      if (isMounted) {
        setSessions(fetchedSessions || []);
        setNotes(fetchedNotes || []);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId, user?.uid);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId, user?.uid);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter items
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.question.toLowerCase().includes(q) ||
      s.tutorMessage.toLowerCase().includes(q) ||
      (s.errorCategory && s.errorCategory.toLowerCase().includes(q))
    );
  });

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.topic.toLowerCase().includes(q) ||
      n.transcription.toLowerCase().includes(q)
    );
  });

  const totalItemsCount =
    activeTab === 'all'
      ? filteredSessions.length + filteredNotes.length
      : activeTab === 'sessions'
      ? filteredSessions.length
      : filteredNotes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex">
      {/* Sidebar */}
      <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} xp={stats.xp} streak={stats.streak} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden">
          <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Bar: Title & Stats Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[var(--color-celeste-purple)]/15 text-[var(--color-celeste-purple)] rounded-xl">
                  <Clock className="w-5 h-5" />
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-celeste-text)] tracking-tight">
                  Learning History
                </h1>
              </div>
              <p className="text-sm text-[var(--color-celeste-text)]/70 mt-1">
                Review past problem breakdowns, tutor diagnostics, and digitized study notes.
              </p>
            </div>

            {/* Quick Action: New practice session */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-celeste-purple)] hover:bg-[var(--color-celeste-purple)]/90 text-white font-semibold text-sm shadow-md shadow-[var(--color-celeste-purple)]/20 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Practice New Problem</span>
            </Link>
          </div>

          {/* Search and Tabs Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-[var(--color-celeste-purple)]/15 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--color-celeste-light)]/60 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-white text-[var(--color-celeste-text)] shadow-xs'
                    : 'text-[var(--color-celeste-text)]/70 hover:text-[var(--color-celeste-text)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Activity ({sessions.length + notes.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'sessions'
                    ? 'bg-white text-[var(--color-celeste-text)] shadow-xs'
                    : 'text-[var(--color-celeste-text)]/70 hover:text-[var(--color-celeste-text)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Problem Sessions ({sessions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'notes'
                    ? 'bg-white text-[var(--color-celeste-text)] shadow-xs'
                    : 'text-[var(--color-celeste-text)]/70 hover:text-[var(--color-celeste-text)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Notebook Notes ({notes.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-celeste-text)]/40" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-[var(--color-celeste-purple)]/20 text-xs md:text-sm text-[var(--color-celeste-text)] placeholder:text-[var(--color-celeste-text)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-celeste-purple)]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 border-3 border-[var(--color-celeste-purple)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[var(--color-celeste-text)]/70">
                Loading your learning history...
              </p>
            </div>
          ) : totalItemsCount === 0 ? (
            /* Empty State */
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-10 md:p-14 text-center border border-[var(--color-celeste-purple)]/15 shadow-sm max-w-lg mx-auto my-12 space-y-5">
              <div className="w-16 h-16 bg-[var(--color-celeste-light)] rounded-2xl flex items-center justify-center mx-auto shadow-inner text-[var(--color-celeste-purple)]">
                {activeTab === 'notes' ? (
                  <BookOpen className="w-8 h-8" />
                ) : (
                  <Clock className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--color-celeste-text)]">
                  {searchQuery
                    ? 'No matching records'
                    : activeTab === 'notes'
                    ? 'No notes digitized yet'
                    : activeTab === 'sessions'
                    ? 'No problem sessions yet'
                    : 'Your history is clear'}
                </h3>
                <p className="text-sm text-[var(--color-celeste-purple)]">
                  {searchQuery
                    ? `No activity matches "${searchQuery}". Try a different term.`
                    : 'Complete problem breakdowns with Celeste or scan your handwritten notes to see your history grow.'}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-celeste-purple)] hover:bg-[var(--color-celeste-purple)]/90 text-white text-sm font-semibold shadow-md shadow-[var(--color-celeste-purple)]/25 transition-all"
              >
                <span>Start Learning Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Grid of Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Problem Sessions */}
              {(activeTab === 'all' || activeTab === 'sessions') &&
                filteredSessions.map((session) => {
                  const isError = session.errorFound;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="group bg-white/80 hover:bg-white backdrop-blur-md rounded-2xl p-5 border border-[var(--color-celeste-purple)]/15 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top status bar accent */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 ${
                          isError
                            ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        }`}
                      />

                      <div className="space-y-3">
                        {/* Header: Status badge & timestamp */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isError
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isError ? (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Needs Revision</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>All Steps Correct</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] text-[var(--color-celeste-text)]/60 font-medium">
                            {formatDate(session.createdAt)}
                          </span>
                        </div>

                        {/* Question Preview */}
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--color-celeste-text)] line-clamp-2 group-hover:text-[var(--color-celeste-purple)] transition-colors">
                            {session.question || 'Problem analysis'}
                          </h4>
                          {session.studentWorking && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                              Work: {session.studentWorking}
                            </p>
                          )}
                        </div>

                        {/* Tutor Diagnosis Preview */}
                        <div className="p-2.5 rounded-xl bg-[var(--color-celeste-light)]/40 border border-[var(--color-celeste-purple)]/10 text-xs text-[var(--color-celeste-text)]/80 line-clamp-2">
                          {session.tutorMessage}
                        </div>
                      </div>

                      {/* Footer: Tags, step count & delete action */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {session.errorCategory && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-medium">
                              {session.errorCategory}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5" />
                            {session.steps?.length || 0} steps
                          </span>
                          {session.hints && session.hints.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium flex items-center gap-0.5">
                              <Lightbulb className="w-2.5 h-2.5" />
                              {session.hints.length} hints
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="p-1 text-[var(--color-celeste-purple)] group-hover:translate-x-0.5 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Notebook Notes */}
              {(activeTab === 'all' || activeTab === 'notes') &&
                filteredNotes.map((note) => {
                  return (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className="group bg-white/80 hover:bg-white backdrop-blur-md rounded-2xl p-5 border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top status bar accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-celeste-purple)] to-indigo-400" />

                      <div className="space-y-3">
                        {/* Header: Note badge & timestamp */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[var(--color-celeste-purple)] border border-purple-200">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Notebook Note</span>
                          </span>

                          <span className="text-[11px] text-[var(--color-celeste-text)]/60 font-medium">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>

                        {/* Title & Topic */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider">
                              {note.topic || 'General'}
                            </span>
                            {note.sourceName && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                {note.sourceName}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-[var(--color-celeste-text)] line-clamp-2 group-hover:text-[var(--color-celeste-purple)] transition-colors">
                            {note.title || 'Untitled Note'}
                          </h4>
                        </div>

                        {/* Explanation preview */}
                        <div className="p-2.5 rounded-xl bg-[var(--color-celeste-light)]/40 border border-[var(--color-celeste-purple)]/10 text-xs text-[var(--color-celeste-text)]/80 line-clamp-2">
                          {note.explanation || note.transcription}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {note.studyNotes?.formulas?.length ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium flex items-center gap-1">
                              <Sigma className="w-2.5 h-2.5" />
                              {note.studyNotes.formulas.length} formulas
                            </span>
                          ) : null}
                          {note.clarifications?.length ? (
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-medium">
                              {note.clarifications.length} clarif.
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNote(e, note.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="p-1 text-[var(--color-celeste-purple)] group-hover:translate-x-0.5 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </main>
      </div>

      {/* Problem Session Detail Modal / Drawer */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-purple-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[var(--color-celeste-light)]/30">
              <div className="flex items-center gap-2">
                <span
                  className={`p-2 rounded-xl ${
                    selectedSession.errorFound
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedSession.errorFound ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-[var(--color-celeste-text)] text-base md:text-lg">
                    {selectedSession.errorFound ? 'Session Diagnostics' : 'Verified Problem Solution'}
                  </h3>
                  <p className="text-xs text-[var(--color-celeste-text)]/60">
                    Recorded {formatDate(selectedSession.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[var(--color-celeste-text)]">
              {/* Question Section */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider">
                  Problem Statement
                </span>
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-sm">
                  {renderMathMarkdown(selectedSession.question)}
                </div>
                {selectedSession.questionAttachmentName && (
                  <p className="text-xs text-gray-500">
                    Attachment: <span className="font-medium">{selectedSession.questionAttachmentName}</span>
                  </p>
                )}
              </div>

              {/* Student's Working */}
              {selectedSession.studentWorking && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Student Working
                  </span>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 whitespace-pre-wrap">
                    {selectedSession.studentWorking}
                  </div>
                </div>
              )}

              {/* Tutor Diagnosis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Celeste Feedback
                  </span>
                  {selectedSession.errorCategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                      Category: {selectedSession.errorCategory}
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-celeste-light)]/70 to-purple-50 border border-[var(--color-celeste-purple)]/20 text-sm leading-relaxed">
                  {renderMathMarkdown(selectedSession.tutorMessage)}
                </div>
              </div>

              {/* Step-by-Step Breakdown */}
              {selectedSession.steps && selectedSession.steps.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Step-by-Step Verification
                  </span>
                  <div className="space-y-2.5">
                    {selectedSession.steps.map((step: StepItem) => (
                      <div
                        key={step.stepNumber}
                        className={`p-3.5 rounded-xl border ${
                          step.isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            {step.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            )}
                            Step {step.stepNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              step.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {step.isCorrect ? 'Correct' : 'Needs Correction'}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-gray-900 mb-1">
                          {renderMathMarkdown(step.text)}
                        </div>
                        {step.explanation && (
                          <div className="text-xs text-gray-600 mt-1 border-t border-gray-200/60 pt-1">
                            {renderMathMarkdown(step.explanation)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hints */}
              {selectedSession.hints && selectedSession.hints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Guided Hints
                  </span>
                  <div className="space-y-2">
                    {selectedSession.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2"
                      >
                        <span className="font-bold shrink-0">{idx + 1}.</span>
                        <span>{renderMathMarkdown(hint)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => handleDeleteSession(e, selectedSession.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Session</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-[var(--color-celeste-purple)] hover:bg-[var(--color-celeste-purple)]/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-purple-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-[var(--color-celeste-purple)]">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-[var(--color-celeste-text)] text-base md:text-lg">
                    {selectedNote.title || 'Study Note'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-celeste-text)]/60">
                    <span className="font-semibold text-purple-600">{selectedNote.topic}</span>
                    <span>•</span>
                    <span>{formatDate(selectedNote.createdAt)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-[var(--color-celeste-text)]">
              {/* Key Takeaways */}
              {selectedNote.studyNotes?.keyTakeaways?.length ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Key Takeaways
                  </span>
                  <ul className="space-y-1.5">
                    {selectedNote.studyNotes.keyTakeaways.map((takeaway, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/60 text-xs flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-celeste-purple)] shrink-0 mt-0.5" />
                        <span>{renderMathMarkdown(takeaway)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Formulas */}
              {selectedNote.studyNotes?.formulas?.length ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5" /> Formulas & Equations
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNote.studyNotes.formulas.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs"
                      >
                        <div className="font-semibold text-emerald-900 mb-1">
                          {renderMathMarkdown(item.formula)}
                        </div>
                        <div className="text-gray-600">{item.meaning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Cheat Sheet Summary */}
              {selectedNote.studyNotes?.cheatSheetSummary && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Summary
                  </span>
                  <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs leading-relaxed">
                    {renderMathMarkdown(selectedNote.studyNotes.cheatSheetSummary)}
                  </div>
                </div>
              )}

              {/* Transcription */}
              {selectedNote.transcription && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Digitized Transcription
                  </span>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs leading-relaxed">
                    {renderMathMarkdown(selectedNote.transcription)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => handleDeleteNote(e, selectedNote.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Note</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-[var(--color-celeste-purple)] hover:bg-[var(--color-celeste-purple)]/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Profile Modal */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
