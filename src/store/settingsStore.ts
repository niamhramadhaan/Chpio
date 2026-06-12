import { create } from 'zustand';
import type { Model, UserProfile, ProviderConfig } from '../types';
import { DEFAULT_PROVIDERS } from '../types';

const STORAGE_KEY = 'chpio-settings';

interface SettingsState {
  providers: ProviderConfig[];
  defaultModelId: string;
  fallbackModelId: string;
  selectedModelId: string;
  mainProviderId: string;
  wallpaper: string;
  user: UserProfile;

  setProviderKey: (id: string, key: string) => void;
  setProviderEnabled: (id: string, enabled: boolean) => void;
  setProviderModels: (id: string, models: Model[]) => void;
  setProviderSynced: (id: string, ts: number) => void;
  setDefaultModel: (id: string) => void;
  setFallbackModel: (id: string) => void;
  setSelectedModel: (id: string) => void;
  setMainProvider: (id: string) => void;
  setWallpaper: (url: string) => void;
  setUser: (user: UserProfile) => void;
  loadSettings: () => void;
}

const defaultUser: UserProfile = {
  name: 'User',
  avatar: '',
  email: '',
  timezone: 'GMT+0',
  workingHours: '9:00 - 17:00',
  title: '',
};

const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80';

function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);

    let providers: ProviderConfig[] = DEFAULT_PROVIDERS;

    if (data.providers && Array.isArray(data.providers)) {
      providers = DEFAULT_PROVIDERS.map((dp) => {
        const saved = data.providers.find((p: ProviderConfig) => p.id === dp.id);
        return saved ? { ...dp, ...saved } : dp;
      });
    } else if (data.apiKey) {
      providers = DEFAULT_PROVIDERS.map((p) =>
        p.id === 'openrouter'
          ? { ...p, apiKey: data.apiKey, enabled: true }
          : p
      );
    }

    return {
      providers,
      defaultModelId: data.defaultModelId || '',
      fallbackModelId: data.fallbackModelId || '',
      mainProviderId: data.mainProviderId || 'openrouter',
      wallpaper: data.wallpaper || DEFAULT_WALLPAPER,
      user: { ...defaultUser, ...data.user },
    };
  } catch {
    return {};
  }
}

let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function saveToStorage(state: Pick<SettingsState, 'providers' | 'defaultModelId' | 'fallbackModelId' | 'mainProviderId' | 'wallpaper' | 'user'>) {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        providers: state.providers,
        defaultModelId: state.defaultModelId,
        fallbackModelId: state.fallbackModelId,
        mainProviderId: state.mainProviderId,
        wallpaper: state.wallpaper,
        user: state.user,
      })
    );
  }, 300);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: DEFAULT_PROVIDERS,
  defaultModelId: '',
  fallbackModelId: '',
  selectedModelId: '',
  mainProviderId: 'openrouter',
  wallpaper: DEFAULT_WALLPAPER,
  user: defaultUser,

  setProviderKey: (id, key) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, apiKey: key, syncedModels: [], modelsLastSynced: null } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setProviderEnabled: (id, enabled) => {
    const providers = get().providers.map((p) => {
      if (p.id !== id) return p;
      return { ...p, enabled };
    });
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setProviderModels: (id, models) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, syncedModels: models } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setProviderSynced: (id, ts) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, modelsLastSynced: ts } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setDefaultModel: (id) => {
    set({ defaultModelId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: id, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setFallbackModel: (id) => {
    set({ fallbackModelId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: id, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user });
  },

  setSelectedModel: (id) => {
    set({ selectedModelId: id });
  },

  setMainProvider: (id) => {
    set({ mainProviderId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: id, wallpaper: st.wallpaper, user: st.user });
  },

  setWallpaper: (url) => {
    set({ wallpaper: url });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: url, user: st.user });
  },

  setUser: (user) => {
    set({ user });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user });
  },

  loadSettings: () => {
    const saved = loadFromStorage();
    set(saved);
  },
}));
