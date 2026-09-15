import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Sparkles } from 'lucide-react';
import InteractiveHint from './InteractiveHint';
import { useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

export type Message = {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  isAnalyzing?: boolean;
  hints?: string[];
};

interface TutorChatProps {
  messages: Message[];
  isAnalyzing: boolean;
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

export default function TutorChat({ messages, isAnalyzing }: TutorChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  return (
    <div className="p-8 h-full flex flex-col max-h-full">
      <h2 className="text-xs font-bold text-[var(--color-celeste-purple)] uppercase mb-6 shrink-0 tracking-widest flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        Celeste Tutor
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
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
                  Analyzing your working...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
