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
  archived: boolean;
  archivedAt?: number;
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
  enabled: boolean;
  modelsLastSynced: number | null;
  syncedModels: Model[];
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
  { id: 'lake-1', label: 'Alpine Lake', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { id: 'lake-2', label: 'Mountain Reflection', url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1920&q=80' },
  { id: 'lake-3', label: 'Foggy Peaks', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80' },
  { id: 'lake-4', label: 'Forest Valley', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80' },
  { id: 'lake-5', label: 'Green Hills', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80' },
  { id: 'vid-1', label: 'Cinematic Nature', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4', type: 'video' },
  { id: 'vid-2', label: 'Ambient Motion', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4', type: 'video' },
  { id: 'vid-3', label: 'Dynamic Scene', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4', type: 'video' },
];

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabled: true,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    apiKey: '',
    baseUrl: 'https://api.githubcopilot.com',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp',
    apiKey: '',
    baseUrl: 'http://localhost:8080',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'groq',
    name: 'Groq',
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    apiKey: '',
    baseUrl: 'https://api.mistral.ai/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'together',
    name: 'Together AI',
    apiKey: '',
    baseUrl: 'https://api.together.xyz/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    apiKey: '',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    enabled: false,
    modelsLastSynced: null,
    syncedModels: [],
  },
];
