import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Clipboard,
  Check,
  FileText,
  FileCode,
  File,
} from 'lucide-react';
import { useDocsStore } from '../store/docsStore';
import { TipTapEditor } from './editor/TipTapEditor';
import { PageCanvas } from './editor/PageCanvas';
import { exportToDocx, downloadHtml } from '../utils/docExport';

interface DocEditorModalProps {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocEditorModal({ docId, isOpen, onClose }: DocEditorModalProps) {
  const { docs, updateDoc } = useDocsStore();
  const doc = docs.find((d) => d.id === docId);

  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const hasUnsavedChanges = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (doc && isOpen) {
      setLocalContent(doc.content);
      setLocalTitle(doc.title);
      hasUnsavedChanges.current = false;
    }
  }, [doc, isOpen]);

  const saveToStore = useCallback(() => {
    if (!doc || !hasUnsavedChanges.current) return;
    updateDoc(doc.id, { content: localContent, title: localTitle });
    hasUnsavedChanges.current = false;
  }, [doc, localContent, localTitle, updateDoc]);

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    hasUnsavedChanges.current = true;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveToStore();
    }, 2000);
  }, [saveToStore]);

  const handleTitleChange = useCallback((value: string) => {
    setLocalTitle(value);
    hasUnsavedChanges.current = true;
  }, []);

  const handleClose = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    saveToStore();
    onClose();
  }, [saveToStore, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(localContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localContent]);

  const handleExportMarkdown = useCallback(() => {
    const blob = new Blob([localContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localTitle || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [localContent, localTitle]);

  const handleExportHtml = useCallback(() => {
    downloadHtml({ title: localTitle, content: localContent });
    setShowExportMenu(false);
  }, [localTitle, localContent]);

  const handleExportDocx = useCallback(async () => {
    setExporting(true);
    try {
      await exportToDocx({ title: localTitle, content: localContent });
    } catch (error) {
      console.error('Failed to export DOCX:', error);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }, [localTitle, localContent]);

  const wordCount = localContent.trim().split(/\s+/).filter(Boolean).length;

  if (!doc) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.4, 0, 0.2, 1]
            }}
            className="w-[80vw] h-[85vh] m-auto rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#1A201F]/60 backdrop-blur-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent text-white/90 text-base font-medium outline-none w-full placeholder-white/30"
                  placeholder="Untitled Document"
                />
              </div>
              <span className="text-xs text-white/25 shrink-0">{wordCount}w</span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all cursor-pointer"
                  title="Copy"
                  aria-label="Copy content"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Clipboard className="w-4 h-4" />}
                </button>

                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all cursor-pointer"
                    title="Export"
                    aria-label="Export document"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-1">
                          <button
                            onClick={handleExportMarkdown}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Markdown
                          </button>
                          <button
                            onClick={handleExportHtml}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            HTML
                          </button>
                          <button
                            onClick={handleExportDocx}
                            disabled={exporting}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          >
                            <File className="w-3.5 h-3.5" />
                            {exporting ? 'Exporting...' : 'Word (.docx)'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all cursor-pointer"
                  title="Close"
                  aria-label="Close editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtle separator */}
            <div className="h-px bg-white/5" />

            {/* Editor with Page Canvas */}
            <div className="flex-1 min-h-0 overflow-auto">
              <PageCanvas>
                <TipTapEditor
                  content={localContent}
                  onUpdate={handleContentChange}
                  placeholder="Start writing..."
                />
              </PageCanvas>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
