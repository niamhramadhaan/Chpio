import { create } from 'zustand';
import type { Note, NoteFolder, NoteTask, NoteLink } from '../types';

const NOTES_KEY = 'chpio-notes';
const FOLDERS_KEY = 'chpio-note-folders';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((n: Record<string, unknown>) => ({
      ...n,
      archived: n.archived ?? false,
      archivedAt: n.archivedAt ?? undefined,
    }));
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadFolders(): NoteFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((f: Record<string, unknown>) => ({
      ...f,
      archived: f.archived ?? false,
      archivedAt: f.archivedAt ?? undefined,
    }));
  } catch {
    return [];
  }
}

function saveFolders(folders: NoteFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

interface NotesState {
  folders: NoteFolder[];
  notes: Note[];
  activeFolderId: string | null;
  activeNoteId: string | null;
  showArchived: boolean;

  createFolder: (name: string) => string;
  updateFolder: (id: string, updates: Partial<Pick<NoteFolder, 'name'>>) => void;
  deleteFolder: (id: string) => void;
  archiveFolder: (id: string) => void;
  unarchiveFolder: (id: string) => void;
  setActiveFolder: (id: string | null) => void;

  createNote: (folderId: string) => string;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => void;
  deleteNote: (id: string) => void;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  addTask: (noteId: string, text: string) => void;
  toggleTask: (noteId: string, taskId: string) => void;
  removeTask: (noteId: string, taskId: string) => void;

  setShowArchived: (show: boolean) => void;
  getFolderNotes: (folderId: string) => Note[];
  getArchivedNotes: (folderId?: string) => Note[];
  getArchivedFolders: () => NoteFolder[];
  getNoteCount: (folderId: string) => number;
  togglePin: (id: string) => void;
  getPinnedNotes: () => Note[];
  addLink: (noteId: string, url: string) => void;
  removeLink: (noteId: string, linkId: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  folders: loadFolders(),
  notes: loadNotes(),
  activeFolderId: null,
  activeNoteId: null,
  showArchived: false,

  createFolder: (name) => {
    const id = crypto.randomUUID();
    const folder: NoteFolder = {
      id,
      name,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const folders = [folder, ...get().folders];
    saveFolders(folders);
    set({ folders });
    return id;
  },

  updateFolder: (id, updates) => {
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
    );
    saveFolders(folders);
    set({ folders });
  },

  deleteFolder: (id) => {
    const notes = get().notes.filter((n) => n.folderId !== id);
    saveNotes(notes);
    const folders = get().folders.filter((f) => f.id !== id);
    saveFolders(folders);
    const activeFolderId = get().activeFolderId === id ? null : get().activeFolderId;
    const activeNoteId = notes.find((n) => n.id === get().activeNoteId) ? get().activeNoteId : null;
    set({ folders, notes, activeFolderId, activeNoteId });
  },

  archiveFolder: (id) => {
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, archived: true, archivedAt: Date.now() } : f
    );
    saveFolders(folders);
    const activeFolderId = get().activeFolderId === id ? null : get().activeFolderId;
    set({ folders, activeFolderId });
  },

  unarchiveFolder: (id) => {
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, archived: false, archivedAt: undefined } : f
    );
    saveFolders(folders);
    set({ folders });
  },

  setActiveFolder: (id) => set({ activeFolderId: id, activeNoteId: null }),

  createNote: (folderId) => {
    const id = crypto.randomUUID();
    const note: Note = {
      id,
      title: '',
      content: '',
      tasks: [],
      folderId,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const notes = [note, ...get().notes];
    saveNotes(notes);
    set({ notes, activeNoteId: id });
    return id;
  },

  updateNote: (id, updates) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  deleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    saveNotes(notes);
    const activeNoteId = get().activeNoteId === id ? null : get().activeNoteId;
    set({ notes, activeNoteId });
  },

  archiveNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, archived: true, archivedAt: Date.now() } : n
    );
    saveNotes(notes);
    const activeNoteId = get().activeNoteId === id ? null : get().activeNoteId;
    set({ notes, activeNoteId });
  },

  unarchiveNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, archived: false, archivedAt: undefined } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  addTask: (noteId, text) => {
    const task: NoteTask = { id: crypto.randomUUID(), text, done: false };
    const notes = get().notes.map((n) =>
      n.id === noteId ? { ...n, tasks: [...n.tasks, task], updatedAt: Date.now() } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  toggleTask: (noteId, taskId) => {
    const notes = get().notes.map((n) => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        tasks: n.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        updatedAt: Date.now(),
      };
    });
    saveNotes(notes);
    set({ notes });
  },

  removeTask: (noteId, taskId) => {
    const notes = get().notes.map((n) => {
      if (n.id !== noteId) return n;
      return {
        ...n,
        tasks: n.tasks.filter((t) => t.id !== taskId),
        updatedAt: Date.now(),
      };
    });
    saveNotes(notes);
    set({ notes });
  },

  setShowArchived: (show) => set({ showArchived: show }),

  getFolderNotes: (folderId) => {
    return get().notes
      .filter((n) => n.folderId === folderId && !n.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getArchivedNotes: (folderId?) => {
    return get().notes
      .filter((n) => n.archived && (!folderId || n.folderId === folderId))
      .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  },

  getArchivedFolders: () => {
    return get().folders
      .filter((f) => f.archived)
      .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  },

  getNoteCount: (folderId) => {
    return get().notes.filter((n) => n.folderId === folderId && !n.archived).length;
  },

  togglePin: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  getPinnedNotes: () => {
    return get().notes
      .filter((n) => n.pinned && !n.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  addLink: (noteId, url) => {
    const link: NoteLink = { id: crypto.randomUUID(), url };
    const notes = get().notes.map((n) =>
      n.id === noteId ? { ...n, links: [...(n.links || []), link], updatedAt: Date.now() } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  removeLink: (noteId, linkId) => {
    const notes = get().notes.map((n) =>
      n.id === noteId ? { ...n, links: (n.links || []).filter((l) => l.id !== linkId), updatedAt: Date.now() } : n
    );
    saveNotes(notes);
    set({ notes });
  },
}));
