import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Zap, Power, PowerOff,
  Check, Settings as SettingsIcon, Palette, Server, CheckCircle2, XCircle, Star,
  Search, RotateCcw, X, ExternalLink,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { Modal } from './ui/Modal';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { ConfirmModal } from './ui/ConfirmModal';
import { PortalDropdown } from './ui/PortalDropdown';
import { testConnection, fetchProviderModels } from '../services/providers';
import { testTavilyConnection } from '../services/tavily';
import { WALLPAPERS } from '../types';
import { getActiveModels } from '../utils/models';
import type { ProviderConfig } from '../types';

const PROVIDER_LOGOS: Record<string, string> = {
  openrouter: 'https://cdn.simpleicons.org/openrouter',
  openai: 'https://cdn.simpleicons.org/openai',
  copilot: 'https://cdn.simpleicons.org/github',
  ollama: 'https://cdn.simpleicons.org/ollama',
  llamacpp: 'https://cdn.simpleicons.org/cplusplus',
  google: 'https://cdn.simpleicons.org/google',
  deepseek: 'https://cdn.simpleicons.org/deepseek',
  groq: 'https://cdn.simpleicons.org/groq',
  mistral: 'https://cdn.simpleicons.org/mistral',
  together: 'https://cdn.simpleicons.org/together',
  fireworks: 'https://cdn.simpleicons.org/fireworks',
};

type Tab = 'providers' | 'defaultModel' | 'wallpaper' | 'research';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('providers');

  const tabs: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'providers', label: 'Providers', icon: Server },
    { id: 'defaultModel', label: 'Default Model', icon: SettingsIcon },
    { id: 'wallpaper', label: 'Wallpaper', icon: Palette },
    { id: 'research', label: 'Research', icon: Search },
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
          {activeTab === 'defaultModel' && <DefaultModelTab />}
          {activeTab === 'wallpaper' && <WallpaperTab />}
          {activeTab === 'research' && <ResearchTab />}
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

  useEffect(() => {
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
    if (provider.id !== 'ollama' && provider.id !== 'llamacpp' && !provider.apiKey) {
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
    if (newEnabled && (provider.id === 'ollama' || provider.id === 'llamacpp' || provider.apiKey)) {
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
    return [...providers].sort((a, b) => {
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
