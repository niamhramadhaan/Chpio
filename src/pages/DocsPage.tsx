import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Eye,
  Edit3,
  Bold,
  Italic,
  Code,
  Heading2,
  List,
  Link,
  Quote,
  Table,
  Download,
  Clipboard,
  Check,
  FileText,
  Maximize2,
} from 'lucide-react';
import { useDocsStore } from '../store/docsStore';
import { FileBrowser, type BrowserItem } from '../components/FileBrowser';
import { DocEditorModal } from '../components/DocEditorModal';

export default function DocsPage() {
  const { docs, activeDocId, createDoc, updateDoc, deleteDoc, setActiveDoc, getActiveDoc } = useDocsStore();
  const [showList, setShowList] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = getActiveDoc();

  const browserItems: BrowserItem[] = docs.map((d) => ({
    id: d.id,
    name: d.title || 'Untitled',
    type: 'file' as const,
    updatedAt: d.updatedAt,
    wordCount: d.content.trim().split(/\s+/).filter(Boolean).length,
    preview: d.content.replace(/[#*_`~\[\]>|\\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || undefined,
  }));

  const handleCreate = useCallback(() => {
    const id = createDoc('Untitled');
    setActiveDoc(id);
    setShowList(false);
    setPreviewMode(false);
  }, [createDoc, setActiveDoc]);

  const handleSelect = useCallback((id: string) => {
    setActiveDoc(id);
    setShowList(false);
    setPreviewMode(false);
  }, [setActiveDoc]);

  const handleContentChange = useCallback((value: string) => {
    if (!activeDocId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDoc(activeDocId, { content: value });
    }, 500);
  }, [activeDocId, updateDoc]);

  const handleTitleChange = useCallback((value: string) => {
    if (!activeDocId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDoc(activeDocId, { title: value });
    }, 500);
  }, [activeDocId, updateDoc]);

  const handleRename = useCallback((id: string, name: string) => {
    updateDoc(id, { title: name });
  }, [updateDoc]);

  const insertFormatting = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || placeholder;
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    textarea.value = newText;
    handleContentChange(newText);
    const newCursorStart = start + prefix.length;
    const newCursorEnd = newCursorStart + selected.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  }, [handleContentChange]);

  const handleExportMd = useCallback(() => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title || 'untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDoc]);

  const handleCopy = useCallback(() => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeDoc]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const wordCount = activeDoc ? activeDoc.content.trim().split(/\s+/).filter(Boolean).length : 0;

  const toolbarBtn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex h-full">
      {/* File browser panel */}
      <div
        className={`flex flex-col border-r border-white/5 ${showList ? 'w-full' : 'w-[30%] min-w-[140px]'} transition-all duration-200`}
      >
        <FileBrowser
          items={browserItems}
          activeId={showList ? null : activeDocId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={deleteDoc}
          onRename={handleRename}
          emptyText="No docs yet"
        />
      </div>

      {/* Editor */}
      <AnimatePresence mode="wait">
        {!showList && activeDoc ? (
          <motion.div
            key={activeDoc.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-w-0"
          >
            {/* Header */}
            <div className="px-3 sm:px-4 pt-3 pb-2 shrink-0 flex items-center gap-2">
              <button
                onClick={() => setShowList(true)}
                className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                defaultValue={activeDoc.title}
                onBlur={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="bg-transparent text-white/80 text-xs font-medium outline-none flex-1 min-w-0"
                placeholder="Document title..."
              />
              <span className="text-[9px] text-white/15 shrink-0">{wordCount}w</span>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setExpandedDocId(activeDocId)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Expand editor"
                  aria-label="Expand editor"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    previewMode ? 'bg-teal-400/15 text-teal-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                  title={previewMode ? 'Edit' : 'Preview'}
                  aria-label={previewMode ? 'Edit' : 'Preview'}
                >
                  {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copy"
                  aria-label="Copy content"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleExportMd}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Export .md"
                  aria-label="Export as markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Formatting toolbar (hidden in preview mode) */}
            {!previewMode && (
              <div className="px-3 sm:px-4 pb-1 shrink-0 flex items-center gap-0.5 border-b border-white/5">
                {toolbarBtn(<Bold className="w-3.5 h-3.5" />, 'Bold', () => insertFormatting('**', '**', 'bold text'))}
                {toolbarBtn(<Italic className="w-3.5 h-3.5" />, 'Italic', () => insertFormatting('*', '*', 'italic text'))}
                {toolbarBtn(<Code className="w-3.5 h-3.5" />, 'Code', () => insertFormatting('`', '`', 'code'))}
                {toolbarBtn(<Heading2 className="w-3.5 h-3.5" />, 'Heading', () => insertFormatting('\n## ', '\n', 'Heading'))}
                {toolbarBtn(<List className="w-3.5 h-3.5" />, 'List', () => insertFormatting('\n- ', '\n', 'list item'))}
                {toolbarBtn(<Link className="w-3.5 h-3.5" />, 'Link', () => insertFormatting('[', '](url)', 'link text'))}
                {toolbarBtn(<Quote className="w-3.5 h-3.5" />, 'Quote', () => insertFormatting('\n> ', '\n', 'quote'))}
                {toolbarBtn(<Table className="w-3.5 h-3.5" />, 'Table', () => insertFormatting('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| ', ' | data | data |\n', 'data'))}
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 px-3 sm:px-4 pb-3 pt-2 min-h-0">
              {previewMode ? (
                <div className="w-full h-full overflow-y-auto bg-[#0f1413]/60 text-white/80 text-xs p-4 rounded-xl border border-white/5 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeDoc.content || '*No content*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  defaultValue={activeDoc.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing... (Markdown supported)"
                  className="w-full h-full bg-[#0f1413]/60 text-white/80 text-xs p-4 rounded-xl border border-white/5 outline-none resize-none placeholder-white/20 leading-relaxed"
                />
              )}
            </div>
          </motion.div>
        ) : !showList ? (
          <div className="flex-1 flex items-center justify-center text-white/20">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Select a document</p>
            </div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Full-screen editor modal */}
      {expandedDocId && (
        <DocEditorModal
          docId={expandedDocId}
          isOpen={!!expandedDocId}
          onClose={() => setExpandedDocId(null)}
        />
      )}
    </div>
  );
}
