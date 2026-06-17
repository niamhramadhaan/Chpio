export type AppView = 'onboarding' | 'workspace';

export type Feature =
  | 'home'
  | 'chat'
  | 'notes'
  | 'docs'
  | 'research'
  | 'calendar'
  | 'memory'
  | 'settings';

export interface Model {
  id: string;
  name: string;
  contextLength: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  description?: string;
  providerId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  modelId?: string;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  skills: string;
  specialInstructions: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  projectId?: string;
  attachedDocIds?: string[];
  archived: boolean;
  archivedAt?: number;
  starred?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  timezone: string;
  workingHours: string;
  title: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  defaultBaseUrl: string;
  enabled: boolean;
  modelsLastSynced: number | null;
  syncedModels: Model[];
  favoriteModels: string[];
}

export interface WallpaperOption {
  id: string;
  label: string;
  url: string;
  type?: 'image' | 'video';
}

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteTask {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteLink {
  id: string;
  url: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tasks: NoteTask[];
  links?: NoteLink[];
  folderId: string;
  archived: boolean;
  archivedAt?: number;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteFolder {
  id: string;
  name: string;
  archived: boolean;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export const WALLPAPERS: WallpaperOption[] = [
  { id: 'nature-1', label: 'Alpine Lake', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { id: 'nature-2', label: 'Valley Mist', url: 'https://images.pexels.com/photos/34418177/pexels-photo-34418177.jpeg' },
  { id: 'nature-3', label: 'Green Valley', url: 'https://images.unsplash.com/photo-1624087267589-41ea77e28b1a?w=1920&q=80' },
  { id: 'nature-4', label: 'Forest Path', url: 'https://images.unsplash.com/photo-1565118531796-763e5082d113?w=1920&q=80' },
  { id: 'vid-1', label: 'Ambient Motion', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4', type: 'video' },
  { id: 'vid-2', label: 'Dynamic Scene', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4', type: 'video' },
  { id: 'vid-3', label: 'Peaceful Flow', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4', type: 'video' },
  { id: 'vid-4', label: 'Ambient Glow', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260525_052706_d2e390fd-1846-4fe7-a4d8-8d2f1c875358.mp4', type: 'video' },
  { id: 'vid-5', label: 'Soft Motion', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4', type: 'video' },
];

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    enabled: true,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    defaultBaseUrl: 'https://api.openai.com/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    apiKey: '',
    baseUrl: 'https://api.githubcopilot.com',
    defaultBaseUrl: 'https://api.githubcopilot.com',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    defaultBaseUrl: 'http://localhost:11434',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp',
    apiKey: '',
    baseUrl: 'http://localhost:8080',
    defaultBaseUrl: 'http://localhost:8080',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'groq',
    name: 'Groq',
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    apiKey: '',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'together',
    name: 'Together AI',
    apiKey: '',
    baseUrl: 'https://api.together.xyz/v1',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    apiKey: '',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
    favoriteModels: [],
  },
];
