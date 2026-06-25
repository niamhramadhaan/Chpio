import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, X, Check, CornerDownLeft } from 'lucide-react';
import { useNotesStore } from '../store/notesStore';

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { folders, createFolder, createNote, updateNote } = useNotesStore();

  // Cmd+Shift+Q to open (avoids browser Ctrl+Shift+N and Copilot conflicts)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setText('');
      setSaved(false);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [open]);

  const handleSave = () => {
    if (!text.trim()) return;

    // Find or create a "Quick Notes" folder
    let folderId = folders.find((f) => f.name === 'Quick Notes' && !f.archived)?.id;
    if (!folderId) {
      folderId = createFolder('Quick Notes');
    }

    const noteId = createNote(folderId);
    updateNote(noteId, {
      title: text.trim().slice(0, 60) + (text.trim().length > 60 ? '...' : ''),
      content: text.trim(),
    });

    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-start justify-center pt-[18vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#1A201F]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-white/70">Quick Capture</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jot something down..."
                rows={4}
                className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder-white/25 leading-relaxed"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
              <span className="text-[10px] text-white/15">Saves to Quick Notes</span>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/20 font-mono">
                  ⌘⇧Q
                </kbd>
                <span className="hidden sm:inline text-[9px] text-white/10">to open</span>
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/20 font-mono">
                  ⌘↵
                </kbd>
                <span className="hidden sm:inline text-[9px] text-white/10">to save</span>
                <button
                  onClick={handleSave}
                  disabled={!text.trim() || saved}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    saved
                      ? 'bg-emerald-400/15 text-emerald-400'
                      : text.trim()
                        ? 'bg-teal-400/15 text-teal-400 hover:bg-teal-400/25'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {saved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </>
                  ) : (
                    <>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
