import { create } from 'zustand';
import type { Memory } from '../types';

const STORAGE_KEY = 'chpio-memories';

let memoriesSaveTimer: ReturnType<typeof setTimeout> | null = null;

function loadMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMemories(memories: Memory[]) {
  if (memoriesSaveTimer) clearTimeout(memoriesSaveTimer);
  memoriesSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (err) {
      console.error('[memoryStore] Failed to persist memories:', err);
    }
  }, 300);
}

interface MemoryState {
  memories: Memory[];
  activeTag: string | null;
  createMemory: (content: string, tags: string[]) => string;
  updateMemory: (id: string, updates: Partial<Pick<Memory, 'content' | 'tags'>>) => void;
  deleteMemory: (id: string) => void;
  searchMemories: (query: string) => Memory[];
  setActiveTag: (tag: string | null) => void;
  getFilteredMemories: () => Memory[];
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: loadMemories(),
  activeTag: null,

  createMemory: (content, tags) => {
    const id = crypto.randomUUID();
    const memory: Memory = {
      id,
      content,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const memories = [memory, ...get().memories];
    saveMemories(memories);
    set({ memories });
    return id;
  },

  updateMemory: (id, updates) => {
    const memories = get().memories.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
    );
    saveMemories(memories);
    set({ memories });
  },

  deleteMemory: (id) => {
    const memories = get().memories.filter((m) => m.id !== id);
    saveMemories(memories);
    set({ memories });
  },

  searchMemories: (query) => {
    if (!query.trim()) return get().memories;
    const q = query.toLowerCase();
    return get().memories.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  setActiveTag: (tag) => set({ activeTag: tag }),

  getFilteredMemories: () => {
    const { memories, activeTag } = get();
    if (!activeTag) return memories;
    return memories.filter((m) => m.tags.includes(activeTag));
  },
}));
