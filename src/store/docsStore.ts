import { create } from 'zustand';
import type { Doc } from '../types';

const STORAGE_KEY = 'chpio-documents';

function loadDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: Doc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

interface DocsState {
  docs: Doc[];
  activeDocId: string | null;
  createDoc: (title: string) => string;
  updateDoc: (id: string, updates: Partial<Pick<Doc, 'title' | 'content'>>) => void;
  deleteDoc: (id: string) => void;
  setActiveDoc: (id: string | null) => void;
  getActiveDoc: () => Doc | undefined;
}

export const useDocsStore = create<DocsState>((set, get) => ({
  docs: loadDocs(),
  activeDocId: null,

  createDoc: (title) => {
    const id = crypto.randomUUID();
    const doc: Doc = {
      id,
      title,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const docs = [doc, ...get().docs];
    saveDocs(docs);
    set({ docs, activeDocId: id });
    return id;
  },

  updateDoc: (id, updates) => {
    const docs = get().docs.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
    );
    saveDocs(docs);
    set({ docs });
  },

  deleteDoc: (id) => {
    const docs = get().docs.filter((d) => d.id !== id);
    saveDocs(docs);
    const activeDocId = get().activeDocId === id ? null : get().activeDocId;
    set({ docs, activeDocId });
  },

  setActiveDoc: (id) => set({ activeDocId: id }),

  getActiveDoc: () => {
    const { docs, activeDocId } = get();
    return docs.find((d) => d.id === activeDocId);
  },
}));
