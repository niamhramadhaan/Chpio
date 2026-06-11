import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArchiveRestore,
  Search,
  ChevronRight,
  Pin,
  Link2,
  Clipboard,
} from 'lucide-react';
import { useNotesStore } from '../store/notesStore';
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
  onOpen,
  onRename,
  onRenameSubmit,
  onRenameCancel,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  folder: { id: string; name: string; updatedAt: number };
  noteCount: number;
  previewNotes: { id: string; snippetText: string }[];
  isArchived: boolean;
  isRenaming: boolean;
  onOpen: () => void;
  onRename: () => void;
  onRenameSubmit: (newName: string) => void;
  onRenameCancel: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
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

      {/* Layer 4 — z-40 — foreground text overlay */}
      <div
        onClick={isRenaming ? undefined : onOpen}
        className="absolute inset-0 p-4 flex flex-col justify-between z-40 cursor-pointer"
      >
        <div>
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              defaultValue={folder.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onBlur={(e) => onRenameSubmit(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/5 text-slate-100 text-sm font-semibold px-2 py-1 rounded-lg border border-white/10 outline-none focus:border-teal-400/30 w-full max-w-[90%] transition-colors"
            />
          ) : (
            <h3 className="font-semibold text-slate-100 text-sm leading-tight truncate">
              {folder.name}
            </h3>
          )}
          <p className="text-[10px] text-white/25 mt-0.5">
            {isArchived ? `Archived ${relativeTime(folder.updatedAt)}` : `Edited ${relativeTime(folder.updatedAt)}`}
          </p>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-[10px] text-slate-800/80">
            {noteCount === 0 ? 'Empty' : `${noteCount} note${noteCount !== 1 ? 's' : ''}`}
          </span>
          {noteCount > 0 && (
            <span className="text-[10px] font-medium text-slate-700/70 bg-black/[0.06] border border-black/[0.08] rounded-full px-2 py-0.5">
              {noteCount}
            </span>
          )}
        </div>
      </div>

      {/* Hover actions — z-50 */}
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
            {!isArchived && (
              <button
                onClick={(e) => { e.stopPropagation(); onRename(); }}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {isArchived ? (
              <button
                onClick={(e) => { e.stopPropagation(); onUnarchive(); }}
                className="p-1.5 rounded-lg text-white/25 hover:text-teal-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Unarchive"
              >
                <ArchiveRestore className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction('archive'); }}
                className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Archive"
              >
                <Archive className="w-3 h-3" />
              </button>
            )}
            {isArchived && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); }}
                className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Note Card ── */
