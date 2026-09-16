"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TutorChat, { Message } from '@/components/TutorChat';
import ProblemInput from '@/components/ProblemInput';
import SettingsModal from '@/components/SettingsModal';
import { useAuth } from '@/context/AuthContext';
import { addXP } from '@/lib/db';
import { AttachmentFile, DrawerSnapState } from '@/types/attachment';
import { NotebookNote } from '@/types/notebook';
import { saveNote, fetchNotes } from '@/lib/notebookStore';
import { ProblemSession } from '@/types/session';
import { saveSession } from '@/lib/sessionStore';
import imageCompression from 'browser-image-compression';

const DEFAULT_MESSAGE: Message = {
  id: '1',
  role: 'tutor',
  text: "Hello! I'm Celeste, your AI tutor. I'm here to guide you to the answer, not just give it to you. What are we working on today?",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [question, setQuestion] = useState("");
  const [studentWorking, setStudentWorking] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
  const [questionAttachment, setQuestionAttachment] = useState<AttachmentFile | null>(null);
  const [workingAttachment, setWorkingAttachment] = useState<AttachmentFile | null>(null);
  const [activePreviewAttachment, setActivePreviewAttachment] = useState<AttachmentFile | null>(null);
  const [drawerSnapState, setDrawerSnapState] = useState<DrawerSnapState>('half');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // NotebookLM States
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'notebook'>('chat');
  const [notebookNote, setNotebookNote] = useState<NotebookNote | null>(null);
  const [isScanningNotebook, setIsScanningNotebook] = useState(false);
  const [pastNotes, setPastNotes] = useState<NotebookNote[]>([]);
  
  const { user, stats, recordSolvedProblem, updateLocalXP } = useAuth();

  useEffect(() => {
    fetchNotes(user?.uid).then(notes => {
      if (notes && notes.length > 0) {
        setPastNotes(notes);
      }
    }).catch(err => console.warn('Could not fetch past notes:', err));
  }, [user]);

  const handleNewSession = () => {
    setQuestion('');
    setStudentWorking('');
    setImage(null);
    setAttachment(null);
    setQuestionAttachment(null);
    setWorkingAttachment(null);
    setActivePreviewAttachment(null);
    setDrawerSnapState('half');
    setMessages([DEFAULT_MESSAGE]);
  };

  const handleAttachFile = async (file: File) => {
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
        dataUrl: finalDataUrl
      };

      setAttachment(fileObj);
      setImage(finalDataUrl);
      setDrawerSnapState('half');
    } catch (err) {
      console.error('Error handling attached file:', err);
    }
  };

  const handleRemoveAttachment = (att?: AttachmentFile) => {
    if (!att) {
      setAttachment(null);
      setQuestionAttachment(null);
      setWorkingAttachment(null);
      setActivePreviewAttachment(null);
      setImage(null);
      return;
    }
    if (att === questionAttachment || att.source === 'question') {
      setQuestionAttachment(null);
    }
    if (att === workingAttachment || att.source === 'working') {
      setWorkingAttachment(null);
    }
    if (att === attachment) {
      setAttachment(null);
    }
    if (activePreviewAttachment === att) {
      setActivePreviewAttachment(questionAttachment !== att ? questionAttachment : workingAttachment);
    }
  };

  const handleAnalyze = async () => {
    if (!question && !questionAttachment && !workingAttachment && !image) return;
    if (!studentWorking && !workingAttachment && !questionAttachment && !image) return;
    
    setIsAnalyzing(true);
    
    // Optimistically add the user's message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: studentWorking || question || "Please review my problem and attached file.",
      attachment: workingAttachment || questionAttachment || attachment || undefined
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Auto-collapse preview drawer so the user can read the conversation
    if (questionAttachment || workingAttachment || attachment) {
      setDrawerSnapState('collapsed');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: question || (questionAttachment ? `Problem from attached Question file: ${questionAttachment.name}` : "Please review my working."),
          studentWorking: studentWorking, 
          questionAttachment: questionAttachment,
          workingAttachment: workingAttachment,
          image: workingAttachment?.dataUrl || questionAttachment?.dataUrl || image,
          attachment: activePreviewAttachment || workingAttachment || questionAttachment || attachment
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const data = await response.json();

      const session: ProblemSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        question: question || (questionAttachment ? `Problem from ${questionAttachment.name}` : "Problem review"),
        studentWorking: studentWorking,
        questionAttachmentName: questionAttachment?.name,
        workingAttachmentName: workingAttachment?.name,
        tutorMessage: data.tutorMessage,
        errorFound: data.errorFound,
        errorCategory: data.errorCategory,
        steps: data.steps || [],
        hints: data.hints || []
      };
      await saveSession(session, user?.uid);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        text: data.tutorMessage,
        hints: data.hints
      }]);

      // Award XP and advance streak/problem stats!
      await recordSolvedProblem(15);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "I'm having a little trouble thinking right now. Please try again!";
      if (error.name === 'AbortError') {
        errorMessage = "The connection timed out. Please try again!";
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        text: errorMessage
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNotebookScan = async () => {
    const targetMedia = workingAttachment?.dataUrl || questionAttachment?.dataUrl || attachment?.dataUrl || image;
    const targetAtt = workingAttachment || questionAttachment || attachment;
    if (!targetMedia && !studentWorking.trim()) {
      alert("Please attach an image, notes, or enter your working first.");
      return;
    }

    setIsScanningNotebook(true);
    setActiveRightTab('notebook');

    try {
      const response = await fetch('/api/notebook/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: targetMedia,
          mimeType: targetAtt?.type || (targetMedia?.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg'),
          filename: targetAtt?.name || 'Handwritten Notes',
          extractedText: studentWorking || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to scan notes (Status: ${response.status})`);
      }

      const newNote: NotebookNote = await response.json();
      setNotebookNote(newNote);
      await saveNote(newNote, user?.uid);
      setPastNotes(prev => [newNote, ...prev.filter(n => n.id !== newNote.id)]);

      // Notify the user in tutor chat that notes are compiled
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'tutor',
          text: `✨ I've digitized your note: **"${newNote.title}"**! I converted handwritten equations to clean LaTeX, deciphered shorthand, and prepared a study guide. You can view it in the **Notebook** tab or ask me questions about it right here.`
        }
      ]);

      if (user) {
        updateLocalXP(20);
        await addXP(user.uid, 20);
      }
    } catch (err: any) {
      console.error('Error digitizing notes:', err);
      alert(err.message || 'Could not digitize notes. Please try again.');
    } finally {
      setIsScanningNotebook(false);
    }
  };

  const handleChatSend = async (text: string) => {
    if (!text && !attachment) return;

    // If Question box is empty and text was typed in chat, sync question
    const queryQuestion = question || text || (attachment ? `Please help with attached ${attachment.name}` : "");
    if (!question && text) {
      setQuestion(text);
    }

    setIsAnalyzing(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || `Attached file: ${attachment?.name}`,
      attachment: notebookNote ? undefined : (attachment || undefined)
    };
    setMessages(prev => [...prev, userMsg]);

    // Collapse drawer so response is visible
    if (attachment) {
      setDrawerSnapState('collapsed');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      // TOKEN CONSERVATION: If notebookNote is active, pass cached text context instead of heavy base64 image!
      const notebookContext = notebookNote 
        ? `Document: ${notebookNote.title} (${notebookNote.topic})\nTranscription:\n${notebookNote.transcription}\n\nKey Formulas:\n${notebookNote.studyNotes.formulas.map(f => f.formula + ': ' + f.meaning).join('\n')}`
        : undefined;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: queryQuestion,
          studentWorking: studentWorking,
          chatFollowUp: text,
          questionAttachment: questionAttachment,
          workingAttachment: workingAttachment,
          image: notebookContext ? null : (activePreviewAttachment?.dataUrl || workingAttachment?.dataUrl || questionAttachment?.dataUrl || attachment?.dataUrl || image),
          attachment: notebookContext ? null : (activePreviewAttachment || workingAttachment || questionAttachment || attachment),
          notebookContext: notebookContext
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        text: data.tutorMessage,
        hints: data.hints
      }]);

      await recordSolvedProblem(15);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "I'm having a little trouble thinking right now. Please try again!";
      if (error.name === 'AbortError') {
        errorMessage = "The connection timed out. Please try again!";
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        text: errorMessage
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex relative">
      {/* Sidebar - Column 1 */}
      <Sidebar 
        onNewSession={handleNewSession} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        xp={stats.xp}
        streak={stats.streak}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (Hidden on large screens where Sidebar is visible) */}
        <div className="md:hidden">
            <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
            {/* Center Panel - Column 2: Problem & Input */}
            <div className="flex flex-col h-full">
              <ProblemInput 
                question={question}
                setQuestion={setQuestion}
                studentWorking={studentWorking} 
                setStudentWorking={setStudentWorking} 
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                image={image}
                setImage={setImage}
                questionAttachment={questionAttachment}
                setQuestionAttachment={setQuestionAttachment}
                workingAttachment={workingAttachment}
                setWorkingAttachment={setWorkingAttachment}
                onOpenPreview={(att) => {
                  setActivePreviewAttachment(att ?? null);
                  setDrawerSnapState('half');
                }}
                onNotebookScan={handleNotebookScan}
                isScanningNotebook={isScanningNotebook}
              />
            </div>

            {/* Right Panel - Column 3: AI Analysis, Notebook & Chat */}
            <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[var(--color-celeste-light)] relative">
              <TutorChat 
                messages={messages} 
                isAnalyzing={isAnalyzing}
                attachment={activePreviewAttachment || workingAttachment || questionAttachment || attachment}
                questionAttachment={questionAttachment}
                workingAttachment={workingAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                onSelectPreviewAttachment={(att) => setActivePreviewAttachment(att)}
                drawerSnapState={drawerSnapState}
                setDrawerSnapState={setDrawerSnapState}
                onAttachFile={handleAttachFile}
                onSendMessage={handleChatSend}
                activeTab={activeRightTab}
                setActiveTab={setActiveRightTab}
                notebookNote={notebookNote}
                isIngestingNote={isScanningNotebook}
                pastNotes={pastNotes}
                onSelectPastNote={(selected) => {
                  setNotebookNote(selected);
                  setActiveRightTab('notebook');
                }}
                onNotebookAskQuestion={(qText) => {
                  setActiveRightTab('chat');
                  handleChatSend(qText);
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
