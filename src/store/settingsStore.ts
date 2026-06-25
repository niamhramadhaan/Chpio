import { create } from 'zustand';
import type { Model, UserProfile, ProviderConfig } from '../types';
import { DEFAULT_PROVIDERS } from '../types';
import { fetchProviderModels } from '../services/providers';

const STORAGE_KEY = 'chpio-settings';
const AUTO_SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

interface SettingsState {
  providers: ProviderConfig[];
  defaultModelId: string;
  fallbackModelId: string;
  selectedModelId: string;
  mainProviderId: string;
  wallpaper: string;
  user: UserProfile;
  tavilyApiKey: string;

  setProviderKey: (id: string, key: string) => void;
  setProviderEnabled: (id: string, enabled: boolean) => void;
  setProviderModels: (id: string, models: Model[]) => void;
  setProviderSynced: (id: string, ts: number) => void;
  setProviderBaseUrl: (id: string, url: string) => void;
  resetProviderBaseUrl: (id: string) => void;
  toggleFavoriteModel: (providerId: string, modelId: string) => void;
  setDefaultModel: (id: string) => void;
  setFallbackModel: (id: string) => void;
  setSelectedModel: (id: string) => void;
  setMainProvider: (id: string) => void;
  setWallpaper: (url: string) => void;
  setUser: (user: UserProfile) => void;
  setTavilyApiKey: (key: string) => void;
  loadSettings: () => void;
  autoSyncProviders: () => Promise<void>;
}

const defaultUser: UserProfile = {
  name: 'User',
  avatar: '',
  email: '',
  timezone: 'GMT+0',
  workingHours: '9:00 - 17:00',
  title: '',
};

const DEFAULT_WALLPAPER = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4';

function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);

    let providers: ProviderConfig[] = DEFAULT_PROVIDERS;

    if (data.providers && Array.isArray(data.providers)) {
      providers = DEFAULT_PROVIDERS.map((dp) => {
        const saved = data.providers.find((p: ProviderConfig) => p.id === dp.id);
        if (saved) {
          return {
            ...dp,
            ...saved,
            defaultBaseUrl: dp.defaultBaseUrl,
            favoriteModels: saved.favoriteModels || [],
          };
        }
        return dp;
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
      tavilyApiKey: data.tavilyApiKey || '',
    };
  } catch {
    return {};
  }
}

let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function saveToStorage(state: Pick<SettingsState, 'providers' | 'defaultModelId' | 'fallbackModelId' | 'mainProviderId' | 'wallpaper' | 'user' | 'tavilyApiKey'>) {
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
        tavilyApiKey: state.tavilyApiKey,
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
  tavilyApiKey: '',

  setProviderKey: (id, key) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, apiKey: key, syncedModels: [], modelsLastSynced: null } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setProviderEnabled: (id, enabled) => {
    const providers = get().providers.map((p) => {
      if (p.id !== id) return p;
      return { ...p, enabled };
    });
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setProviderModels: (id, models) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, syncedModels: models } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setProviderSynced: (id, ts) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, modelsLastSynced: ts } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setProviderBaseUrl: (id, url) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, baseUrl: url } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  resetProviderBaseUrl: (id) => {
    const providers = get().providers.map((p) =>
      p.id === id ? { ...p, baseUrl: p.defaultBaseUrl } : p
    );
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  toggleFavoriteModel: (providerId, modelId) => {
    const providers = get().providers.map((p) => {
      if (p.id !== providerId) return p;
      const favorites = p.favoriteModels || [];
      const isFav = favorites.includes(modelId);
      return {
        ...p,
        favoriteModels: isFav
          ? favorites.filter((id) => id !== modelId)
          : [...favorites, modelId],
      };
    });
    set({ providers });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setDefaultModel: (id) => {
    set({ defaultModelId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: id, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setFallbackModel: (id) => {
    set({ fallbackModelId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: id, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setSelectedModel: (id) => {
    set({ selectedModelId: id });
  },

  setMainProvider: (id) => {
    set({ mainProviderId: id });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: id, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setWallpaper: (url) => {
    set({ wallpaper: url });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: url, user: st.user, tavilyApiKey: st.tavilyApiKey });
  },

  setUser: (user) => {
    set({ user });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user, tavilyApiKey: st.tavilyApiKey });
  },

  setTavilyApiKey: (key) => {
    set({ tavilyApiKey: key });
    const st = get();
    saveToStorage({ providers: st.providers, defaultModelId: st.defaultModelId, fallbackModelId: st.fallbackModelId, mainProviderId: st.mainProviderId, wallpaper: st.wallpaper, user: st.user, tavilyApiKey: key });
  },

  loadSettings: () => {
    const saved = loadFromStorage();
    set(saved);
  },

  autoSyncProviders: async () => {
    const { providers, setProviderModels, setProviderSynced } = get();
    const now = Date.now();

    for (const provider of providers) {
      if (!provider.enabled) continue;
      if (provider.id !== 'ollama' && provider.id !== 'llamacpp' && provider.id !== 'webllm' && provider.id !== 'custom' && !provider.apiKey) continue;

      const lastSynced = provider.modelsLastSynced || 0;
      if (now - lastSynced < AUTO_SYNC_INTERVAL) continue;

      try {
        const models = await fetchProviderModels(provider.baseUrl, provider.apiKey || undefined, provider.id);
        setProviderModels(provider.id, models);
        setProviderSynced(provider.id, now);
      } catch (e) {
        console.error(`Auto-sync failed for ${provider.name}:`, e);
      }
    }
  },
}));
