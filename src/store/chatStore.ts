import { create } from 'zustand';
import type { ChatSession, Message } from '../types';

const STORAGE_KEY = 'chpio-chat-sessions';

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
function debouncedSave(sessions: ChatSession[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveSessions(sessions), 500);
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    return sessions.map((s: Record<string, unknown>) => ({
      ...s,
      archived: s.archived ?? false,
      archivedAt: s.archivedAt ?? undefined,
      projectId: s.projectId ?? undefined,
    }));
  } catch {
    return [];
  }
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  abortController: AbortController | null;

  createSession: (modelId: string, projectId?: string) => string;
  setActiveSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateLastAssistantMessage: (sessionId: string, content: string) => void;
  updateLastAssistantThinking: (sessionId: string, thinking: string) => void;
  replaceSessionMessages: (sessionId: string, messages: Message[]) => void;
  setStreaming: (streaming: boolean) => void;
  stopStreaming: () => void;
  archiveSession: (id: string) => void;
  unarchiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getActiveSession: () => ChatSession | undefined;
  moveSessionToProject: (sessionId: string, projectId: string | undefined) => void;
  editMessage: (sessionId: string, messageId: string, content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: loadSessions(),
  activeSessionId: null,
  isStreaming: false,
  abortController: null,

  createSession: (modelId, projectId) => {
    const id = crypto.randomUUID();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      modelId,
      projectId,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const sessions = [session, ...get().sessions];
    saveSessions(sessions);
    set({ sessions, activeSessionId: id });
    return id;
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  addMessage: (sessionId, message) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = [...s.messages, message];
      const title =
        s.title === 'New Chat' && message.role === 'user'
          ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
          : s.title;
      return { ...s, messages, title, updatedAt: Date.now() };
    });
    saveSessions(sessions);
    set({ sessions });
  },

  updateLastAssistantMessage: (sessionId, content) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content };
      }
      return { ...s, messages, updatedAt: Date.now() };
    });
    debouncedSave(sessions);
    set({ sessions });
  },

  updateLastAssistantThinking: (sessionId, thinking) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, thinking };
      }
      return { ...s, messages, updatedAt: Date.now() };
    });
    debouncedSave(sessions);
    set({ sessions });
  },

  setStreaming: (streaming) => {
    if (!streaming && saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      saveSessions(get().sessions);
    }
    set({ isStreaming: streaming, abortController: streaming ? get().abortController : null });
  },

  stopStreaming: () => {
    const ctrl = get().abortController;
    if (ctrl) ctrl.abort();
    set({ isStreaming: false, abortController: null });
  },

  replaceSessionMessages: (sessionId, messages) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return { ...s, messages, updatedAt: Date.now() };
    });
    saveSessions(sessions);
    set({ sessions });
  },

  archiveSession: (id) => {
    const sessions = get().sessions.map((s) =>
      s.id === id ? { ...s, archived: true, archivedAt: Date.now() } : s
    );
    saveSessions(sessions);
    const activeSessionId = get().activeSessionId === id ? null : get().activeSessionId;
    set({ sessions, activeSessionId });
  },

  unarchiveSession: (id) => {
    const sessions = get().sessions.map((s) =>
      s.id === id ? { ...s, archived: false, archivedAt: undefined } : s
    );
    saveSessions(sessions);
    set({ sessions });
  },

  deleteSession: (id) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    saveSessions(sessions);
    const activeSessionId =
      get().activeSessionId === id ? null : get().activeSessionId;
    set({ sessions, activeSessionId });
  },

  updateSessionTitle: (sessionId, title) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return { ...s, title };
    });
    saveSessions(sessions);
    set({ sessions });
  },

  moveSessionToProject: (sessionId, projectId) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, projectId, updatedAt: Date.now() } : s
    );
    saveSessions(sessions);
    set({ sessions });
  },

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },

  editMessage: (sessionId, messageId, content) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = s.messages.map((m) =>
        m.id === messageId ? { ...m, content, updatedAt: Date.now() } : m
      );
      return { ...s, messages, updatedAt: Date.now() };
    });
    saveSessions(sessions);
    set({ sessions });
  },
}));
