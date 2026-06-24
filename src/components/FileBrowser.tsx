import { useState, useMemo } from 'react';
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
import { relativeTime } from '../utils/relativeTime';

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
  emptyText?: string;
}

function getDateGroup(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'This Week';
  return 'Earlier';
}

function groupItemsByDate(items: BrowserItem[]): { label: string; items: BrowserItem[] }[] {
  const groups = new Map<string, BrowserItem[]>();
  for (const item of items) {
    const label = getDateGroup(item.updatedAt);
    const arr = groups.get(label);
    if (arr) arr.push(item);
    else groups.set(label, [item]);
  }
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  return order
    .filter((l) => groups.has(l))
    .map((l) => ({ label: l, items: groups.get(l)! }));
}

export function FileBrowser({
  items,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  emptyText = 'No items yet',
}: FileBrowserProps) {
  const [view, setView] = useState<'icons' | 'list'>('icons');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const grouped = useMemo(
    () => (search ? null : groupItemsByDate(filtered)),
    [filtered, search],
  );

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

  const handleDeleteStart = (id: string) => {
    setConfirmingDeleteId(id);
    setMenuOpen(null);
  };

  const handleDeleteConfirm = () => {
    if (confirmingDeleteId) {
      onDelete(confirmingDeleteId);
      setConfirmingDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmingDeleteId(null);
  };

  const renderGridCard = (item: BrowserItem) => (
    <ContextMenu
      key={item.id}
      items={[
        ...(onRename ? [{ icon: <Pencil className="w-3.5 h-3.5" />, label: 'Rename', onClick: () => handleRenameStart(item) }] : []),
        { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', onClick: () => handleDeleteStart(item.id), variant: 'danger' as const },
      ]}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => confirmingDeleteId === item.id ? undefined : onSelect(item.id)}
        className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
          confirmingDeleteId === item.id
            ? 'bg-red-400/10 border border-red-400/30'
            : activeId === item.id
              ? 'bg-teal-400/10 border border-teal-400/30'
              : 'bg-[#1A201F]/60 border border-white/5 hover:border-teal-400/20 hover:bg-white/5'
        }`}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative">
          {confirmingDeleteId === item.id ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-red-400 font-medium">Delete this item?</p>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                  className="flex-1 px-2 py-1 rounded-lg bg-red-400/20 text-red-400 text-[10px] hover:bg-red-400/30 transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCancel(); }}
                  className="flex-1 px-2 py-1 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 text-[10px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-1.5">
                {item.type === 'folder' ? (
                  <Folder className="w-4 h-4 text-teal-400/60" />
                ) : (
                  <FileText className="w-4 h-4 text-white/25" />
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
                        onClick={(e) => { e.stopPropagation(); handleDeleteStart(item.id); }}
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
                  className="bg-transparent text-white/80 text-[11px] outline-none border-b border-teal-400/30 w-full mb-1"
                />
              ) : (
                <p className="text-[11px] text-white/70 truncate mb-1">{item.name}</p>
              )}
              {item.preview && (
                <p className="text-[9px] text-white/25 line-clamp-2 leading-relaxed mb-1.5">{item.preview}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/15">{relativeTime(item.updatedAt)}</span>
                {item.wordCount !== undefined && item.wordCount > 0 && (
                  <span className="text-[9px] text-white/12">{item.wordCount}w</span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </ContextMenu>
  );

  const renderListItem = (item: BrowserItem) => (
    <ContextMenu
      key={item.id}
      items={[
        ...(onRename ? [{ icon: <Pencil className="w-3.5 h-3.5" />, label: 'Rename', onClick: () => handleRenameStart(item) }] : []),
        { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Delete', onClick: () => handleDeleteStart(item.id), variant: 'danger' as const },
      ]}
    >
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => confirmingDeleteId === item.id ? undefined : onSelect(item.id)}
        className={`group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
          confirmingDeleteId === item.id
            ? 'bg-red-400/10 border border-red-400/30'
            : activeId === item.id
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
          {confirmingDeleteId === item.id ? (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-red-400 font-medium flex-1">Delete?</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                className="px-2 py-0.5 rounded bg-red-400/20 text-red-400 text-[10px] hover:bg-red-400/30 transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCancel(); }}
                className="px-2 py-0.5 rounded text-white/40 hover:text-white/60 hover:bg-white/5 text-[10px] transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          ) : renamingId === item.id ? (
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
        {confirmingDeleteId !== item.id && item.wordCount !== undefined && (
          <span className="text-[9px] text-white/20 shrink-0">{item.wordCount}w</span>
        )}
        {confirmingDeleteId !== item.id && (
          <span className="text-[9px] text-white/20 shrink-0">{relativeTime(item.updatedAt)}</span>
        )}
        {confirmingDeleteId !== item.id && (
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
                  onClick={(e) => { e.stopPropagation(); handleDeleteStart(item.id); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-red-400 hover:bg-red-400/10 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </ContextMenu>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0 space-y-2">
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

      <div className="h-px bg-white/5 mx-3 shrink-0" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center rotate-[-6deg]">
                <FileText className="w-5 h-5 text-white/10" />
              </div>
              <div className="absolute -top-1 -right-1 w-10 h-10 rounded-xl bg-teal-400/[0.06] border border-teal-400/[0.1] flex items-center justify-center rotate-[4deg]">
                <FileText className="w-4 h-4 text-teal-400/20" />
              </div>
            </div>
            <p className="text-white/30 text-[11px] mb-3">{search ? 'No matches' : emptyText}</p>
            {!search && (
              <button
                onClick={onCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-400/10 text-teal-400/80 text-[10px] hover:bg-teal-400/20 hover:text-teal-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Create your first doc
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'icons' ? (
              grouped ? (
                <motion.div
                  key="grid-grouped"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-3"
                >
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <p className="text-[9px] text-white/20 uppercase tracking-wider px-0.5 mb-1.5">{group.label}</p>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                        <AnimatePresence>
                          {group.items.map(renderGridCard)}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2"
                >
                  <AnimatePresence>
                    {filtered.map(renderGridCard)}
                  </AnimatePresence>
                </motion.div>
              )
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-1"
              >
                <AnimatePresence>
                  {filtered.map(renderListItem)}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
