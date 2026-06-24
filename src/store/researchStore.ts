import { create } from 'zustand';

const STORAGE_KEY = 'chpio-research-sessions';

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  facts: string[];
  fetchedAt: number;
}

export interface ResearchStep {
  id: string;
  type: 'plan' | 'search' | 'read' | 'evaluate' | 'report';
  query?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
  sourcesFound?: number;
}

export interface ResearchSession {
  id: string;
  query: string;
  status: 'planning' | 'searching' | 'reading' | 'evaluating' | 'synthesizing' | 'done' | 'error';
  steps: ResearchStep[];
  sources: ResearchSource[];
  facts: string[];
  report: string;
  suggestedQueries: string[];
  errorMessage?: string;
  startedAt: number;
  completedAt?: number;
}

interface ResearchState {
  sessions: ResearchSession[];
  activeSessionId: string | null;
  createSession: (query: string) => string;
  updateSession: (id: string, patch: Partial<ResearchSession>) => void;
  addStep: (sessionId: string, step: ResearchStep) => void;
  updateStep: (sessionId: string, stepId: string, patch: Partial<ResearchStep>) => void;
  addSource: (sessionId: string, source: ResearchSource) => void;
  addFact: (sessionId: string, fact: string) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  getActiveSession: () => ResearchSession | undefined;
  loadSessions: () => void;
}

function loadFromStorage(): ResearchSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions: ResearchSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore quota errors
  }
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  sessions: loadFromStorage(),
  activeSessionId: null,

  createSession: (query) => {
    const id = crypto.randomUUID();
    const session: ResearchSession = {
      id,
      query,
      status: 'planning',
      steps: [],
      sources: [],
      facts: [],
      report: '',
      suggestedQueries: [],
      startedAt: Date.now(),
    };
    const sessions = [session, ...get().sessions];
    saveSessions(sessions);
    set({ sessions, activeSessionId: id });
    return id;
  },

  updateSession: (id, patch) => {
    const sessions = get().sessions.map((s) => (s.id === id ? { ...s, ...patch } : s));
    saveSessions(sessions);
    set({ sessions });
  },

  addStep: (sessionId, step) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, steps: [...s.steps, step] } : s,
    );
    saveSessions(sessions);
    set({ sessions });
  },

  updateStep: (sessionId, stepId, patch) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId
        ? { ...s, steps: s.steps.map((st) => (st.id === stepId ? { ...st, ...patch } : st)) }
        : s,
    );
    saveSessions(sessions);
    set({ sessions });
  },

  addSource: (sessionId, source) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId
        ? { ...s, sources: s.sources.some((existing) => existing.url === source.url) ? s.sources : [...s.sources, source] }
        : s,
    );
    saveSessions(sessions);
    set({ sessions });
  },

  addFact: (sessionId, fact) => {
    const sessions = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, facts: [...s.facts, fact] } : s,
    );
    saveSessions(sessions);
    set({ sessions });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  deleteSession: (id) => {
    const { sessions, activeSessionId } = get();
    const filtered = sessions.filter((s) => s.id !== id);
    saveSessions(filtered);
    set({
      sessions: filtered,
      activeSessionId: activeSessionId === id ? null : activeSessionId,
    });
  },

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },

  loadSessions: () => {
    set({ sessions: loadFromStorage() });
  },
}));
