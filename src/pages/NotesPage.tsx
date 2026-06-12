import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen,
  FolderPlus,
  Plus,
  Trash2,
  X,
  Check,
  ChevronLeft,
  StickyNote,
  Pencil,
  Download,
  CheckSquare,
  Archive,
  Search,
  ChevronRight,
  Pin,
  Link2,
  Clipboard,
  FileText,
  Copy,
  FolderInput,
} from 'lucide-react';
import { useNotesStore } from '../store/notesStore';
import { PinItemBase } from '../components/ui/pin-item-base';
import type { Note, NoteFolder } from '../types';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Folder Card — Pocket Stack ── */
function FolderCard({
  folder,
  noteCount,
  previewNotes,
  isArchived,
  isRenaming,
  selectMode,
  selected,
  onOpen,
  onRename,
  onRenameSubmit,
  onRenameCancel,
  onArchive,
  onDelete,
  onToggleSelect,
}: {
  folder: { id: string; name: string; updatedAt: number };
  noteCount: number;
  previewNotes: { id: string; snippetText: string }[];
  isArchived: boolean;
  isRenaming: boolean;
  selectMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onRename: () => void;
  onRenameSubmit: (newName: string) => void;
  onRenameCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="relative group h-48"
    >
      {/* Layer 1+2 — paper sheets (or empty state) */}
      {noteCount > 0 ? (
        <>
          <div className={`absolute inset-x-2 top-3 bottom-0 -rotate-[4deg] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] rounded-xl transition-transform duration-300 group-hover:-translate-y-3 z-10 ${isArchived ? 'opacity-40' : ''}`}>
            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/[0.06] to-transparent rounded-bl-md" />
          </div>
          <div className={`absolute inset-x-1 top-2 bottom-0 rotate-[2deg] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-3 pt-2 transition-transform duration-300 group-hover:-translate-y-3 overflow-hidden z-20 ${isArchived ? 'opacity-40' : ''}`}>
            <p className="text-[8px] leading-relaxed text-white/15 font-mono line-clamp-4 select-none">
              {previewNotes[0]?.snippetText || ''}
            </p>
            <div className="absolute bottom-0 left-3 right-3 space-y-1.5 pb-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-px bg-white/[0.03]" />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={`absolute inset-x-2 top-3 bottom-0 -rotate-[4deg] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.04] rounded-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-gradient-to-br group-hover:from-white/[0.05] group-hover:to-white/[0.02] z-10 ${isArchived ? 'opacity-40' : ''}`}>
          <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-white/[0.05] to-transparent rounded-bl-md" />
          <div className="p-3 pt-4 space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px bg-white/[0.04] rounded-full" style={{ width: `${85 - i * 12}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Layer 3 — z-30 — frosted white glass pocket sleeve */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45%] rounded-b-2xl z-30 overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          className="absolute top-0 inset-x-3 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)' }}
        />
      </div>

      {/* Layer 4 — z-40 — foreground text overlay (on pocket) */}
      <div
        onClick={selectMode ? onToggleSelect : (isArchived ? undefined : onOpen)}
        className={`absolute inset-0 flex flex-col justify-end z-40 ${isArchived && !selectMode ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {selectMode && (
          <div className="absolute top-2 left-2 z-50">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selected ? 'bg-teal-400/20 border-teal-400/50' : 'border-white/20 bg-black/20'
            }`}>
              {selected && <Check className="w-3 h-3 text-teal-400" />}
            </div>
          </div>
        )}
        <div className="px-4 pb-3.5 pt-8">
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              defaultValue={folder.name}
              maxLength={40}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onBlur={(e) => onRenameSubmit(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-white text-sm font-semibold px-1 py-0.5 border-b border-white/30 outline-none focus:border-teal-400/50 w-full max-w-[90%] transition-colors"
            />
          ) : (
            <h3 className="font-semibold text-white text-sm leading-tight truncate drop-shadow-sm">
              {folder.name}
            </h3>
          )}
          <p className="text-[10px] text-white/50 mt-0.5 drop-shadow-sm">
            {isArchived ? `Archived ${relativeTime(folder.updatedAt)}` : `Edited ${relativeTime(folder.updatedAt)}`}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-white/40">
              {noteCount === 0 ? 'Empty' : `${noteCount} note${noteCount !== 1 ? 's' : ''}`}
            </span>
            {noteCount > 0 && (
              <span className="text-[10px] font-medium text-white/50 bg-white/10 border border-white/15 rounded-full px-2 py-0.5">
                {noteCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover actions — z-50 */}
      {!selectMode && (
        <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmAction ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); confirmAction === 'archive' ? onArchive() : onDelete(); setConfirmAction(null); }}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  confirmAction === 'delete'
                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                }`}
              >
                {confirmAction === 'delete' ? 'Delete' : 'Archive'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                className="px-2 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/50 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              {isArchived ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); }}
                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRename(); }}
                    className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmAction('archive'); }}
                    className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-white/5 transition-all cursor-pointer"
                    title="Archive"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ── Note Card ── */
function NoteCard({
  note,
  isArchived,
  selectMode,
  selected,
  onOpen,
  onArchive,
  onDelete,
  onToggleSelect,
}: {
  note: Note;
  isArchived: boolean;
  selectMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const done = note.tasks.filter((t) => t.done).length;
  const total = note.tasks.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="group relative"
    >
      <div
        onClick={selectMode ? onToggleSelect : onOpen}
        className={`backdrop-blur-sm border rounded-xl p-3 transition-all duration-200 cursor-pointer h-full ${
          selected
            ? 'border-teal-400/40 bg-teal-400/5'
            : isArchived
              ? 'border-white/5 opacity-60 hover:opacity-80 bg-white/[0.03]'
              : 'border-white/[0.08] hover:border-white/15 hover:shadow-md hover:shadow-black/10 bg-white/[0.04]'
        }`}
      >
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selected ? 'bg-teal-400/20 border-teal-400/50' : 'border-white/20 bg-black/20'
            }`}>
              {selected && <Check className="w-3 h-3 text-teal-400" />}
            </div>
          </div>
        )}
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-[11px] text-white/70 font-medium truncate flex-1">
            {note.title || 'Untitled'}
          </span>
        </div>
        {note.content && (
          <p className="text-[10px] text-white/25 mb-2 leading-relaxed line-clamp-2">{note.content}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/15">
            {isArchived ? `Archived ${relativeTime(note.updatedAt)}` : relativeTime(note.updatedAt)}
          </span>
          {total > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400/60 rounded-full transition-all"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-teal-400/40">{done}/{total}</span>
            </div>
          )}
        </div>

        {confirmAction && (
          <div className="absolute inset-0 bg-[#1A201F]/95 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); confirmAction === 'archive' ? onArchive() : onDelete(); setConfirmAction(null); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                confirmAction === 'delete'
                  ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                  : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              }`}
            >
              {confirmAction === 'delete' ? 'Delete' : 'Archive'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
              className="px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/50 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!selectMode && !confirmAction && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {isArchived ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); }}
              className="p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmAction('archive'); }}
              className="p-1 rounded-lg text-white/15 hover:text-amber-400 hover:bg-white/5 transition-all cursor-pointer"
              title="Archive"
            >
              <Archive className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ── Bottom Toolbar ── */
function BottomToolbar({
  view,
  showArchived,
  searchOpen,
  searchQuery,
  selectMode,
  selectedCount,
  showAllLinks,
  pinnedNotes,
  allLinks,
  folders,
  onSearchToggle,
  onSearchChange,
  onNewFolder,
  onNewNote,
  onShowArchived,
  onHideArchived,
  onOpenPinnedNote,
  onSelectToggle,
  onBulkDelete,
  onBulkArchive,
  onClearSelect,
  onAdvancedSearch,
  onLinksToggle,
  onUnpin,
}: {
  view: 'folders' | 'folder' | 'note';
  showArchived: boolean;
  searchOpen: boolean;
  searchQuery: string;
  selectMode: boolean;
  selectedCount: number;
  showAllLinks: boolean;
  pinnedNotes: Note[];
  allLinks: { noteId: string; noteTitle: string; url: string }[];
  folders: NoteFolder[];
  onSearchToggle: () => void;
  onSearchChange: (q: string) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onShowArchived: () => void;
  onHideArchived: () => void;
  onOpenPinnedNote: (noteId: string, folderId: string) => void;
  onSelectToggle: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onClearSelect: () => void;
  onAdvancedSearch: () => void;
  onLinksToggle: () => void;
  onUnpin: (noteId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showPinned, setShowPinned] = useState(false);

  const primaryActions = [
    { icon: FolderPlus, label: 'Folder', onClick: onNewFolder, show: view === 'folders', disabled: showArchived },
    { icon: StickyNote, label: 'Note', onClick: onNewNote, show: view === 'folder', disabled: false },
  ].filter((a) => a.show);

  return (
    <div className="shrink-0 mx-3 mb-3 relative">
      <div
        ref={scrollRef}
        onWheel={(e) => {
          if (scrollRef.current && e.deltaY !== 0) {
            e.preventDefault();
            scrollRef.current.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-none"
      >
        {/* Select mode: bulk action chips */}
        {selectMode ? (
          <>
            <button
              onClick={onClearSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-medium text-white/50">Cancel</span>
            </button>
            {showArchived ? (
              <button
                onClick={selectedCount > 0 ? onBulkDelete : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  selectedCount > 0
                    ? 'bg-red-400/15 border border-red-400/25 text-red-400 cursor-pointer'
                    : 'bg-white/[0.03] border border-white/[0.03] opacity-30 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Delete ({selectedCount})</span>
              </button>
            ) : (
              <button
                onClick={selectedCount > 0 ? onBulkArchive : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  selectedCount > 0
                    ? 'bg-amber-400/15 border border-amber-400/25 text-amber-400 cursor-pointer'
                    : 'bg-white/[0.03] border border-white/[0.03] opacity-30 cursor-not-allowed'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Archive ({selectedCount})</span>
              </button>
            )}
          </>
        ) : (
          <>
            {/* Search chip */}
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  key="search-input"
                  layout
                  initial={{ width: 32, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: 32, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 overflow-hidden flex-1 min-w-0"
                >
                  <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    autoFocus
                    className="bg-transparent text-white text-[11px] outline-none flex-1 min-w-0 placeholder-white/20"
                  />
                  <button
                    onClick={onSearchToggle}
                    className="p-0.5 rounded-full text-white/30 hover:text-white/60 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={onSearchToggle}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-white/40" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Primary action chips */}
            <AnimatePresence>
              {!searchOpen && primaryActions.map((action) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={action.disabled ? undefined : action.onClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shrink-0 ${
                    action.disabled
                      ? 'bg-white/[0.03] border border-white/[0.03] cursor-not-allowed opacity-30'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer'
                  }`}
                >
                  <action.icon className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-[10px] font-medium text-white/50">{action.label}</span>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Additional chips — inline */}
            {!searchOpen && (
              <>
                <button
                  onClick={onSelectToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    selectMode
                      ? 'bg-teal-400/15 border border-teal-400/25'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <CheckSquare className={`w-3.5 h-3.5 ${selectMode ? 'text-teal-400' : 'text-white/40'}`} />
                  <span className={`text-[10px] font-medium ${selectMode ? 'text-teal-400' : 'text-white/50'}`}>Select</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-[10px] font-medium text-white/50">Import</span>
                </button>

                {/* Pin chip + popover */}
                <button
                  onClick={() => setShowPinned(!showPinned)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    showPinned
                      ? 'bg-teal-400/15 border border-teal-400/25'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${showPinned ? 'text-teal-400' : 'text-white/40'}`} />
                  <span className={`text-[10px] font-medium ${showPinned ? 'text-teal-400' : 'text-white/50'}`}>Pinned</span>
                  {pinnedNotes.length > 0 && (
                    <span className={`text-[9px] ${showPinned ? 'text-teal-400/60' : 'text-white/30'}`}>{pinnedNotes.length}</span>
                  )}
                </button>

                {/* Links chip */}
                <button
                  onClick={onLinksToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    showAllLinks
                      ? 'bg-teal-400/15 border border-teal-400/25'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Link2 className={`w-3.5 h-3.5 ${showAllLinks ? 'text-teal-400' : 'text-white/40'}`} />
                  <span className={`text-[10px] font-medium ${showAllLinks ? 'text-teal-400' : 'text-white/50'}`}>Links</span>
                  {allLinks.length > 0 && (
                    <span className={`text-[9px] ${showAllLinks ? 'text-teal-400/60' : 'text-white/30'}`}>{allLinks.length}</span>
                  )}
                </button>

                {/* Advanced search chip */}
                <button
                  onClick={onAdvancedSearch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-[10px] font-medium text-white/50">Search All</span>
                </button>

                {/* Archived chip — most right */}
                <button
                  onClick={() => showArchived ? onHideArchived() : onShowArchived()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    showArchived
                      ? 'bg-teal-400/15 border border-teal-400/25'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Archive className={`w-3.5 h-3.5 ${showArchived ? 'text-teal-400' : 'text-white/40'}`} />
                  <span className={`text-[10px] font-medium ${showArchived ? 'text-teal-400' : 'text-white/50'}`}>Archived</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Pinned popover — outside scroll container to avoid clipping */}
      <AnimatePresence>
        {showPinned && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPinned(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
            >
              <p className="pb-2 text-[10px] text-white/30 font-medium">Pinned Notes</p>
              <div className="max-h-60 overflow-y-auto">
                <PinItemBase
                  notes={pinnedNotes}
                  folders={folders}
                  onSelect={(noteId, folderId) => {
                    onOpenPinnedNote(noteId, folderId);
                    setShowPinned(false);
                  }}
                  onUnpin={(noteId) => onUnpin(noteId)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main NotesPage ── */
export default function NotesPage() {
  const folders: NoteFolder[] = useNotesStore((s) => s.folders);
  const notes: Note[] = useNotesStore((s) => s.notes);
  const activeFolderId: string | null = useNotesStore((s) => s.activeFolderId);
  const activeNoteId: string | null = useNotesStore((s) => s.activeNoteId);
  const showArchived: boolean = useNotesStore((s) => s.showArchived);
  const createFolder = useNotesStore((s) => s.createFolder);
  const updateFolder = useNotesStore((s) => s.updateFolder);
  const deleteFolder = useNotesStore((s) => s.deleteFolder);
  const archiveFolder = useNotesStore((s) => s.archiveFolder);
  const setActiveFolder = useNotesStore((s) => s.setActiveFolder);
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const addTask = useNotesStore((s) => s.addTask);
  const toggleTask = useNotesStore((s) => s.toggleTask);
  const removeTask = useNotesStore((s) => s.removeTask);
  const setShowArchived = useNotesStore((s) => s.setShowArchived);
  const togglePin = useNotesStore((s) => s.togglePin);
  const duplicateNote = useNotesStore((s) => s.duplicateNote);
  const moveNote = useNotesStore((s) => s.moveNote);
  const addLink = useNotesStore((s) => s.addLink);
  const removeLink = useNotesStore((s) => s.removeLink);
  const getPinnedNotes = useNotesStore((s) => s.getPinnedNotes);
  const getFolderNotes = useNotesStore((s) => s.getFolderNotes);
  const getArchivedNotes = useNotesStore((s) => s.getArchivedNotes);
  const getArchivedFolders = useNotesStore((s) => s.getArchivedFolders);
  const getNoteCount = useNotesStore((s) => s.getNoteCount);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkConfirming, setLinkConfirming] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const folderNotes = activeFolderId ? getFolderNotes(activeFolderId) : [];
  const archivedFolders = getArchivedFolders();
  const archivedNotes = getArchivedNotes();

  const allLinks = useMemo(() => {
    const result: { noteId: string; noteTitle: string; url: string }[] = [];
    for (const note of notes) {
      if (note.archived) continue;
      for (const link of note.links || []) {
        result.push({ noteId: note.id, noteTitle: note.title || 'Untitled', url: link.url });
      }
    }
    return result;
  }, [notes]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleRenameFolder = (id: string, newName: string) => {
    if (!newName.trim()) { setRenamingFolderId(null); return; }
    updateFolder(id, { name: newName.trim() });
    setRenamingFolderId(null);
  };

  const handleAddTask = () => {
    if (!taskInput.trim() || !activeNoteId) return;
    addTask(activeNoteId, taskInput.trim());
    setTaskInput('');
    taskInputRef.current?.focus();
  };

  const handleNewFolder = () => {
    setShowNewFolder(true);
    setTimeout(() => newFolderRef.current?.focus(), 50);
  };

  const handleNewNote = () => {
    if (activeFolderId) createNote(activeFolderId);
  };

  const handleAddLink = () => {
    if (!linkInput.trim() || !activeNoteId) return;
    let url = linkInput.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    addLink(activeNoteId, url);
    setLinkInput('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        document.execCommand('insertText', false, text);
      } else if (activeNoteId) {
        updateNote(activeNoteId, { content: (activeNote?.content || '') + '\n' + text });
      }
    } catch {
      // clipboard API not available
    }
  };

  const handlePasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLinkInput(text.trim());
        setLinkConfirming(true);
      }
    } catch {
      // clipboard API not available
    }
  };

  const buildExportContent = (note: Note, asMd: boolean) => {
    const lines: string[] = [];
    if (note.title) {
      lines.push(asMd ? `# ${note.title}` : note.title);
      lines.push('');
    }
    if (note.content) {
      lines.push(note.content);
      lines.push('');
    }
    if (note.tasks.length > 0) {
      if (asMd) {
        lines.push('## Tasks');
        note.tasks.forEach((t) => {
          lines.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
        });
      } else {
        lines.push('Tasks:');
        note.tasks.forEach((t) => {
          lines.push(`${t.done ? '[x]' : '[ ]'} ${t.text}`);
        });
      }
      lines.push('');
    }
    if (note.links && note.links.length > 0) {
      if (asMd) {
        lines.push('## Links');
        note.links.forEach((l) => {
          lines.push(`- [${l.url}](${l.url})`);
        });
      } else {
        lines.push('Links:');
        note.links.forEach((l) => {
          lines.push(l.url);
        });
      }
    }
    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    if (!activeNote) return;
    const content = buildExportContent(activeNote, false);
    const name = (activeNote.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(content, `${name}.txt`);
  };

  const handleExportMd = () => {
    if (!activeNote) return;
    const content = buildExportContent(activeNote, true);
    const name = (activeNote.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(content, `${name}.md`);
  };

  const handleDuplicate = () => {
    if (!activeNote) return;
    duplicateNote(activeNote.id);
  };

  const checkActionBarScroll = () => {
    const el = actionBarRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  const scrollActionBar = (direction: 'left' | 'right') => {
    const el = actionBarRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' });
  };

  const view: 'folders' | 'folder' | 'note' = activeNoteId ? 'note' : activeFolderId ? 'folder' : 'folders';

  const doneCount = activeNote?.tasks.filter((t) => t.done).length ?? 0;
  const totalCount = activeNote?.tasks.length ?? 0;

  useEffect(() => {
    if (activeNote) {
      requestAnimationFrame(() => checkActionBarScroll());
    }
  }, [activeNote?.id]);

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    selectedIds.forEach((id) => {
      if (notes.find((n) => n.id === id)) deleteNote(id);
      else deleteFolder(id);
    });
    clearSelectMode();
  };

  const bulkArchive = () => {
    selectedIds.forEach((id) => {
      if (notes.find((n) => n.id === id)) archiveNote(id);
      else archiveFolder(id);
    });
    clearSelectMode();
  };

  const filteredFolders = showArchived
    ? archivedFolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders.filter((f) => !f.archived && f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredNotes = showArchived
    ? archivedNotes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeFolderId
      ? folderNotes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
      : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          {(view !== 'folders' || showArchived) && (
            <button
              onClick={() => {
                if (showArchived) { setShowArchived(false); setSearchQuery(''); }
                else if (activeNoteId) setActiveNote(null);
                else setActiveFolder(null);
              }}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => {
                if (showArchived) { setShowArchived(false); setSearchQuery(''); }
                else { setActiveFolder(null); setActiveNote(null); }
              }}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                view === 'folders' && !showArchived
                  ? 'text-white/60'
                  : 'text-white/30 hover:text-white/50 cursor-pointer'
              }`}
            >
              {showArchived ? 'Archived' : 'Notes'}
            </button>

            {activeFolder && !showArchived && (
              <>
                <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                <button
                  onClick={() => setActiveNote(null)}
                  className={`text-sm font-medium truncate transition-colors ${
                    !activeNote ? 'text-white/60' : 'text-white/30 hover:text-white/50 cursor-pointer'
                  }`}
                >
                  {activeFolder.name}
                </button>
              </>
            )}

            {activeNote && !showArchived && (
              <>
                <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                <span className="text-sm font-medium text-white/60 truncate">
                  {activeNote.title || 'Untitled'}
                </span>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showNewFolder && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mt-3"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={newFolderRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  maxLength={40}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolder(false);
                  }}
                  placeholder="Folder name..."
                  className="flex-1 bg-transparent text-white text-xs px-3 py-2 border-b border-white/20 outline-none focus:border-teal-400/40 placeholder-white/20 transition-colors"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-teal-400/20 text-teal-400 hover:bg-teal-400/30 border border-teal-400/30 transition-colors cursor-pointer disabled:opacity-30"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                  className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px bg-white/5 mx-4 shrink-0" />

      {/* Content area */}
      <AnimatePresence mode="wait">
        {activeNote ? (
          /* ── Note Editor ── */
          <motion.div
            key={activeNote.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 flex flex-col min-h-0 px-4 pb-2"
          >
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
              maxLength={60}
              placeholder="Note title..."
              className="bg-transparent text-white/80 text-sm font-medium outline-none mb-2 border-b border-transparent focus:border-white/20 transition-colors w-full"
            />

            {/* Action bar */}
            <div className="relative flex items-center mb-3">
              <div
                ref={actionBarRef}
                onScroll={checkActionBarScroll}
                onWheel={(e) => {
                  if (actionBarRef.current && e.deltaY !== 0) {
                    e.preventDefault();
                    actionBarRef.current.scrollLeft += e.deltaY;
                    checkActionBarScroll();
                  }
                }}
                className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none"
              >
                <button
                  onClick={() => togglePin(activeNote.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shrink-0 ${
                    activeNote.pinned
                      ? 'text-teal-400 bg-teal-400/10'
                      : 'text-white/25 hover:text-teal-400 hover:bg-white/5'
                  }`}
                >
                  <Pin className="w-3 h-3" />
                  <span>{activeNote.pinned ? 'Pinned' : 'Pin'}</span>
                </button>
                <button
                  onClick={() => setTasksExpanded(!tasksExpanded)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>List</span>
                  {totalCount > 0 && (
                    <span className="text-white/20">{doneCount}/{totalCount}</span>
                  )}
                </button>
                <button
                  onClick={() => setLinksExpanded(!linksExpanded)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                >
                  <Link2 className="w-3 h-3" />
                  <span>Links</span>
                  {(activeNote.links?.length ?? 0) > 0 && (
                    <span className="text-white/20">{activeNote.links!.length}</span>
                  )}
                </button>
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste</span>
                </button>
                <div className="w-px h-3 bg-white/10 mx-0.5 shrink-0" />
                <button
                  onClick={handleExportTxt}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                  title="Export as .txt"
                >
                  <FileText className="w-3 h-3" />
                  <span>.txt</span>
                </button>
                <button
                  onClick={handleExportMd}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                  title="Export as .md"
                >
                  <FileText className="w-3 h-3" />
                  <span>.md</span>
                </button>
                <div className="w-px h-3 bg-white/10 mx-0.5 shrink-0" />
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer shrink-0"
                  title="Duplicate note"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate</span>
                </button>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowMoveFolder(!showMoveFolder)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer"
                    title="Move to folder"
                  >
                    <FolderInput className="w-3 h-3" />
                    <span>Move</span>
                  </button>
                  <AnimatePresence>
                    {showMoveFolder && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMoveFolder(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 w-44 py-1.5 rounded-xl bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
                        >
                          <p className="px-3 pb-1 text-[9px] text-white/30 font-medium">Move to folder</p>
                          {folders.filter((f) => !f.archived).map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => {
                                moveNote(activeNote.id, folder.id);
                                setShowMoveFolder(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors cursor-pointer ${
                                folder.id === activeNote.folderId
                                  ? 'text-teal-400 bg-teal-400/10'
                                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                              }`}
                            >
                              {folder.name}
                              {folder.id === activeNote.folderId && (
                                <span className="ml-1 text-[9px] text-teal-400/60">(current)</span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fixed right side: scroll arrows */}
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <div className="flex items-center">
                  <button
                    onClick={() => scrollActionBar('left')}
                    className={`flex items-center justify-center w-5 h-5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer ${
                      canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => scrollActionBar('right')}
                    className={`flex items-center justify-center w-5 h-5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer ${
                      canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content textarea — fills available space */}
            <div className="relative flex-1 min-h-0 mb-2">
              <textarea
                ref={textareaRef}
                value={activeNote.content}
                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                placeholder="Write something..."
                className="w-full h-full bg-white/[0.03] text-white/80 text-xs p-3 rounded-xl border border-white/[0.06] outline-none resize-none placeholder-white/20"
              />
            </div>

            {/* Collapsible tasks section */}
            <AnimatePresence>
              {tasksExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden"
                >
                  {totalCount > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${(doneCount / totalCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/30">{doneCount}/{totalCount}</span>
                    </div>
                  )}

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {activeNote.tasks.map((task) => (
                      <div key={task.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                        <button
                          onClick={() => toggleTask(activeNote.id, task.id)}
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            task.done ? 'bg-teal-400 border-teal-400' : 'border-white/20 hover:border-teal-400/50'
                          }`}
                        >
                          {task.done && <Check className="w-2.5 h-2.5 text-black" />}
                        </button>
                        <span className={`text-xs flex-1 transition-all ${task.done ? 'text-white/30 line-through' : 'text-white/70'}`}>
                          {task.text}
                        </span>
                        <button
                          onClick={() => removeTask(activeNote.id, task.id)}
                          className="p-0.5 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5">
                      <input
                        ref={taskInputRef}
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
                        placeholder="Add a task..."
                        className="bg-transparent text-white text-xs outline-none flex-1 placeholder-white/30"
                      />
                      <button
                        onClick={handleAddTask}
                        disabled={!taskInput.trim()}
                        className="text-teal-400/50 hover:text-teal-400 transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsible links section */}
            <AnimatePresence>
              {linksExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                    {(activeNote.links || []).length === 0 ? (
                      <p className="text-[10px] text-white/20 py-2 text-center">No links yet</p>
                    ) : (
                      (activeNote.links || []).map((link) => (
                        <div key={link.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Link2 className="w-3 h-3 text-white/20 shrink-0" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-400/80 hover:text-teal-400 hover:underline truncate flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {link.url}
                          </a>
                          <button
                            onClick={() => removeLink(activeNote.id, link.id)}
                            className="p-0.5 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5">
                    <input
                      type="url"
                      value={linkInput}
                      onChange={(e) => { setLinkInput(e.target.value); setLinkConfirming(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleAddLink(); setLinkConfirming(false); } }}
                      placeholder="Add a link..."
                      className="bg-transparent text-white text-xs outline-none flex-1 placeholder-white/30"
                    />
                    {linkInput.trim() ? (
                      <div className="flex items-center gap-1">
                        {linkConfirming && (
                          <button
                            onClick={() => { handleAddLink(); setLinkConfirming(false); }}
                            className="text-teal-400/60 hover:text-teal-400 transition-colors cursor-pointer"
                            title="Add link"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setLinkInput(''); setLinkConfirming(false); }}
                          className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handlePasteLink}
                        className="text-white/30 hover:text-teal-400 transition-colors cursor-pointer"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : showAllLinks ? (
          /* ── All Links List ── */
          <motion.div
            key="all-links"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto px-4 pt-2 pb-2"
          >
            {allLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Link2 className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">No links saved yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {allLinks.map((item, i) => {
                  const folder = folders.find((f) => f.id === notes.find((n) => n.id === item.noteId)?.folderId);
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <Link2 className="w-3.5 h-3.5 text-white/20 group-hover:text-teal-400/50 shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-teal-400/80 group-hover:text-teal-400 truncate transition-colors">{item.url}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-white/30 truncate">{item.noteTitle}</span>
                          {folder && (
                            <>
                              <span className="text-[10px] text-white/10">·</span>
                              <span className="text-[10px] text-white/20 truncate">{folder.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : activeFolderId && !showArchived ? (
          /* ── Folder Notes Grid ── */
          <motion.div
            key={`folder-${activeFolderId}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto px-4 pt-2 pb-2"
          >
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <StickyNote className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">{searchQuery ? 'No matches' : 'No notes yet'}</p>
                {!searchQuery && <p className="text-[10px] mt-1 text-white/10">Add from toolbar below</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isArchived={note.archived}
                      selectMode={selectMode}
                      selected={selectedIds.has(note.id)}
                      onOpen={() => { setActiveNote(note.id); setShowAllLinks(false); }}
                      onArchive={() => archiveNote(note.id)}
                      onDelete={() => deleteNote(note.id)}
                      onToggleSelect={() => toggleSelectItem(note.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : showArchived ? (
          /* ── Unified Archived Grid (folders + notes) ── */
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2">
            {filteredFolders.length === 0 && filteredNotes.length === 0 && !showNewFolder ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Archive className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">{searchQuery ? 'No matches' : 'Nothing archived'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFolders.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 font-medium mb-2 px-1">Folders</p>
                    <div className="grid grid-cols-2 gap-3">
                      <AnimatePresence>
                        {filteredFolders.map((folder) => {
                          const fNotes = getFolderNotes(folder.id);
                          const previewNotes = fNotes.slice(0, 2).map((n) => ({
                            id: n.id,
                            snippetText: n.content.replace(/\n/g, ' ').slice(0, 120) || n.title,
                          }));
                          return (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              noteCount={notes.filter((n) => n.folderId === folder.id && n.archived).length}
                              previewNotes={previewNotes}
                              isArchived
                              isRenaming={false}
                              selectMode={selectMode}
                              selected={selectedIds.has(folder.id)}
                              onOpen={() => {}}
                              onRename={() => {}}
                              onRenameSubmit={() => {}}
                              onRenameCancel={() => {}}
                              onArchive={() => {}}
                              onDelete={() => deleteFolder(folder.id)}
                              onToggleSelect={() => toggleSelectItem(folder.id)}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                {filteredNotes.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/20 font-medium mb-2 px-1">Notes</p>
                    <div className="grid grid-cols-2 gap-2">
                      <AnimatePresence>
                        {filteredNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            isArchived
                            selectMode={selectMode}
                            selected={selectedIds.has(note.id)}
                            onOpen={() => {}}
                            onArchive={() => {}}
                            onDelete={() => deleteNote(note.id)}
                            onToggleSelect={() => toggleSelectItem(note.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Folder Grid ── */
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2">
            {filteredFolders.length === 0 && !showNewFolder ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <FolderOpen className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">{showArchived ? 'No archived folders' : searchQuery ? 'No matches' : 'No folders yet'}</p>
                {!showArchived && !searchQuery && <p className="text-[10px] mt-1 text-white/10">Create one from toolbar below</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filteredFolders.map((folder) => {
                    const fNotes = getFolderNotes(folder.id);
                    const previewNotes = fNotes.slice(0, 2).map((n) => ({
                      id: n.id,
                      snippetText: n.content.replace(/\n/g, ' ').slice(0, 120) || n.title,
                    }));
                    return (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        noteCount={showArchived ? notes.filter((n) => n.folderId === folder.id && n.archived).length : getNoteCount(folder.id)}
                        previewNotes={previewNotes}
                        isArchived={showArchived}
                        isRenaming={renamingFolderId === folder.id}
                        selectMode={selectMode}
                        selected={selectedIds.has(folder.id)}
                        onOpen={() => { setActiveFolder(folder.id); setShowAllLinks(false); }}
                        onRename={() => setRenamingFolderId(folder.id)}
                        onRenameSubmit={(newName) => handleRenameFolder(folder.id, newName)}
                        onRenameCancel={() => setRenamingFolderId(null)}
                        onArchive={() => archiveFolder(folder.id)}
                        onDelete={() => deleteFolder(folder.id)}
                        onToggleSelect={() => toggleSelectItem(folder.id)}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Toolbar */}
      {!activeNote && (
        <BottomToolbar
          view={view}
          showArchived={showArchived}
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          selectMode={selectMode}
          selectedCount={selectedIds.size}
          showAllLinks={showAllLinks}
          pinnedNotes={getPinnedNotes()}
          allLinks={allLinks}
          folders={folders}
          onSearchToggle={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
          onSearchChange={setSearchQuery}
          onNewFolder={handleNewFolder}
          onNewNote={handleNewNote}
          onShowArchived={() => { setShowArchived(true); setSearchQuery(''); setActiveFolder(null); setActiveNote(null); clearSelectMode(); setShowAllLinks(false); }}
          onHideArchived={() => { setShowArchived(false); setSearchQuery(''); clearSelectMode(); }}
          onOpenPinnedNote={(noteId, folderId) => { setActiveFolder(folderId); setActiveNote(noteId); setShowAllLinks(false); }}
          onSelectToggle={() => { if (selectMode) clearSelectMode(); else setSelectMode(true); }}
          onBulkDelete={bulkDelete}
          onBulkArchive={bulkArchive}
          onClearSelect={clearSelectMode}
          onAdvancedSearch={() => setAdvancedSearchOpen(true)}
          onLinksToggle={() => { setShowAllLinks(!showAllLinks); if (!showAllLinks) { setActiveFolder(null); setActiveNote(null); setShowArchived(false); } }}
          onUnpin={(noteId) => togglePin(noteId)}
        />
      )}

      {/* Advanced Search Modal */}
      {advancedSearchOpen && (
        <NotesAdvancedSearchModal
          notes={notes}
          folders={folders}
          sessions={[]}
          onClose={() => setAdvancedSearchOpen(false)}
          onOpenNote={(noteId, folderId) => { setActiveFolder(folderId); setActiveNote(noteId); setAdvancedSearchOpen(false); }}
        />
      )}

    </div>
  );
}

type SearchFilter = 'all' | 'chats' | 'docs' | 'links' | 'tasks';

function NotesAdvancedSearchModal({
  notes,
  folders,
  sessions,
  onClose,
  onOpenNote,
}: {
  notes: Note[];
  folders: NoteFolder[];
  sessions: { id: string; title: string; messages: { role: string; content: string }[]; archived: boolean }[];
  onClose: () => void;
  onOpenNote: (noteId: string, folderId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');

  const filters: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'docs', label: 'Docs' },
    { id: 'links', label: 'Links' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'chats', label: 'Chats' },
  ];

  const q = query.toLowerCase().trim();

  const noteResults = useMemo(() => {
    if (q.length < 2) return [];
    return notes.filter((n) => {
      if (n.archived) return false;
      if (filter === 'links') return (n.links || []).some((l) => l.url.toLowerCase().includes(q));
      if (filter === 'tasks') return n.tasks.some((t) => t.text.toLowerCase().includes(q));
      if (filter === 'chats') return false;
      if (n.title.toLowerCase().includes(q)) return true;
      if (n.content.toLowerCase().includes(q)) return true;
      if ((n.links || []).some((l) => l.url.toLowerCase().includes(q))) return true;
      if (n.tasks.some((t) => t.text.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [notes, q, filter]);

  const chatResults = useMemo(() => {
    if (q.length < 2 || filter === 'docs' || filter === 'links' || filter === 'tasks') return [];
    return sessions.filter((s) => {
      if (s.archived) return false;
      if (s.title.toLowerCase().includes(q)) return true;
      return s.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [sessions, q, filter]);

  const getNoteSnippet = (note: Note) => {
    if (note.title.toLowerCase().includes(q)) return null;
    const contentIdx = note.content.toLowerCase().indexOf(q);
    if (contentIdx !== -1) {
      const start = Math.max(0, contentIdx - 40);
      const end = Math.min(note.content.length, contentIdx + q.length + 40);
      return (start > 0 ? '...' : '') + note.content.slice(start, end) + (end < note.content.length ? '...' : '');
    }
    const task = note.tasks.find((t) => t.text.toLowerCase().includes(q));
    if (task) return task.text;
    const link = (note.links || []).find((l) => l.url.toLowerCase().includes(q));
    if (link) return link.url;
    return null;
  };

  const totalResults = noteResults.length + chatResults.length;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-[#1A201F]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[60vh] pointer-events-auto"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/30 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, links, tasks..."
            autoFocus
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-white/25"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                filter === f.id
                  ? 'bg-teal-400/15 text-teal-400 border border-teal-400/25'
                  : 'text-white/40 hover:text-white/60 bg-white/5 border border-white/5 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {q.length < 2 ? (
            <p className="px-5 py-8 text-sm text-white/20 text-center">Type at least 2 characters to search</p>
          ) : totalResults === 0 ? (
            <p className="px-5 py-8 text-sm text-white/20 text-center">No results found</p>
          ) : (
            <div className="py-1">
              {noteResults.map((note) => {
                const folder = folders.find((f) => f.id === note.folderId);
                const snippet = getNoteSnippet(note);
                return (
                  <button
                    key={note.id}
                    onClick={() => onOpenNote(note.id, note.folderId)}
                    className="w-full flex flex-col gap-1 px-5 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-white/80 truncate flex-1">{note.title || 'Untitled'}</span>
                      {folder && (
                        <span className="text-[10px] text-white/20 shrink-0">{folder.name}</span>
                      )}
                    </div>
                    {snippet && (
                      <p className="text-xs text-white/30 line-clamp-2">{snippet}</p>
                    )}
                  </button>
                );
              })}

              {chatResults.length > 0 && noteResults.length > 0 && (
                <div className="px-5 py-1.5">
                  <p className="text-[10px] text-white/20 font-medium">Chats</p>
                </div>
              )}
              {chatResults.map((session) => (
                <div
                  key={session.id}
                  className="w-full flex flex-col gap-1 px-5 py-3 text-left"
                >
                  <span className="text-sm text-white/60 truncate">{session.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
