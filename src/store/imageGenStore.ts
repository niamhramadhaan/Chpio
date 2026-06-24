import { create } from 'zustand';

const STORAGE_KEY = 'chpio-image-gen';
const CUSTOM_CONFIG_KEY = 'chpio-image-gen-custom';
const MAX_IMAGES = 20;

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageData: string;
  mimeType: string;
  provider: string;
  model: string;
  settings: { size: string; quality: string };
  createdAt: number;
}

export interface CustomProviderConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

interface ImageGenState {
  images: GeneratedImage[];
  isGenerating: boolean;
  progress: string;
  selectedProvider: string;
  selectedModel: string;
  customProvider: CustomProviderConfig;

  addImage: (img: GeneratedImage) => void;
  removeImage: (id: string) => void;
  setGenerating: (v: boolean) => void;
  setProgress: (msg: string) => void;
  setSelectedProvider: (id: string) => void;
  setSelectedModel: (model: string) => void;
  setCustomProvider: (config: Partial<CustomProviderConfig>) => void;
  clearAll: () => void;
  loadImages: () => void;
}

function loadImagesFromStorage(): GeneratedImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadCustomConfig(): CustomProviderConfig {
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { baseUrl: '', apiKey: '', modelName: '' };
  } catch {
    return { baseUrl: '', apiKey: '', modelName: '' };
  }
}

function saveImages(images: GeneratedImage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    const trimmed = images.slice(-10);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

function saveCustomConfig(config: CustomProviderConfig) {
  try {
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const useImageGenStore = create<ImageGenState>((set, get) => ({
  images: loadImagesFromStorage(),
  isGenerating: false,
  progress: '',
  selectedProvider: 'openai',
  selectedModel: '',
  customProvider: loadCustomConfig(),

  addImage: (img) => {
    const images = [img, ...get().images].slice(0, MAX_IMAGES);
    saveImages(images);
    set({ images });
  },

  removeImage: (id) => {
    const images = get().images.filter((i) => i.id !== id);
    saveImages(images);
    set({ images });
  },

  setGenerating: (v) => set({ isGenerating: v }),
  setProgress: (msg) => set({ progress: msg }),
  setSelectedProvider: (id) => set({ selectedProvider: id }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  setCustomProvider: (config) => {
    const updated = { ...get().customProvider, ...config };
    saveCustomConfig(updated);
    set({ customProvider: updated });
  },

  clearAll: () => {
    saveImages([]);
    set({ images: [] });
  },

  loadImages: () => {
    set({ images: loadImagesFromStorage() });
  },
}));
