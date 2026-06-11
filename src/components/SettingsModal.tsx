import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Zap, Power, PowerOff,
  Check, Settings as SettingsIcon, Palette, Server, CheckCircle2, XCircle,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { Modal } from './ui/Modal';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { ConfirmModal } from './ui/ConfirmModal';
import { PortalDropdown } from './ui/PortalDropdown';
import { testConnection, fetchProviderModels } from '../services/providers';
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

type Tab = 'providers' | 'defaultModel' | 'wallpaper';

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('providers');

  const tabs: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'providers', label: 'Providers', icon: Server },
    { id: 'defaultModel', label: 'Default Model', icon: SettingsIcon },
    { id: 'wallpaper', label: 'Wallpaper', icon: Palette },
  ];

  return (
    <Modal
      isOpen={settingsModalOpen}
      onClose={() => setSettingsModalOpen(false)}
      title="Settings"
      className="max-w-2xl h-[520px] overflow-hidden flex flex-col"
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
  const { providers, setProviderKey, setProviderEnabled, setProviderModels, setProviderSynced } = useSettingsStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [draftKeys, setDraftKeys] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  useEffect(() => {
    const keys: Record<string, string> = {};
    providers.forEach((p) => { keys[p.id] = p.apiKey; });
    setDraftKeys(keys);
  }, [providers]);

  const handleTest = async (provider: ProviderConfig) => {
    setTesting((s) => ({ ...s, [provider.id]: true }));
    setTestResults((s) => ({ ...s, [provider.id]: { ok: false, msg: '' } }));
    const result = await testConnection(provider.baseUrl, provider.apiKey || undefined, provider.id);
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
      const models = await fetchProviderModels(provider.baseUrl, provider.apiKey || undefined, provider.id);
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

  const handleToggle = (provider: ProviderConfig) => {
    if (!provider.enabled) {
      providers.forEach((p) => {
        if (p.id !== provider.id && p.enabled) setProviderEnabled(p.id, false);
      });
      setProviderEnabled(provider.id, true);
    }
  };

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const isExpanded = expanded === provider.id;
        const logo = PROVIDER_LOGOS[provider.id];

        return (
          <GlassCard key={provider.id} className="overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : provider.id)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              {logo && (
                <img src={logo} alt={provider.name} className="w-6 h-6 rounded-md" />
              )}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">{provider.name}</div>
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/40">Base URL</label>
                      <input
                        value={provider.baseUrl}
                        readOnly
                        className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-mono
                                   bg-white/5 border-white/10 text-white/50"
                      />
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
                        <h3 className="text-xs font-medium text-white/50">
                          Synced Models ({provider.syncedModels.length})
                        </h3>
                        <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl bg-white/5 p-2">
                          {provider.syncedModels.map((m) => (
                            <div key={m.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs">
                              <span className="text-white/70 font-medium truncate">{m.name}</span>
                              {m.contextLength > 0 && (
                                <span className="text-white/20 shrink-0 ml-2">{m.contextLength.toLocaleString()} ctx</span>
                              )}
                            </div>
                          ))}
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

function WallpaperTab() {
  const { wallpaper, setWallpaper } = useSettingsStore();
  const [customUrl, setCustomUrl] = useState('');

  const handleCustomApply = () => {
    if (customUrl.trim()) {
      setWallpaper(customUrl.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {WALLPAPERS.map((wp) => (
          <button
            key={wp.id}
            onClick={() => setWallpaper(wp.url)}
            className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
              wallpaper === wp.url
                ? 'border-teal-400 ring-1 ring-teal-400/30'
                : 'border-white/5 hover:border-white/20'
            }`}
          >
            <img src={wp.url} alt={wp.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
              <span className="text-xs text-white/80 px-2 py-1 font-medium">{wp.label}</span>
            </div>
            {wallpaper === wp.url && (
              <div className="absolute top-1.5 right-1.5">
                <Check className="w-4 h-4 text-teal-400 drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>

      <GlassCard className="p-4 space-y-2">
        <h2 className="text-xs font-medium text-white/70 uppercase tracking-wider">Custom URL</h2>
        <div className="flex gap-2">
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-3 py-2 rounded-xl border outline-none text-sm font-medium
                       bg-white/5 border-white/10 text-white/80 placeholder-white/20 focus:border-teal-400/50 transition-all"
          />
          <GlassButton onClick={handleCustomApply} variant="accent" size="sm">
            Apply
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
