import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Zap, Power, PowerOff,
  Check, Settings as SettingsIcon, Palette, Server, CheckCircle2, XCircle, Star,
  Search, RotateCcw, X, ExternalLink, Mail, Cpu, Download, Sparkles,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useEmailStore } from '../store/emailStore';
import { testImapConnection, addAccount } from '../services/emailApi';
import { useAppStore } from '../store/appStore';
import { Modal } from './ui/Modal';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { ConfirmModal } from './ui/ConfirmModal';
import { PortalDropdown } from './ui/PortalDropdown';
import { testConnection, fetchProviderModels } from '../services/providers';
import { testTavilyConnection } from '../services/tavily';
import { addCustomModel, removeCustomModel, getCustomModels } from '../services/webllm';
import { useImageGenStore } from '../store/imageGenStore';
import { DataManager } from './DataManager';
import { WALLPAPERS } from '../types';
import { getActiveModels } from '../utils/models';
import type { ProviderConfig } from '../types';

const PROVIDER_LOGOS: Record<string, string> = {
  openrouter: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openrouter.svg',
  openai: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openai.svg',
  copilot: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg',
  ollama: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ollama.svg',
  llamacpp: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cplusplus.svg',
  webllm: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlechrome.svg',
  google: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/google.svg',
  deepseek: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/deepseek.svg',
  groq: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNGNTUwMzYiLz48dGV4dCB4PSI3LjUiIHk9IjE4IiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5HPC90ZXh0Pjwvc3ZnPg==',
  mistral: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mistralai.svg',
  together: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2MzY2RjEiLz48dGV4dCB4PSI3IiB5PSIxOCIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+VDwvdGV4dD48L3N2Zz4=',
  fireworks: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNGRjZCMzUiLz48dGV4dCB4PSI2IiB5PSIxOCIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+RjwvdGV4dD48L3N2Zz4=',
  custom: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2MzY2RjEiLz48dGV4dCB4PSI2IiB5PSIxOCIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+QzwvdGV4dD48L3N2Zz4=',
};

type Tab = 'providers' | 'local' | 'defaultModel' | 'wallpaper' | 'research' | 'email' | 'data' | 'imagegen';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, settingsInitialTab, setSettingsInitialTab } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('providers');

  // Use initial tab when provided
  useEffect(() => {
    if (settingsInitialTab) {
      setActiveTab(settingsInitialTab as Tab);
      setSettingsInitialTab(null);
    }
  }, [settingsInitialTab, setSettingsInitialTab]);

  const tabs: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'providers', label: 'Providers', icon: Server },
    { id: 'local', label: 'Local', icon: Cpu },
    { id: 'defaultModel', label: 'Default Model', icon: SettingsIcon },
    { id: 'wallpaper', label: 'Wallpaper', icon: Palette },
    { id: 'research', label: 'Research', icon: Search },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'data', label: 'Data', icon: Download },
    { id: 'imagegen', label: 'Image Gen', icon: Sparkles },
  ];

  return (
    <Modal
      isOpen={settingsModalOpen}
      onClose={() => setSettingsModalOpen(false)}
      title="Settings"
      className="max-w-3xl h-[520px] overflow-hidden flex flex-col"
    >
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left sidebar tabs */}
        <div className="w-44 shrink-0 flex flex-col gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
                  activeTab === tab.id
                    ? 'bg-teal-400/15 text-teal-400'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px bg-white/5 shrink-0" />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {activeTab === 'providers' && <ProvidersTab />}
          {activeTab === 'local' && <LocalTab />}
          {activeTab === 'defaultModel' && <DefaultModelTab />}
          {activeTab === 'wallpaper' && <WallpaperTab />}
          {activeTab === 'research' && <ResearchTab />}
          {activeTab === 'email' && <EmailTab />}
          {activeTab === 'data' && <DataManager />}
          {activeTab === 'imagegen' && <ImageGenSettingsTab />}
        </div>
      </div>
    </Modal>
  );
}

function DefaultModelTab() {
  const {
    defaultModelId, fallbackModelId, setDefaultModel, setFallbackModel,
  } = useSettingsStore();
  const providers = useSettingsStore((s) => s.providers);
  const models = useMemo(() => getActiveModels(providers), [providers]);

  return (
    <div className="space-y-5">
      <GlassCard className="p-5 space-y-3">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Default Model</h2>
        <ModelDropdown
          value={defaultModelId}
          onChange={setDefaultModel}
          models={models}
          placeholder="Select default model..."
        />
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Fallback Model</h2>
        <ModelDropdown
          value={fallbackModelId}
          onChange={setFallbackModel}
          models={models}
          placeholder="Select fallback model (optional)..."
        />
        <p className="text-xs text-white/30">Used if the primary model fails or is unavailable.</p>
      </GlassCard>
    </div>
  );
}

