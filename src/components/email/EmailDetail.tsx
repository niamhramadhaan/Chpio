import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Star, Trash2, ArrowLeft, Paperclip, Reply, Forward, FileText, CheckSquare } from 'lucide-react';
import { useDocsStore } from '../../store/docsStore';
import { useNotesStore } from '../../store/notesStore';
import type { EmailMessage } from '../../types';

interface EmailDetailProps {
  message: EmailMessage;
  onBack: () => void;
  onToggleStar: (uid: number, current: boolean) => void;
  onDelete: (uid: number) => void;
  onReply: () => void;
  onForward: () => void;
}

function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const triageStyles: Record<string, string> = {
  urgent: 'bg-red-400/15 text-red-400 border-red-400/20',
  fyi: 'bg-blue-400/15 text-blue-400 border-blue-400/20',
  newsletter: 'bg-white/10 text-white/30 border-white/10',
  spam: 'bg-amber-400/10 text-amber-400/50 border-amber-400/10',
};

export function EmailDetail({ message, onBack, onToggleStar, onDelete, onReply, onForward }: EmailDetailProps) {
  const [showHtml, setShowHtml] = useState(false);
  const [savedToDocs, setSavedToDocs] = useState(false);
  const [createdTask, setCreatedTask] = useState(false);
  const senderName = message.from.name || message.from.address;
  const toList = message.to.map((t) => t.name || t.address).join(', ');

  const createDoc = useDocsStore((s) => s.createDoc);
  const updateDoc = useDocsStore((s) => s.updateDoc);
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const addTask = useNotesStore((s) => s.addTask);
  const folders = useNotesStore((s) => s.folders);

  const handleSaveToDocs = useCallback(() => {
    const docContent = `# ${message.subject}\n\n**From:** ${senderName} <${message.from.address}>  \n**To:** ${toList}  \n**Date:** ${new Date(message.date).toLocaleString()}\n\n---\n\n${message.textBody || message.snippet}`;
    const id = createDoc(`Email: ${message.subject}`);
    updateDoc(id, { content: docContent });
    setSavedToDocs(true);
    setTimeout(() => setSavedToDocs(false), 2000);
  }, [message, senderName, toList, createDoc, updateDoc]);

  const handleCreateTask = useCallback(() => {
    const defaultFolder = folders[0]?.id || 'default';
    const taskContent = `Follow up on: ${message.subject}\nFrom: ${senderName} <${message.from.address}>\nDate: ${new Date(message.date).toLocaleDateString()}`;
    const noteId = createNote(defaultFolder);
    updateNote(noteId, { title: `Follow up: ${message.subject}`, content: taskContent });
    addTask(noteId, `Reply to ${senderName}`);
    setCreatedTask(true);
    setTimeout(() => setCreatedTask(false), 2000);
  }, [message, senderName, folders, createNote, updateNote, addTask]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <button onClick={onBack} className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onReply}
          className="p-1 rounded-lg text-white/30 hover:text-teal-400 hover:bg-white/5 transition-colors cursor-pointer"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onForward}
          className="p-1 rounded-lg text-white/30 hover:text-teal-400 hover:bg-white/5 transition-colors cursor-pointer"
          title="Forward"
        >
          <Forward className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onToggleStar(message.uid, message.isStarred)}
          className="p-1 rounded-lg text-white/30 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Star className={`w-3.5 h-3.5 ${message.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
        </button>
        <button
          onClick={() => onDelete(message.uid)}
          className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-white/10 mx-0.5" />
        <button
          onClick={handleSaveToDocs}
          className="p-1 rounded-lg text-white/30 hover:text-teal-400 hover:bg-white/5 transition-colors cursor-pointer"
          title={savedToDocs ? 'Saved!' : 'Save to Docs'}
        >
          {savedToDocs ? <CheckSquare className="w-3.5 h-3.5 text-teal-400" /> : <FileText className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleCreateTask}
          className="p-1 rounded-lg text-white/30 hover:text-teal-400 hover:bg-white/5 transition-colors cursor-pointer"
          title={createdTask ? 'Task created!' : 'Create task'}
        >
          {createdTask ? <CheckSquare className="w-3.5 h-3.5 text-teal-400" /> : <CheckSquare className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Header */}
        <div className="space-y-1.5">
          <h2 className="text-[13px] text-white/80 font-medium leading-snug">{message.subject}</h2>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-400/15 flex items-center justify-center text-[10px] text-teal-400 font-medium shrink-0">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/60 font-medium truncate">{senderName}</p>
              <p className="text-[9px] text-white/20 truncate">{message.from.address} → {toList}</p>
            </div>
            <span className="text-[9px] text-white/20 shrink-0">{formatFullDate(message.date)}</span>
          </div>
          {message.triage && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] border ${triageStyles[message.triage] || ''}`}>
              {message.triage}
            </div>
          )}
          {message.tags && message.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {message.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 border border-white/[0.06]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] text-white/20 uppercase tracking-wider">Attachments</p>
            <div className="flex flex-wrap gap-1.5">
              {message.attachments.map((att) => (
                <div key={att.partId} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Paperclip className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40">{att.filename}</span>
                  <span className="text-[8px] text-white/15">{Math.round(att.size / 1024)}KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="border-t border-white/[0.06] pt-3">
          {message.htmlBody ? (
            <div>
              <button
                onClick={() => setShowHtml(!showHtml)}
                className="text-[9px] text-teal-400/50 hover:text-teal-400/80 transition-colors cursor-pointer mb-2"
              >
                {showHtml ? 'Show plain text' : 'Show HTML'}
              </button>
              {showHtml ? (
                <div
                  className="prose prose-invert prose-xs max-w-none text-[11px] text-white/50 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: message.htmlBody }}
                />
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap">
                  {message.textBody || message.snippet}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap">
              {message.textBody || message.snippet}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
