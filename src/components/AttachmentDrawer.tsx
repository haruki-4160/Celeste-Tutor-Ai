'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  FileText, 
  Image as ImageIcon, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Download
} from 'lucide-react';
import { AttachmentFile, DrawerSnapState } from '@/types/attachment';

interface AttachmentDrawerProps {
  attachment: AttachmentFile | null;
  questionAttachment?: AttachmentFile | null;
  workingAttachment?: AttachmentFile | null;
  onSelectAttachment?: (att: AttachmentFile) => void;
  onRemove: (att: AttachmentFile) => void;
  snapState: DrawerSnapState;
  setSnapState: (state: DrawerSnapState) => void;
}

export default function AttachmentDrawer({
  attachment,
  questionAttachment,
  workingAttachment,
  onSelectAttachment,
  onRemove,
  snapState,
  setSnapState,
}: AttachmentDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeAttachment = attachment || questionAttachment || workingAttachment;
  if (!activeAttachment) return null;

  const hasBoth = Boolean(questionAttachment && workingAttachment);
  const isPdf = activeAttachment.type === 'application/pdf';
  const isImage = activeAttachment.type.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offsetThreshold = 40;
    const velocityThreshold = 200;

    // Dragging up (negative y)
    if (info.offset.y < -offsetThreshold || info.velocity.y < -velocityThreshold) {
      if (snapState === 'collapsed') {
        setSnapState('half');
      } else if (snapState === 'half') {
        setSnapState('expanded');
      }
    } 
    // Dragging down (positive y)
    else if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
      if (snapState === 'expanded') {
        setSnapState('half');
      } else if (snapState === 'half') {
        setSnapState('collapsed');
      }
    }
  };

  const toggleExpand = () => {
    if (snapState === 'collapsed') {
      setSnapState('half');
    } else if (snapState === 'half') {
      setSnapState('expanded');
    } else {
      setSnapState('collapsed');
    }
  };

  // Height configurations
  const heightVariants = {
    collapsed: '64px',
    half: '340px',
    expanded: '82%',
  };

  return (
    <AnimatePresence>
      <motion.div
        id="preview-drawer"
        data-window="preview-drawer"
        ref={containerRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: heightVariants[snapState] }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t-2 border-x border-[var(--color-celeste-light)] rounded-t-3xl shadow-[0_-12px_36px_rgba(139,127,232,0.2)] flex flex-col overflow-hidden"
      >
        {/* Drag Handle Bar */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full pt-2.5 pb-1 flex flex-col items-center cursor-grab active:cursor-grabbing select-none shrink-0 group"
          onClick={toggleExpand}
          title="Drag up or down, or click to resize"
        >
          <div className="w-12 h-1.5 bg-slate-300 group-hover:bg-[var(--color-celeste-purple)] transition-colors rounded-full" />
        </motion.div>

        {/* Tab switch if both Question and Working attachments exist */}
        {hasBoth && snapState !== 'collapsed' && (
          <div className="px-5 pt-1 pb-2 flex items-center gap-2 border-b border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => questionAttachment && onSelectAttachment?.(questionAttachment)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeAttachment === questionAttachment
                  ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Question File ({questionAttachment?.name.slice(0, 12)}...)
            </button>
            <button
              type="button"
              onClick={() => workingAttachment && onSelectAttachment?.(workingAttachment)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeAttachment === workingAttachment
                  ? 'bg-[var(--color-celeste-purple)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Working File ({workingAttachment?.name.slice(0, 12)}...)
            </button>
          </div>
        )}

        {/* Drawer Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 shrink-0 gap-3">
          <div 
            onClick={toggleExpand}
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 select-none"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isPdf 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-violet-100 text-[var(--color-celeste-purple)]'
            }`}>
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                  Window 4 • Preview Drawer
                </span>
                <span className="px-1.5 py-0.5 rounded bg-violet-50 text-[10px] font-bold text-[var(--color-celeste-purple)] border border-violet-200 uppercase">
                  {activeAttachment.source === 'question' ? 'Question File' : 'Working File'}
                </span>
                <span className="font-semibold text-xs text-[var(--color-celeste-text)] truncate max-w-[120px] sm:max-w-[160px]">
                  {activeAttachment.name}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isPdf 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                    : 'bg-violet-50 text-[var(--color-celeste-purple)] border border-violet-200'
                }`}>
                  {isPdf ? 'PDF' : 'IMAGE'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatFileSize(activeAttachment.size)}</span>
                {snapState === 'collapsed' && (
                  <span className="text-[var(--color-celeste-purple)] font-medium">
                    • Click or drag up to preview
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Open in new tab */}
            <a
              href={activeAttachment.dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-[var(--color-celeste-purple)] hover:bg-slate-100 rounded-lg transition-colors"
              title="Open full file in new tab"
            >
              <ExternalLink size={15} />
            </a>

            {/* Toggle Fullscreen / Height */}
            <button
              type="button"
              onClick={() => {
                if (snapState === 'expanded') {
                  setSnapState('half');
                } else {
                  setSnapState('expanded');
                }
              }}
              className="p-1.5 text-slate-400 hover:text-[var(--color-celeste-purple)] hover:bg-slate-100 rounded-lg transition-colors"
              title={snapState === 'expanded' ? "Shrink preview" : "Maximize preview"}
            >
              {snapState === 'expanded' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Expand / Collapse Chevron */}
            <button
              type="button"
              onClick={toggleExpand}
              className="p-1.5 text-slate-400 hover:text-[var(--color-celeste-purple)] hover:bg-slate-100 rounded-lg transition-colors"
              title={snapState === 'collapsed' ? "Expand preview" : "Collapse preview"}
            >
              {snapState === 'collapsed' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Remove Attachment */}
            <button
              type="button"
              onClick={() => onRemove(activeAttachment)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body Preview (Visible when not collapsed) */}
        {snapState !== 'collapsed' && (
          <div className="flex-1 p-3 overflow-hidden flex flex-col bg-slate-50/50">
            {isImage && (
              <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto rounded-2xl bg-white border border-slate-100 p-2 shadow-inner">
                <img
                  src={activeAttachment.dataUrl}
                  alt={activeAttachment.name}
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              </div>
            )}

            {isPdf && (
              <div className="flex-1 w-full h-full flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-inner relative">
                <iframe
                  src={activeAttachment.dataUrl}
                  title={activeAttachment.name}
                  className="w-full h-full border-0"
                />
                <div className="p-2 bg-slate-100/90 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600 shrink-0">
                  <span className="truncate pr-2 font-medium">{activeAttachment.name}</span>
                  <a
                    href={activeAttachment.dataUrl}
                    download={activeAttachment.name}
                    className="flex items-center gap-1 text-[var(--color-celeste-purple)] font-semibold hover:underline"
                  >
                    <Download size={13} />
                    Download
                  </a>
                </div>
              </div>
            )}

            {!isImage && !isPdf && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-slate-100">
                <FileText size={48} className="text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-[var(--color-celeste-text)]">{activeAttachment.name}</p>
                <p className="text-xs text-slate-400 mt-1">{formatFileSize(activeAttachment.size)}</p>
                <a
                  href={activeAttachment.dataUrl}
                  download={activeAttachment.name}
                  className="mt-3 px-4 py-2 bg-[var(--color-celeste-purple)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download File
                </a>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