function ImageGenSettingsTab() {
  const providers = useSettingsStore((s) => s.providers);
  const { customProvider, setCustomProvider } = useImageGenStore();

  const imageGenProviders = useMemo(() => {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-image-1', 'dall-e-3', 'dall-e-2'],
        description: 'Best quality, requires OpenAI API key',
      },
      {
        id: 'together',
        name: 'Together AI',
        models: ['FLUX.1-schnell-Free', 'FLUX.1-dev', 'SDXL'],
        description: 'Free tier available, fast generation',
      },
      {
        id: 'custom',
        name: 'Custom Endpoint',
        models: ['Any OpenAI-compatible model'],
        description: 'Use your own image generation server',
      },
    ];
  }, []);

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Image Generation Providers</h2>
        <p className="text-xs text-white/40">
          Configure providers for AI image generation. Uses the same API keys from your main providers.
        </p>

        <div className="space-y-3">
          {imageGenProviders.map((provider) => {
            const mainProvider = providers.find((p) => p.id === provider.id);
            const isCustom = provider.id === 'custom';
            const isReady = isCustom
              ? !!customProvider.baseUrl
              : mainProvider?.enabled && mainProvider?.apiKey;

            return (
              <div
                key={provider.id}
                className={`p-4 rounded-xl border ${
                  isReady ? 'bg-teal-400/5 border-teal-400/20' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{provider.name}</span>
                    {isReady ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-400/15 text-teal-400 font-medium">Ready</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/30 font-medium">{isCustom ? 'Not configured' : 'No key'}</span>
                    )}
                  </div>
                  {isReady && (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  )}
                </div>
                <p className="text-[10px] text-white/30 mb-2">{provider.description}</p>
                {!isCustom && (
                  <div className="flex flex-wrap gap-1">
                    {provider.models.map((model) => (
                      <span
                        key={model}
                        className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/40"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                )}
                {!isReady && !isCustom && (
                  <p className="text-[10px] text-white/20 mt-2">
                    Enable in Settings → Providers and add API key
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Custom Provider Settings */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Custom Endpoint Settings</h2>
        <p className="text-xs text-white/40">
          Configure a custom OpenAI-compatible image generation endpoint.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40">Base URL</label>
            <input
              value={customProvider.baseUrl}
              onChange={(e) => setCustomProvider({ baseUrl: e.target.value })}
              placeholder="https://your-server.com/v1"
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono
                         bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40">API Key (optional)</label>
            <input
              type="password"
              value={customProvider.apiKey}
              onChange={(e) => setCustomProvider({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono
                         bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40">Model Name</label>
            <input
              value={customProvider.modelName}
              onChange={(e) => setCustomProvider({ modelName: e.target.value })}
              placeholder="my-image-model"
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono
                         bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">How to Use</h2>
        <div className="space-y-2 text-xs text-white/40">
          <p>1. Enable a provider above and add your API key</p>
          <p>2. Open Image Gen from the bottom dock (⋯ menu)</p>
          <p>3. Type a prompt and click Generate</p>
          <p>4. Download or send generated images to chat</p>
        </div>
      </GlassCard>
    </div>
  );
}

function LocalTab() {
  const providers = useSettingsStore((s) => s.providers);
  const setProviderEnabled = useSettingsStore((s) => s.setProviderEnabled);
  const setProviderModels = useSettingsStore((s) => s.setProviderModels);
  const setProviderSynced = useSettingsStore((s) => s.setProviderSynced);
  const webllmProvider = providers.find((p) => p.id === 'webllm');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [customModels, setCustomModels] = useState(getCustomModels());
  const [customDraft, setCustomDraft] = useState<{ modelId: string; modelUrl: string; modelLibUrl: string; vramMb: string }>({ modelId: '', modelUrl: '', modelLibUrl: '', vramMb: '' });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection('', undefined, 'webllm');
    setTestResult({ ok: result.ok, msg: result.ok ? 'WebGPU available!' : result.error || 'Failed' });
    setTesting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError('');
    try {
      const models = await fetchProviderModels('', undefined, 'webllm');
      setProviderModels('webllm', models);
      setProviderSynced('webllm', Date.now());
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async () => {
    if (!webllmProvider) return;
    const newEnabled = !webllmProvider.enabled;
    setProviderEnabled('webllm', newEnabled);
    if (newEnabled && webllmProvider.syncedModels.length === 0) {
      await handleSync();
    }
  };

  const handleAddCustom = () => {
    if (!customDraft.modelId || !customDraft.modelUrl || !customDraft.modelLibUrl) return;
    addCustomModel({
      modelId: customDraft.modelId,
      modelUrl: customDraft.modelUrl,
      modelLibUrl: customDraft.modelLibUrl,
      vramMb: customDraft.vramMb ? Number(customDraft.vramMb) : undefined,
    });
    setCustomModels(getCustomModels());
    setCustomDraft({ modelId: '', modelUrl: '', modelLibUrl: '', vramMb: '' });
    setCustomFormOpen(false);
    handleSync();
  };

  if (!webllmProvider) return null;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">Local AI (Browser)</h2>
            <p className="text-xs text-white/40">Run models directly in your browser via WebGPU</p>
          </div>
        </div>

        <div className="rounded-lg bg-teal-400/5 border border-teal-400/10 p-3 space-y-1.5">
          <p className="text-xs text-white/40">
            No API key, no server. Models download on first use (~0.7-2 GB) and are cached locally.
            Requires Chrome or Edge 113+ with WebGPU enabled.
          </p>
        </div>

        <div className="flex gap-2">
          <GlassButton onClick={handleTest} disabled={testing} size="sm" className="flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
            {testing ? 'Testing...' : 'Test WebGPU'}
          </GlassButton>
          <GlassButton onClick={handleSync} disabled={syncing} variant="accent" size="sm" className="flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Models'}
          </GlassButton>
          <GlassButton onClick={handleToggle} size="sm" variant="ghost" className="flex items-center gap-1.5">
            {webllmProvider.enabled ? (
              <><PowerOff className="w-3.5 h-3.5" /> Disable</>
            ) : (
              <><Power className="w-3.5 h-3.5 text-teal-400" /> <span className="text-teal-400">Enable</span></>
            )}
          </GlassButton>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-xs ${testResult.ok ? 'text-teal-400' : 'text-red-400'}`}>
            {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {testResult.msg}
          </div>
        )}
        {syncError && <p className="text-red-400 text-xs">{syncError}</p>}
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Custom Models</h3>
          <button
            onClick={() => setCustomFormOpen(!customFormOpen)}
            className="text-[10px] px-2 py-0.5 rounded-md bg-teal-400/15 text-teal-400 font-medium cursor-pointer hover:bg-teal-400/25 transition-colors"
          >
            {customFormOpen ? 'Cancel' : '+ Add Model'}
          </button>
        </div>

        {customFormOpen && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
            <input value={customDraft.modelId} onChange={(e) => setCustomDraft((s) => ({ ...s, modelId: e.target.value }))} placeholder="Model ID (e.g., MyModel-q4f16)" className="w-full px-3 py-1.5 rounded-lg border outline-none text-xs font-mono bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all" />
            <input value={customDraft.modelUrl} onChange={(e) => setCustomDraft((s) => ({ ...s, modelUrl: e.target.value }))} placeholder="Model URL (HuggingFace or direct)" className="w-full px-3 py-1.5 rounded-lg border outline-none text-xs font-mono bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all" />
            <input value={customDraft.modelLibUrl} onChange={(e) => setCustomDraft((s) => ({ ...s, modelLibUrl: e.target.value }))} placeholder="WASM lib URL (.wasm file)" className="w-full px-3 py-1.5 rounded-lg border outline-none text-xs font-mono bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all" />
            <div className="flex gap-2">
              <input type="number" value={customDraft.vramMb} onChange={(e) => setCustomDraft((s) => ({ ...s, vramMb: e.target.value }))} placeholder="VRAM (MB)" className="w-28 px-3 py-1.5 rounded-lg border outline-none text-xs font-mono bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all" />
              <GlassButton size="sm" variant="accent" className="flex-1" onClick={handleAddCustom}>Add</GlassButton>
            </div>
            <p className="text-[10px] text-white/30">
              Model must be in MLC format. See <a href="https://llm.mlc.ai/docs/deploy/webllm.html" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">MLC docs</a> for compiling custom models.
            </p>
          </div>
        )}

        {customModels.length > 0 && (
          <div className="space-y-1">
            {customModels.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-white/5">
                <span className="text-white/70 truncate flex-1">{m.name}</span>
                <button onClick={() => { removeCustomModel(m.id); setCustomModels(getCustomModels()); handleSync(); }} className="ml-2 text-red-400/60 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {webllmProvider.syncedModels.length > 0 && (
        <GlassCard className="p-5 space-y-2">
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Available Models ({webllmProvider.syncedModels.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {webllmProvider.syncedModels.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white/80 truncate flex-1">{m.name}</span>
                {m.description && <span className="text-white/30 text-[10px] ml-2 shrink-0">{m.description}</span>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function ModelDropdown({
  value,
  onChange,
  models,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  models: { id: string; name: string; providerId?: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find((m) => m.id === value);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-left cursor-pointer hover:bg-white/10 transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {selected ? `${selected.providerId ? selected.providerId + ' / ' : ''}${selected.name}` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PortalDropdown
        isOpen={open}
        triggerRef={triggerRef}
        align="left"
        direction="down"
        matchTriggerWidth
        onClose={() => setOpen(false)}
        className="max-h-48 overflow-y-auto rounded-xl bg-[#1A201F] border border-white/10 shadow-2xl"
      >
        {models.length === 0 && (
          <div className="px-4 py-3 text-white/30 text-xs">No models synced. Sync a provider first.</div>
        )}
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => { onChange(m.id); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer ${
              value === m.id ? 'bg-teal-400/15 text-teal-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-white/30">{m.providerId}/</span>{m.name}
          </button>
        ))}
      </PortalDropdown>
    </>
  );
}

function ProvidersTab() {
  const { providers, setProviderKey, setProviderEnabled, setProviderModels, setProviderSynced, setProviderBaseUrl, resetProviderBaseUrl, toggleFavoriteModel, mainProviderId, setMainProvider } = useSettingsStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [draftKeys, setDraftKeys] = useState<Record<string, string>>({});
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState<Record<string, string>>({});

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const keys: Record<string, string> = {};
    const urls: Record<string, string> = {};
    providers.forEach((p) => { keys[p.id] = p.apiKey; urls[p.id] = p.baseUrl; });
    setDraftKeys(keys);
    setDraftUrls(urls);
  }, [providers]);

  const handleTest = async (provider: ProviderConfig) => {
    setTesting((s) => ({ ...s, [provider.id]: true }));
    setTestResults((s) => ({ ...s, [provider.id]: { ok: false, msg: '' } }));
    const result = await testConnection(draftUrls[provider.id] || provider.baseUrl, provider.apiKey || undefined, provider.id);
    setTestResults((s) => ({
      ...s,
      [provider.id]: { ok: result.ok, msg: result.ok ? 'Connected!' : result.error || 'Failed' },
    }));
    setTesting((s) => ({ ...s, [provider.id]: false }));
  };

  const handleSync = async (provider: ProviderConfig) => {
    if (provider.id !== 'ollama' && provider.id !== 'llamacpp' && provider.id !== 'webllm' && provider.id !== 'custom' && !provider.apiKey) {
      setSyncErrors((s) => ({ ...s, [provider.id]: 'Enter an API key first' }));
      return;
    }
    setSyncing((s) => ({ ...s, [provider.id]: true }));
    setSyncErrors((s) => ({ ...s, [provider.id]: '' }));
    try {
      const models = await fetchProviderModels(draftUrls[provider.id] || provider.baseUrl, provider.apiKey || undefined, provider.id);
      setProviderModels(provider.id, models);
      setProviderSynced(provider.id, Date.now());
    } catch (e) {
      setSyncErrors((s) => ({ ...s, [provider.id]: e instanceof Error ? e.message : 'Sync failed' }));
    } finally {
      setSyncing((s) => ({ ...s, [provider.id]: false }));
    }
  };

  const handleKeySave = (provider: ProviderConfig) => {
    if (draftKeys[provider.id] !== provider.apiKey) {
      setConfirmKey(provider.id);
    }
  };

  const confirmKeySave = () => {
    if (!confirmKey) return;
    setProviderKey(confirmKey, draftKeys[confirmKey] || '');
  };

  const handleToggle = async (provider: ProviderConfig) => {
    const newEnabled = !provider.enabled;
    setProviderEnabled(provider.id, newEnabled);

    // Auto-sync when enabling a provider with valid credentials
    if (newEnabled && (provider.id === 'ollama' || provider.id === 'llamacpp' || provider.id === 'webllm' || provider.id === 'custom' || provider.apiKey)) {
      setSyncing((s) => ({ ...s, [provider.id]: true }));
      try {
        const models = await fetchProviderModels(draftUrls[provider.id] || provider.baseUrl, provider.apiKey || undefined, provider.id);
        setProviderModels(provider.id, models);
        setProviderSynced(provider.id, Date.now());
      } catch (e) {
        console.error(`Auto-sync failed for ${provider.name}:`, e);
      } finally {
        setSyncing((s) => ({ ...s, [provider.id]: false }));
      }
    }
  };

  const handleUrlSave = (provider: ProviderConfig) => {
    const url = draftUrls[provider.id];
    if (url && url !== provider.baseUrl) {
      setProviderBaseUrl(provider.id, url);
    }
  };

  const handleUrlReset = (provider: ProviderConfig) => {
    resetProviderBaseUrl(provider.id);
    setDraftUrls((s) => ({ ...s, [provider.id]: provider.defaultBaseUrl }));
  };

  const sortedProviders = useMemo(() => {
    return [...providers]
      .filter((p) => p.id !== 'webllm')
      .sort((a, b) => {
        if (a.id === mainProviderId) return -1;
        if (b.id === mainProviderId) return 1;
        return 0;
      });
  }, [providers, mainProviderId]);

  return (
    <div className="space-y-3">
      {sortedProviders.map((provider) => {
        const isExpanded = expanded === provider.id;
        const logo = PROVIDER_LOGOS[provider.id];
        const isMain = provider.id === mainProviderId;
        const search = modelSearch[provider.id] || '';
        const favoriteModels = provider.favoriteModels || [];
        const filteredModels = provider.syncedModels.filter((m) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        );
        const sortedModels = [...filteredModels].sort((a, b) => {
          const aFav = favoriteModels.includes(a.id);
          const bFav = favoriteModels.includes(b.id);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return 0;
        });

        return (
          <GlassCard key={provider.id} className={`overflow-hidden ${isMain ? 'ring-1 ring-teal-400/20' : ''}`}>
            <button
              onClick={() => setExpanded(isExpanded ? null : provider.id)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              {logo && (
                <img src={logo} alt={provider.name} className="w-6 h-6 rounded-md" />
              )}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{provider.name}</span>
                  {isMain && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-400/15 text-teal-400 font-medium">Main</span>
                  )}
                </div>
                <div className="text-xs text-white/30">
                  {provider.syncedModels.length > 0
                    ? `${provider.syncedModels.length} models · ${provider.modelsLastSynced ? new Date(provider.modelsLastSynced).toLocaleDateString() : ''}`
                    : provider.enabled ? 'Not synced' : 'Inactive'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {provider.enabled && (
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white/30" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/30" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {provider.id !== 'ollama' && provider.id !== 'llamacpp' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-white/40">API Key</label>
                        <div className="relative">
                          <input
                            type={showKey[provider.id] ? 'text' : 'password'}
                            value={draftKeys[provider.id] || ''}
                            onChange={(e) => setDraftKeys((s) => ({ ...s, [provider.id]: e.target.value }))}
                            onBlur={() => handleKeySave(provider)}
                            placeholder={provider.id === 'openrouter' ? 'sk-or-...' : 'sk-...'}
                            className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium
                                       bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              onClick={() => setShowKey((s) => ({ ...s, [provider.id]: !s[provider.id] }))}
                              className="p-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                            >
                              {showKey[provider.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {draftKeys[provider.id] !== provider.apiKey && (
                              <button
                                onClick={() => handleKeySave(provider)}
                                className="px-2 py-0.5 rounded-md bg-teal-400/15 text-teal-400 text-xs font-medium cursor-pointer hover:bg-teal-400/25 transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        </div>
                        {provider.id === 'openrouter' && (
                          <p className="text-xs text-white/30">
                            Get key at{' '}
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                              openrouter.ai/keys
                            </a>
                          </p>
                        )}
                        {provider.id === 'openai' && (
                          <p className="text-xs text-white/30">
                            Get key at{' '}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                              platform.openai.com
                            </a>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Editable Base URL */}
                    {provider.id !== 'webllm' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-white/40">Base URL</label>
                        {draftUrls[provider.id] !== provider.defaultBaseUrl && (
                          <button
                            onClick={() => handleUrlReset(provider)}
                            className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          value={draftUrls[provider.id] || ''}
                          onChange={(e) => setDraftUrls((s) => ({ ...s, [provider.id]: e.target.value }))}
                          onBlur={() => handleUrlSave(provider)}
                          className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono
                                     bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
                        />
                        {draftUrls[provider.id] !== provider.baseUrl && (
                          <button
                            onClick={() => handleUrlSave(provider)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-teal-400/15 text-teal-400 text-xs font-medium cursor-pointer hover:bg-teal-400/25 transition-colors"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                    )}

                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => handleTest(provider)}
                        disabled={testing[provider.id]}
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        <Zap className={`w-3.5 h-3.5 ${testing[provider.id] ? 'animate-pulse' : ''}`} />
                        {testing[provider.id] ? 'Testing...' : 'Test'}
                      </GlassButton>

                      <GlassButton
                        onClick={() => handleSync(provider)}
                        disabled={syncing[provider.id]}
                        variant="accent"
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing[provider.id] ? 'animate-spin' : ''}`} />
                        {syncing[provider.id] ? 'Syncing...' : 'Sync Models'}
                      </GlassButton>

                      <GlassButton
                        onClick={() => handleToggle(provider)}
                        size="sm"
                        variant="ghost"
                        className="flex items-center gap-1.5"
                      >
                        {provider.enabled ? (
                          <>
                            <PowerOff className="w-3.5 h-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-3.5 h-3.5 text-teal-400" />
                            <span className="text-teal-400">Activate</span>
                          </>
                        )}
                      </GlassButton>

                      {provider.enabled && !isMain && (
                        <GlassButton
                          onClick={() => setMainProvider(provider.id)}
                          size="sm"
                          variant="ghost"
                          className="flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Set as Main
                        </GlassButton>
                      )}
                    </div>

                    {testResults[provider.id]?.msg && (
                      <div className={`flex items-center gap-2 text-xs ${testResults[provider.id].ok ? 'text-teal-400' : 'text-red-400'}`}>
                        {testResults[provider.id].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {testResults[provider.id].msg}
                      </div>
                    )}

                    {syncErrors[provider.id] && (
                      <p className="text-red-400 text-xs">{syncErrors[provider.id]}</p>
                    )}

                    {provider.syncedModels.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-medium text-white/50">
                            Synced Models ({provider.syncedModels.length})
                          </h3>
                          {favoriteModels.length > 0 && (
                            <span className="text-[10px] text-amber-400/60">
                              {favoriteModels.length} starred
                            </span>
                          )}
                        </div>

                        {/* Model search */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                          <input
                            type="text"
                            value={modelSearch[provider.id] || ''}
                            onChange={(e) => setModelSearch((s) => ({ ...s, [provider.id]: e.target.value }))}
                            placeholder="Search models..."
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/5 outline-none text-white placeholder-white/20 focus:border-white/10 transition-colors"
                          />
                          {modelSearch[provider.id] && (
                            <button
                              onClick={() => setModelSearch((s) => ({ ...s, [provider.id]: '' }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Model list with favorites */}
                        <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-xl bg-white/5 p-2">
                          {sortedModels.length === 0 && (
                            <p className="text-[10px] text-white/20 text-center py-2">No models match</p>
                          )}
                          {sortedModels.map((m) => {
                            const isFav = favoriteModels.includes(m.id);
                            return (
                              <div key={m.id} className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleFavoriteModel(provider.id, m.id)}
                                    className={`shrink-0 transition-colors cursor-pointer ${isFav ? 'text-amber-400' : 'text-white/15 hover:text-amber-400/50'}`}
                                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Star className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} />
                                  </button>
                                  <span className={`text-xs font-medium truncate ${isFav ? 'text-white/90' : 'text-white/70'}`}>{m.name}</span>
                                </div>
                                {m.contextLength > 0 && (
                                  <span className="text-[10px] text-white/20 shrink-0 ml-2">{m.contextLength.toLocaleString()} ctx</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {provider.modelsLastSynced && (
                      <p className="text-xs text-white/20">
                        Last synced: {new Date(provider.modelsLastSynced).toLocaleString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        );
      })}

      <ConfirmModal
        isOpen={confirmKey !== null}
        onClose={() => setConfirmKey(null)}
        onConfirm={confirmKeySave}
        title="Update API Key?"
        message={`This will clear synced models for ${providers.find((p) => p.id === confirmKey)?.name || ''}. You'll need to re-sync after updating.`}
        confirmLabel="Update Key"
      />
    </div>
  );
}

function WallpaperOption({ wp, isSelected, onSelect }: { wp: typeof WALLPAPERS[0]; isSelected: boolean; onSelect: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <button
        onClick={onSelect}
        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
          isSelected
            ? 'border-teal-400 ring-1 ring-teal-400/30'
            : 'border-white/5 hover:border-white/20'
        }`}
      >
        {isVisible && (
          <>
            {wp.type === 'video' ? (
              <video
                src={wp.url}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                muted
                preload="metadata"
                onLoadedData={(e) => {
                  e.currentTarget.currentTime = 0.1;
                  setIsLoaded(true);
                }}
              />
            ) : (
              <img
                src={wp.url}
                alt={wp.label}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
              />
            )}
            {!isLoaded && (
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}
          </>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
          <span className="text-xs text-white/80 px-2 py-1 font-medium">{wp.label}</span>
        </div>
        {isSelected && (
          <div className="absolute top-1.5 right-1.5">
            <Check className="w-4 h-4 text-teal-400 drop-shadow-lg" />
          </div>
        )}
      </button>
    </div>
  );
}

function WallpaperTab() {
  const { wallpaper, setWallpaper } = useSettingsStore();

  return (
    <div className="grid grid-cols-4 gap-2">
      {WALLPAPERS.map((wp) => (
        <WallpaperOption
          key={wp.id}
          wp={wp}
          isSelected={wallpaper === wp.url}
          onSelect={() => setWallpaper(wp.url)}
        />
      ))}
    </div>
  );
}

function ResearchTab() {
  const { tavilyApiKey, setTavilyApiKey } = useSettingsStore();
  const [draftKey, setDraftKey] = useState(tavilyApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  useEffect(() => {
    setDraftKey(tavilyApiKey);
    setTestResult(null);
  }, [tavilyApiKey]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testTavilyConnection(draftKey.trim());
    setTestResult({ ok: result.ok, msg: result.ok ? 'Connected!' : result.error || 'Failed' });
    setTesting(false);
  };

  const handleSave = () => {
    if (draftKey.trim() !== tavilyApiKey) {
      setConfirmUpdate(true);
    }
  };

  const confirmSave = () => {
    setTavilyApiKey(draftKey.trim());
    setConfirmUpdate(false);
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-400/60" />
          <h3 className="text-sm font-medium text-white/70">Tavily API Key</h3>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Required for Deep Research. Enables web search with AI-optimized results.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={draftKey}
              onChange={(e) => { setDraftKey(e.target.value); setTestResult(null); }}
              placeholder="tvly-..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white/80 placeholder-white/20 outline-none focus:border-teal-400/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={handleTest}
            disabled={testing || !draftKey.trim()}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-pulse' : ''}`} />
            {testing ? 'Testing...' : 'Test'}
          </GlassButton>
          <GlassButton onClick={handleSave} disabled={draftKey.trim() === tavilyApiKey}>
            Save
          </GlassButton>
          {tavilyApiKey && !testResult && (
            <span className="text-[10px] text-teal-400/40">Key configured</span>
          )}
        </div>
        {testResult?.msg && (
          <div className={`flex items-center gap-2 text-xs ${testResult.ok ? 'text-teal-400' : 'text-red-400'}`}>
            {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {testResult.msg}
          </div>
        )}
        <a
          href="https://tavily.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
        >
          Get a free API key at tavily.com <ExternalLink className="w-3 h-3" />
        </a>
      </GlassCard>

      <ConfirmModal
        isOpen={confirmUpdate}
        onClose={() => setConfirmUpdate(false)}
        onConfirm={confirmSave}
        title="Update Tavily API Key?"
        message="This will replace your current Tavily API key used for Deep Research."
        confirmLabel="Update Key"
      />
    </div>
  );
}

function EmailTab() {
  const { accounts, addAccount: addAccountToStore, removeAccount, serverUrl, setServerUrl } = useEmailStore();
  const [draftServerUrl, setDraftServerUrl] = useState(serverUrl);
  const [testingServer, setTestingServer] = useState(false);
  const [serverResult, setServerResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({
    name: '', email: '',
    imapHost: 'imap.gmail.com', imapPort: 993, imapSecure: true,
    smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false,
    username: '', password: '',
  });
  const [testingImap, setTestingImap] = useState(false);
  const [imapResult, setImapResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleTestServer = async () => {
    setTestingServer(true);
    setServerResult(null);
    try {
      const res = await fetch(`${draftServerUrl}/api/health`);
      const data = await res.json();
      setServerResult({ ok: data.ok, msg: data.ok ? 'Server connected!' : 'Server error' });
    } catch {
      setServerResult({ ok: false, msg: 'Cannot reach server' });
    }
    setTestingServer(false);
  };

  const handleSaveServerUrl = () => {
    setServerUrl(draftServerUrl.trim());
  };

  const handleTestImap = async () => {
    setTestingImap(true);
    setImapResult(null);
    try {
      const result = await testImapConnection({
        imapHost: draft.imapHost,
        imapPort: draft.imapPort,
        imapSecure: draft.imapSecure,
        username: draft.username,
        password: draft.password,
      });
      setImapResult({ ok: result.ok, msg: result.ok ? 'Connected!' : result.error || 'Failed' });
    } catch (err) {
      setImapResult({ ok: false, msg: err instanceof Error ? err.message : 'Connection failed' });
    }
    setTestingImap(false);
  };

  const handleAddAccount = async () => {
    try {
      const result = await addAccount(draft);
      addAccountToStore({ ...draft, id: result.id });
      setShowAdd(false);
      setDraft({
        name: '', email: '',
        imapHost: 'imap.gmail.com', imapPort: 993, imapSecure: true,
        smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false,
        username: '', password: '',
      });
    } catch (err) {
      console.error('[email] Failed to add account:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Server URL */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-teal-400/60" />
          <h3 className="text-sm font-medium text-white/70">Companion Server</h3>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          URL of the chpio-server that handles IMAP/SMTP connections.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40">Server URL</label>
          <input
            type="text"
            value={draftServerUrl}
            onChange={(e) => setDraftServerUrl(e.target.value)}
            placeholder="http://localhost:3001"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-teal-400/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={handleTestServer} disabled={testingServer || !draftServerUrl.trim()} size="sm" className="flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${testingServer ? 'animate-pulse' : ''}`} />
            {testingServer ? 'Testing...' : 'Test'}
          </GlassButton>
          <GlassButton onClick={handleSaveServerUrl} disabled={draftServerUrl.trim() === serverUrl} size="sm">
            Save
          </GlassButton>
        </div>
        {serverResult?.msg && (
          <div className={`flex items-center gap-2 text-xs ${serverResult.ok ? 'text-teal-400' : 'text-red-400'}`}>
            {serverResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {serverResult.msg}
          </div>
        )}
      </GlassCard>

      {/* Accounts */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/70">Email Accounts</h3>
          <GlassButton onClick={() => setShowAdd(!showAdd)} size="sm">
            {showAdd ? 'Cancel' : '+ Add Account'}
          </GlassButton>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-1">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                <Mail className="w-3.5 h-3.5 text-white/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/60 truncate">{acc.name || acc.email}</p>
                  <p className="text-[9px] text-white/20 truncate">{acc.email}</p>
                </div>
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="p-1 rounded text-white/10 hover:text-red-400/60 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {accounts.length === 0 && !showAdd && (
          <p className="text-[11px] text-white/20">No accounts configured</p>
        )}

        {showAdd && (
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Display Name</label>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Email</label>
                <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="you@gmail.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
              </div>
            </div>

            <p className="text-[10px] text-white/30 font-medium">IMAP Settings</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-white/30">Host</label>
                <input value={draft.imapHost} onChange={(e) => setDraft({ ...draft, imapHost: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Port</label>
                <input type="number" value={draft.imapPort} onChange={(e) => setDraft({ ...draft, imapPort: parseInt(e.target.value) || 993 })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 outline-none focus:border-teal-400/30" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-white/30 cursor-pointer">
              <input type="checkbox" checked={draft.imapSecure} onChange={(e) => setDraft({ ...draft, imapSecure: e.target.checked })} className="accent-teal-400" />
              SSL/TLS
            </label>

            <p className="text-[10px] text-white/30 font-medium">SMTP Settings</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-white/30">Host</label>
                <input value={draft.smtpHost} onChange={(e) => setDraft({ ...draft, smtpHost: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Port</label>
                <input type="number" value={draft.smtpPort} onChange={(e) => setDraft({ ...draft, smtpPort: parseInt(e.target.value) || 587 })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 outline-none focus:border-teal-400/30" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-white/30 cursor-pointer">
              <input type="checkbox" checked={draft.smtpSecure} onChange={(e) => setDraft({ ...draft, smtpSecure: e.target.checked })} className="accent-teal-400" />
              STARTTLS
            </label>

            <p className="text-[10px] text-white/30 font-medium">Credentials</p>
            <div className="space-y-1">
              <label className="text-[10px] text-white/30">Username</label>
              <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="you@gmail.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/30">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="App password" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 pr-8 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-teal-400/30" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 cursor-pointer">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GlassButton onClick={handleTestImap} disabled={testingImap || !draft.username || !draft.password} size="sm" className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${testingImap ? 'animate-pulse' : ''}`} />
                {testingImap ? 'Testing...' : 'Test Connection'}
              </GlassButton>
              <GlassButton onClick={handleAddAccount} disabled={!draft.email || !draft.username || !draft.password} size="sm">
                Add Account
              </GlassButton>
            </div>
            {imapResult?.msg && (
              <div className={`flex items-center gap-2 text-xs ${imapResult.ok ? 'text-teal-400' : 'text-red-400'}`}>
                {imapResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {imapResult.msg}
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
