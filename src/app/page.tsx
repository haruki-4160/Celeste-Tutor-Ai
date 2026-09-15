"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import ProblemInput from '@/components/ProblemInput';
import Sidebar from '@/components/Sidebar';
import TutorChat from '@/components/TutorChat';

export default function Home() {
  const [studentWorking, setStudentWorking] = useState(`Given:
u = 10
v = 30
t = 5

a = (v + u) / t
a = 40 / 5
a = 8 m/s²`);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'tutor' as const,
      text: 'Hi there! I noticed you are working on an acceleration problem. Would you like me to take a look at your working?',
    }
  ]);

  const analyzeReasoning = async () => {
    setIsAnalyzing(true);
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: 'Yes, please review my work.'
    }]);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'A car accelerates from 10 m/s to 30 m/s in 5 seconds. Find the acceleration.',
          studentWorking: studentWorking
        })
      });

      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'tutor',
        text: data.tutorMessage,
        hints: data.hints
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'tutor',
        text: "I'm having a little trouble thinking right now. Please try again!",
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-celeste-light)] to-[var(--color-celeste-dark)] flex">
      {/* Sidebar - Column 1 */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (Hidden on large screens where Sidebar is visible) */}
        <div className="md:hidden">
            <Header />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
            {/* Center Panel - Column 2: Problem & Input */}
            <div className="flex flex-col h-full">
              <ProblemInput 
                studentWorking={studentWorking} 
                setStudentWorking={setStudentWorking} 
                onAnalyze={analyzeReasoning}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Right Panel - Column 3: AI Analysis & Chat */}
            <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[var(--color-celeste-light)]">
              <TutorChat messages={messages} isAnalyzing={isAnalyzing} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
