import { create } from 'zustand';
import type { EmailAccount, EmailFolder, EmailMessage } from '../types';

const STORAGE_KEY = 'chpio-email';

function loadEmailState(): Partial<EmailState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveEmailState(state: Pick<EmailState, 'accounts' | 'selectedAccountId' | 'selectedFolder' | 'serverUrl'>) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accounts: state.accounts,
      selectedAccountId: state.selectedAccountId,
      selectedFolder: state.selectedFolder,
      serverUrl: state.serverUrl,
    }));
  }, 300);
}

interface EmailState {
  serverUrl: string;
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  selectedFolder: string;
  folders: EmailFolder[];
  messages: EmailMessage[];
  selectedMessage: EmailMessage | null;
  isLoading: boolean;
  error: string | null;

  setServerUrl: (url: string) => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (id: string) => void;
  setSelectedAccount: (id: string | null) => void;
  setSelectedFolder: (folder: string) => void;
  setFolders: (folders: EmailFolder[]) => void;
  setMessages: (messages: EmailMessage[]) => void;
  setSelectedMessage: (msg: EmailMessage | null) => void;
  updateMessage: (uid: number, patch: Partial<EmailMessage>) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  serverUrl: 'http://localhost:3001',
  accounts: [],
  selectedAccountId: null,
  selectedFolder: 'INBOX',
  folders: [],
  messages: [],
  selectedMessage: null,
  isLoading: false,
  error: null,

  ...loadEmailState(),

  setServerUrl: (url) => {
    set({ serverUrl: url });
    const s = get();
    saveEmailState({ accounts: s.accounts, selectedAccountId: s.selectedAccountId, selectedFolder: s.selectedFolder, serverUrl: url });
  },

  addAccount: (account) => {
    const accounts = [...get().accounts, account];
    set({ accounts, selectedAccountId: account.id });
    const s = get();
    saveEmailState({ accounts, selectedAccountId: account.id, selectedFolder: s.selectedFolder, serverUrl: s.serverUrl });
  },

  removeAccount: (id) => {
    const accounts = get().accounts.filter((a) => a.id !== id);
    const selectedAccountId = get().selectedAccountId === id ? (accounts[0]?.id || null) : get().selectedAccountId;
    set({ accounts, selectedAccountId, folders: [], messages: [], selectedMessage: null });
    const s = get();
    saveEmailState({ accounts, selectedAccountId, selectedFolder: s.selectedFolder, serverUrl: s.serverUrl });
  },

  setSelectedAccount: (id) => {
    set({ selectedAccountId: id, folders: [], messages: [], selectedMessage: null });
    const s = get();
    saveEmailState({ accounts: s.accounts, selectedAccountId: id, selectedFolder: s.selectedFolder, serverUrl: s.serverUrl });
  },

  setSelectedFolder: (folder) => {
    set({ selectedFolder: folder, messages: [], selectedMessage: null });
    const s = get();
    saveEmailState({ accounts: s.accounts, selectedAccountId: s.selectedAccountId, selectedFolder: folder, serverUrl: s.serverUrl });
  },

  setFolders: (folders) => set({ folders }),
  setMessages: (messages) => set({ messages }),
  setSelectedMessage: (msg) => set({ selectedMessage: msg }),
  updateMessage: (uid, patch) => {
    const messages = get().messages.map((m) => m.uid === uid ? { ...m, ...patch } : m);
    const selectedMessage = get().selectedMessage?.uid === uid ? { ...get().selectedMessage!, ...patch } : get().selectedMessage;
    set({ messages, selectedMessage });
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
