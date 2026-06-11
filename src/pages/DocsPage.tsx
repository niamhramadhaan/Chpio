import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Trash2, X } from 'lucide-react';
import { useDocsStore } from '../store/docsStore';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DocsPage() {
  const { docs, activeDocId, createDoc, updateDoc, deleteDoc, setActiveDoc, getActiveDoc } = useDocsStore();
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const activeDoc = getActiveDoc();

  const filtered = search
    ? docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs;

  const handleCreate = () => {
    const id = createDoc('Untitled');
    setActiveDoc(id);
    setShowList(false);
  };

  const handleSelect = (id: string) => {
    setActiveDoc(id);
    setShowList(false);
  };

  const handleContentChange = (value: string) => {
    if (!activeDocId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDoc(activeDocId, { content: value });
    }, 500);
  };

  const handleTitleChange = (value: string) => {
    if (!activeDocId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateDoc(activeDocId, { title: value });
    }, 500);
  };

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const wordCount = activeDoc ? activeDoc.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex h-full">
      <div
        className={`flex flex-col border-r border-white/5 ${showList ? 'w-full' : 'w-[30%] min-w-[140px]'} transition-all duration-200`}
      >
        <div className="p-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            {!showList && <span className="text-[10px] text-white/20">Docs</span>}
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-400/15 text-teal-400 text-[10px] hover:bg-teal-400/25 transition-colors cursor-pointer ml-auto"
            >
              <Plus className="w-3 h-3" />
              {!showList && 'New'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Search className="w-3 h-3 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-white text-[10px] flex-1 placeholder-white/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-[10px]">{search ? 'No matches' : 'No docs yet'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelect(doc.id)}
                  className={`group p-2 rounded-lg cursor-pointer transition-all ${
                    activeDocId === doc.id
                      ? 'bg-teal-400/10 border border-teal-400/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/70 truncate flex-1">{doc.title || 'Untitled'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                      className="p-0.5 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="text-[9px] text-white/20">{relativeTime(doc.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showList && activeDoc ? (
          <motion.div
            key={activeDoc.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-w-0"
          >
            <div className="px-4 pt-3 pb-2 shrink-0 flex items-center gap-2">
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
                className="bg-transparent text-white/80 text-xs font-medium outline-none flex-1"
                placeholder="Document title..."
              />
              <span className="text-[9px] text-white/15">{wordCount} words</span>
            </div>
            <div className="flex-1 px-4 pb-4 min-h-0">
              <textarea
                defaultValue={activeDoc.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing..."
                className="w-full h-full bg-[#0f1413]/60 text-white/80 font-mono text-xs p-4 rounded-xl border border-white/5 outline-none resize-none placeholder-white/20"
              />
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
    </div>
  );
}
