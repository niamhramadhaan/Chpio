import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Folder,
  Grid3X3,
  List,
  Search,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  X,
} from 'lucide-react';
import { ContextMenu } from './ui/ContextMenu';

export interface BrowserItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  updatedAt: number;
  wordCount?: number;
  preview?: string;
}

interface FileBrowserProps {
  items: BrowserItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function FileBrowser({
  items,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  emptyIcon,
  emptyText = 'No items yet',
}: FileBrowserProps) {
  const [view, setView] = useState<'icons' | 'list'>('icons');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleRenameStart = (item: BrowserItem) => {
    setRenamingId(item.id);
    setRenameValue(item.name);
    setMenuOpen(null);
  };

  const handleRenameSave = () => {
    if (renamingId && renameValue.trim() && onRename) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('icons')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                view === 'icons' ? 'bg-teal-400/15 text-teal-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                view === 'list' ? 'bg-teal-400/15 text-teal-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-400/15 text-teal-400 text-[10px] hover:bg-teal-400/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            New
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
          {search && (
            <button onClick={() => setSearch('')} className="text-white/30 hover:text-white cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            {emptyIcon || <FileText className="w-8 h-8 mb-2" />}
            <p className="text-[10px]">{search ? 'No matches' : emptyText}</p>
          </div>
        ) : view === 'icons' ? (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence>
              {filtered.map((item) => (
                <ContextMenu
                  key={item.id}
                  items={[
                    ...(onRename ? [{ icon: <Pencil className="w-3.5 h-3.5" />, label: 'Rename', onClick: () => handleRenameStart(item) }] : []),
                    { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', onClick: () => onDelete(item.id), variant: 'danger' as const },
                  ]}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSelect(item.id)}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                      activeId === item.id
                        ? 'bg-teal-400/10 border border-teal-400/30'
                        : 'bg-[#1A201F]/60 border border-white/5 hover:border-teal-400/20 hover:bg-white/5'
                    }`}
                  >
                  <div className="flex items-start justify-between mb-2">
                    {item.type === 'folder' ? (
                      <Folder className="w-5 h-5 text-teal-400/60" />
                    ) : (
                      <FileText className="w-5 h-5 text-white/30" />
                    )}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === item.id ? null : item.id);
                        }}
                        className="p-1 rounded text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                      {menuOpen === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-[#1A201F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                          {onRename && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRenameStart(item); }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" /> Rename
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-red-400 hover:bg-red-400/10 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {renamingId === item.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameSave}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') setRenamingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-white/80 text-[11px] outline-none border-b border-teal-400/30 w-full"
                    />
                  ) : (
                    <p className="text-[11px] text-white/70 truncate">{item.name}</p>
                  )}
                  <p className="text-[9px] text-white/20 mt-1">{relativeTime(item.updatedAt)}</p>
                  </motion.div>
                </ContextMenu>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {filtered.map((item) => (
                <ContextMenu
                  key={item.id}
                  items={[
                    ...(onRename ? [{ icon: <Pencil className="w-3.5 h-3.5" />, label: 'Rename', onClick: () => handleRenameStart(item) }] : []),
                    { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', onClick: () => onDelete(item.id), variant: 'danger' as const },
                  ]}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelect(item.id)}
                    className={`group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                      activeId === item.id
                        ? 'bg-teal-400/10 border border-teal-400/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                  {item.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-teal-400/60 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-white/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {renamingId === item.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSave}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') setRenamingId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-white/80 text-[11px] outline-none border-b border-teal-400/30 w-full"
                      />
                    ) : (
                      <p className="text-[11px] text-white/70 truncate">{item.name}</p>
                    )}
                  </div>
                  {item.wordCount !== undefined && (
                    <span className="text-[9px] text-white/20 shrink-0">{item.wordCount}w</span>
                  )}
                  <span className="text-[9px] text-white/20 shrink-0">{relativeTime(item.updatedAt)}</span>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === item.id ? null : item.id);
                      }}
                      className="p-1 rounded text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                    {menuOpen === item.id && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-[#1A201F] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
                        {onRename && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRenameStart(item); }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" /> Rename
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-red-400 hover:bg-red-400/10 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  </motion.div>
                </ContextMenu>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