function NoteCard({
  note,
  isArchived,
  onOpen,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  note: Note;
  isArchived: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
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
        onClick={onOpen}
        className={`backdrop-blur-sm border rounded-xl p-3 transition-all duration-200 cursor-pointer h-full ${
          isArchived ? 'border-white/5 opacity-60 hover:opacity-80 bg-white/[0.03]' : 'border-white/[0.08] hover:border-white/15 hover:shadow-md hover:shadow-black/10 bg-white/[0.04]'
        }`}
      >
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-[11px] text-white/70 font-medium truncate flex-1">
            {note.title || 'Untitled'}
          </span>
          {note.pinned && (
            <Pin className="w-3 h-3 text-teal-400/60 shrink-0 ml-1.5" fill="currentColor" />
          )}
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

      {!confirmAction && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {isArchived ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onUnarchive(); }}
                className="p-1 rounded-lg text-white/15 hover:text-teal-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Unarchive"
              >
                <ArchiveRestore className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); }}
                className="p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction('archive'); }}
                className="p-1 rounded-lg text-white/15 hover:text-amber-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Archive"
              >
                <Archive className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); }}
                className="p-1 rounded-lg text-white/15 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </>
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
  pinnedNotes,
  folders,
  onSearchToggle,
  onSearchChange,
  onNewFolder,
  onNewNote,
  onShowArchived,
  onHideArchived,
  onOpenPinnedNote,
}: {
  view: 'folders' | 'folder' | 'note';
  showArchived: boolean;
  searchOpen: boolean;
  searchQuery: string;
  pinnedNotes: Note[];
  folders: NoteFolder[];
  onSearchToggle: () => void;
  onSearchChange: (q: string) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onShowArchived: () => void;
  onHideArchived: () => void;
  onOpenPinnedNote: (noteId: string, folderId: string) => void;
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
        {/* Search chip */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              key="search-input"
              layout
              initial={{ width: 32, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 32, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 overflow-hidden shrink-0"
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
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-medium text-white/50">Import</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer shrink-0"
            >
              <CheckSquare className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-medium text-white/50">Select</span>
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
              className="absolute bottom-full right-0 mb-2 w-56 py-2 rounded-xl bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
            >
              <p className="px-3 pb-1.5 text-[10px] text-white/30 font-medium">Pinned Notes</p>
              {pinnedNotes.length === 0 ? (
                <p className="px-3 py-3 text-[11px] text-white/20 text-center">No pinned notes yet</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {pinnedNotes.map((note) => {
                    const folder = folders.find((f) => f.id === note.folderId);
                    return (
                      <button
                        key={note.id}
                        onClick={() => { onOpenPinnedNote(note.id, note.folderId); setShowPinned(false); }}
                        className="w-full flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="text-[11px] text-white/70 truncate">{note.title || 'Untitled'}</span>
                        {folder && (
                          <span className="text-[9px] text-white/25">{folder.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
  const unarchiveFolder = useNotesStore((s) => s.unarchiveFolder);
  const setActiveFolder = useNotesStore((s) => s.setActiveFolder);
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const unarchiveNote = useNotesStore((s) => s.unarchiveNote);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const addTask = useNotesStore((s) => s.addTask);
  const toggleTask = useNotesStore((s) => s.toggleTask);
  const removeTask = useNotesStore((s) => s.removeTask);
  const setShowArchived = useNotesStore((s) => s.setShowArchived);
  const togglePin = useNotesStore((s) => s.togglePin);
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
  const taskInputRef = useRef<HTMLInputElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const folderNotes = activeFolderId ? getFolderNotes(activeFolderId) : [];
  const archivedFolders = getArchivedFolders();
  const archivedNotes = getArchivedNotes();

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

  const view: 'folders' | 'folder' | 'note' = activeNoteId ? 'note' : activeFolderId ? 'folder' : 'folders';

  const doneCount = activeNote?.tasks.filter((t) => t.done).length ?? 0;
  const totalCount = activeNote?.tasks.length ?? 0;

  const filteredFolders = showArchived
    ? archivedFolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders.filter((f) => !f.archived && f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredNotes = showArchived
    ? archivedNotes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : folderNotes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));

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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolder(false);
                  }}
                  placeholder="Folder name..."
                  className="flex-1 bg-white/5 text-white text-xs px-3 py-2 rounded-xl border border-white/10 outline-none focus:border-teal-400/30 placeholder-white/20 transition-colors"
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
              placeholder="Note title..."
              className="bg-transparent text-white/80 text-sm font-medium outline-none mb-2"
            />

            {/* Action bar */}
            <div className="flex items-center gap-1 mb-3">
              <button
                onClick={() => togglePin(activeNote.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer"
              >
                <CheckSquare className="w-3 h-3" />
                <span>List</span>
                {totalCount > 0 && (
                  <span className="text-white/20">{doneCount}/{totalCount}</span>
                )}
              </button>
              <button
                onClick={() => setLinksExpanded(!linksExpanded)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>Links</span>
                {(activeNote.links?.length ?? 0) > 0 && (
                  <span className="text-white/20">{activeNote.links!.length}</span>
                )}
              </button>
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/25 hover:text-white/50 hover:bg-white/5 transition-all cursor-pointer"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste</span>
              </button>
            </div>

            {/* Content textarea — fills available space */}
            <textarea
              ref={textareaRef}
              value={activeNote.content}
              onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
              placeholder="Write something..."
              className="flex-1 min-h-0 w-full bg-white/[0.03] text-white/80 text-xs p-3 rounded-xl border border-white/[0.06] outline-none resize-none placeholder-white/20 mb-2"
            />

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
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
                      placeholder="Add a link..."
                      className="bg-transparent text-white text-xs outline-none flex-1 placeholder-white/30"
                    />
                    <button
                      onClick={handleAddLink}
                      disabled={!linkInput.trim()}
                      className="text-teal-400/50 hover:text-teal-400 transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : activeFolderId && !showArchived ? (
          /* ── Folder Notes Grid ── */
          <motion.div
            key={`folder-${activeFolderId}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto px-4 pb-2"
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
                      onOpen={() => setActiveNote(note.id)}
                      onArchive={() => archiveNote(note.id)}
                      onUnarchive={() => unarchiveNote(note.id)}
                      onDelete={() => deleteNote(note.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Folder Grid ── */
          <div className="flex-1 overflow-y-auto px-4 pb-2">
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
                        onOpen={() => setActiveFolder(folder.id)}
                        onRename={() => setRenamingFolderId(folder.id)}
                        onRenameSubmit={(newName) => handleRenameFolder(folder.id, newName)}
                        onRenameCancel={() => setRenamingFolderId(null)}
                        onArchive={() => archiveFolder(folder.id)}
                        onUnarchive={() => unarchiveFolder(folder.id)}
                        onDelete={() => deleteFolder(folder.id)}
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
          pinnedNotes={getPinnedNotes()}
          folders={folders}
          onSearchToggle={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
          onSearchChange={setSearchQuery}
          onNewFolder={handleNewFolder}
          onNewNote={handleNewNote}
          onShowArchived={() => { setShowArchived(true); setSearchQuery(''); setActiveFolder(null); setActiveNote(null); }}
          onHideArchived={() => { setShowArchived(false); setSearchQuery(''); }}
          onOpenPinnedNote={(noteId, folderId) => { setActiveFolder(folderId); setActiveNote(noteId); }}
        />
      )}

    </div>
  );
}
