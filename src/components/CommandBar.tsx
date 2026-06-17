import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Paperclip, Brain, ArrowUp, ChevronDown, Search, X, Square, BookOpen, Check, Database } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDocsStore } from '../store/docsStore';
import { useMemoryStore } from '../store/memoryStore';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix, getModelProvider } from '../utils/models';
import { buildDocContextSystemMessage } from '../utils/docContext';
import { parseDocUpdates, executeDocUpdates, stripDocUpdates, formatDocUpdateSummary } from '../utils/parseDocUpdates';
import { buildMemoryContextSystemMessage } from '../utils/memoryContext';
import { PortalDropdown } from './ui/PortalDropdown';

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

function parseChatError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Failed to get response';
  if (msg.includes('401')) return 'Invalid API key. Check your key in Settings → Providers.';
  if (msg.includes('403')) return 'Access denied. Your API key may not have permission for this model.';
  if (msg.includes('429')) return 'Rate limit exceeded. Try again shortly or switch models.';
  if (msg.includes('402')) return 'Payment required. Add credits to your provider account.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed'))
    return 'Could not reach provider. Check your connection.';
  return msg;
}

export function CommandBar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const createSession = useChatStore((s) => s.createSession);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage);
  const updateLastAssistantThinking = useChatStore((s) => s.updateLastAssistantThinking);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isArchived = useChatStore((s) => {
    const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
    return session?.archived ?? false;
  });
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const fallbackModelId = useSettingsStore((s) => s.fallbackModelId);
  const providers = useSettingsStore((s) => s.providers);
  const mainProviderId = useSettingsStore((s) => s.mainProviderId);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);

  const models = useMemo(() => getActiveModels(providers), [providers]);

  const [input, setInput] = useState('');
  const [showModels, setShowModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [toggles, setToggles] = useState({ think: false, memory: true });
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const providerTriggerRef = useRef<HTMLDivElement>(null);
  const docPickerRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const docs = useDocsStore((s) => s.docs);
  const memories = useMemoryStore((s) => s.memories);
  const activeTag = useMemoryStore((s) => s.activeTag);
  const activeSession = useChatStore((s) => s.sessions.find((sess) => sess.id === s.activeSessionId));
  const attachedDocIds = activeSession?.attachedDocIds ?? [];
  const setAttachedDocs = useChatStore((s) => s.setAttachedDocs);
  const attachedDocs = useMemo(() => docs.filter((d) => attachedDocIds.includes(d.id)), [docs, attachedDocIds]);

  const mainProviderFirstModel = useMemo(() => {
    const mainProvider = providers.find((p) => p.id === mainProviderId && p.enabled && p.syncedModels.length > 0);
    return mainProvider ? `${mainProvider.id}/${mainProvider.syncedModels[0].id}` : '';
  }, [providers, mainProviderId]);

  const activeModelId = selectedModelId || defaultModelId || mainProviderFirstModel;
  const activeModel = models.find((m) => m.id === activeModelId);
  const activeProviderId = activeModel ? getModelProvider(activeModel.id) : null;
  const activeProviderLogo = activeProviderId ? PROVIDER_LOGOS[activeProviderId] : null;
  const activeProviderName = activeProviderId ? providers.find((p) => p.id === activeProviderId)?.name : null;
  const isHero = view === 'onboarding';

  const toggleDocAttach = (docId: string) => {
    if (!activeSession) return;
    const next = attachedDocIds.includes(docId)
      ? attachedDocIds.filter((id) => id !== docId)
      : [...attachedDocIds, docId];
    setAttachedDocs(activeSession.id, next);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming || isArchived) return;

    const message = input.trim();
    const fileContext = attachedFile ? `\n\n[Attached: ${attachedFile.name}]\n${attachedFile.text}` : '';
    setInput('');
    setAttachedFile(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    if (isHero) {
      setView('workspace');
      setActiveFeature('chat');
    }

    const modelId = activeModelId;
    if (!modelId) return;

    const sessionId = isHero ? createSession(modelId) : (useChatStore.getState().activeSessionId || createSession(modelId));

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message + fileContext,
      timestamp: Date.now(),
    };
    addMessage(sessionId, userMsg);

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      modelId: modelId,
      timestamp: Date.now(),
    };
    addMessage(sessionId, assistantMsg);
    setStreaming(true);
    const controller = new AbortController();
    useChatStore.setState({ abortController: controller });

    const doStream = async (mId: string) => {
      const m = models.find((x) => x.id === mId);
      const pId = m?.providerId;
      const p = providers.find((x) => x.id === pId);
      const baseUrl = p?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = p?.apiKey || undefined;

      const session = useChatStore.getState().sessions.find((s) => s.id === sessionId);
      const sessionDocs = docs.filter((d) => session?.attachedDocIds?.includes(d.id));
      const docSystemMsg = buildDocContextSystemMessage(sessionDocs);
      const memorySystemMsg = toggles.memory ? buildMemoryContextSystemMessage(activeTag ? memories.filter(m => m.tags.includes(activeTag)) : memories) : null;

      const chatMessages = useChatStore
        .getState()
        .getActiveSession()
        ?.messages.filter((msg) => msg.content)
        .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })) || [];

      const combinedSystem = [memorySystemMsg, docSystemMsg].filter(Boolean).join('\n\n');
      const messages = combinedSystem
        ? [{ role: 'system' as const, content: combinedSystem }, ...chatMessages]
        : chatMessages;

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), messages, pId, controller.signal, toggles.think);
      let accumulated = '';
      let thinkingAccum = '';
      let rafId: number | null = null;

      const scheduleFlush = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateLastAssistantMessage(sessionId, accumulated);
        });
      };

      for await (const chunk of stream) {
        if (chunk.type === 'thinking') {
          thinkingAccum += chunk.text;
        } else {
          accumulated += chunk.text;
          scheduleFlush();
        }
      }
      if (rafId !== null) cancelAnimationFrame(rafId);

      // Parse and execute doc updates
      const updates = parseDocUpdates(accumulated);
      const results = executeDocUpdates(updates);
      const summary = formatDocUpdateSummary(results);
      if (summary) {
        accumulated = stripDocUpdates(accumulated) + '\n\n> ' + summary;
      }

      updateLastAssistantMessage(sessionId, accumulated);
      if (thinkingAccum) {
        updateLastAssistantThinking(sessionId, thinkingAccum);
      }
    };

    try {
      await doStream(modelId);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (fallbackModelId && fallbackModelId !== modelId) {
        try {
          await doStream(fallbackModelId);
        } catch (e2) {
          if (e2 instanceof DOMException && e2.name === 'AbortError') return;
          updateLastAssistantMessage(sessionId, `Error: ${parseChatError(e2)}`);
        }
      } else {
        updateLastAssistantMessage(sessionId, `Error: ${parseChatError(e)}`);
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({ name: file.name, text: reader.result as string });
    };
    reader.readAsText(file);
  };

  const handleFilePicker = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.yaml,.yml,.toml,.xml,.log,.env,.sh,.rb,.go,.rs,.java,.c,.cpp,.h';
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      readFile(file);
    };
    fileInput.click();
  };

  useEffect(() => {
    if (!isStreaming && !isArchived) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isStreaming, isArchived]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const filteredModels = useMemo(() => {
    const providerModels = activeProviderId
      ? models.filter((m) => m.providerId === activeProviderId)
      : models;
    if (!modelSearch) return providerModels;
    const search = modelSearch.toLowerCase();
    return providerModels.filter((m) =>
      m.name.toLowerCase().includes(search) || m.id.toLowerCase().includes(search)
    );
  }, [models, activeProviderId, modelSearch]);

  const toggleButton = (key: keyof typeof toggles, icon: typeof Brain, label: string) => (
    <button
      key={key}
      onClick={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
        toggles[key]
          ? 'bg-teal-400/15 text-teal-400 border border-teal-400/30'
          : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
      }`}
      title={label}
      aria-label={label}
      aria-pressed={toggles[key]}
    >
      {(() => { const I = icon; return <I className="w-3.5 h-3.5" />; })()}
      {isHero && <span>{label}</span>}
    </button>
  );

  return (
    <motion.div
      layout
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        w-full glass rounded-2xl shadow-2xl overflow-hidden relative
        ${isHero ? 'max-w-2xl' : 'max-w-4xl'}
      `}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-teal-400/10 border-2 border-dashed border-teal-400/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-6 h-6 text-teal-400/60 mx-auto mb-1" />
            <p className="text-xs text-teal-400/60">Drop file to attach</p>
          </div>
        </div>
      )}
      <div className="p-3 sm:p-4">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Paperclip className="w-3 h-3 text-white/30 shrink-0" />
            <span className="text-[11px] text-white/50 truncate flex-1">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-white/30 hover:text-white/60 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {attachedDocs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-400/10 border border-teal-400/20">
                <BookOpen className="w-3 h-3 text-teal-400/60 shrink-0" />
                <span className="text-[11px] text-teal-400/70 truncate max-w-[120px]">{doc.title}</span>
                <button onClick={() => toggleDocAttach(doc.id)} className="text-teal-400/40 hover:text-teal-400/70 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <div ref={providerTriggerRef} className="relative">
            <motion.button
              className="w-7 h-7 shrink-0 rounded-md overflow-hidden cursor-pointer flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              onClick={() => setShowProviderSelector(!showProviderSelector)}
              title={activeProviderName ? `${activeProviderName} — click to switch` : 'Select provider'}
            >
              {activeProviderLogo ? (
                <img
                  src={activeProviderLogo}
                  alt={activeProviderName || 'Provider'}
                  className="w-5 h-5"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[8px] text-white/30 font-bold">?</div>
              )}
            </motion.button>
          </div>

          <PortalDropdown
            isOpen={showProviderSelector}
            triggerRef={providerTriggerRef}
            align="left"
            direction="up"
            onClose={() => setShowProviderSelector(false)}
            className="glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-2">
              <p className="px-1 pb-1.5 text-[9px] text-white/30 font-medium">Provider</p>
              <div className="flex items-center gap-1">
                {providers.filter((p) => p.enabled && p.apiKey).map((provider) => {
                  const logo = PROVIDER_LOGOS[provider.id];
                  const providerModels = provider.syncedModels || [];
                  const isActive = activeProviderId === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => {
                        if (providerModels.length > 0) {
                          const firstModel = providerModels[0];
                          setSelectedModel(`${provider.id}/${firstModel.id}`);
                        }
                        setShowProviderSelector(false);
                      }}
                      title={provider.name}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? 'bg-teal-400/15 border border-teal-400/25'
                          : 'text-white/60 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {logo ? (
                        <img src={logo} alt={provider.name} className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-white/10" />
                      )}
                    </button>
                  );
                })}
              </div>
              {providers.filter((p) => p.enabled && p.apiKey).length === 0 && (
                <p className="px-1 py-2 text-[10px] text-white/20 text-center">No providers</p>
              )}
            </div>
          </PortalDropdown>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isArchived ? 'Archived conversation' : 'Ask anything...'}
            rows={1}
            className={`flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base resize-none min-h-[28px] max-h-[120px] leading-normal ${isArchived ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={isStreaming || isArchived}
          />

          <div ref={triggerRef}>
            <button
              onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all cursor-pointer border border-white/5"
            >
              {activeModel ? (
                <span className="truncate max-w-[60px] sm:max-w-[120px]">{activeModel.name}</span>
              ) : (
                <span className="hidden sm:inline">Select Model</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModels ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 sm:px-4 pb-2 sm:pb-3 pt-0">
        <div className="flex items-center gap-1.5">
          {toggleButton('think', Brain, 'Think')}
          {toggleButton('memory', Database, 'Memory')}

          {(toggles.memory && memories.length > 0) && (
            <span className="text-[9px] text-white/20 ml-0.5">{memories.length}</span>
          )}

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={handleFilePicker}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer border border-transparent"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {isHero && <span>Attach</span>}
          </button>

          <div ref={docPickerRef}>
            <button
              onClick={() => setShowDocPicker(!showDocPicker)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border border-transparent ${
                attachedDocIds.length > 0
                  ? 'text-teal-400/70 hover:text-teal-400 bg-teal-400/5'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
              title="Attach docs for AI context"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {attachedDocIds.length > 0 && (
                <span className="text-[10px]">{attachedDocIds.length}</span>
              )}
              {isHero && <span>Docs</span>}
            </button>
          </div>

          <PortalDropdown
            isOpen={showDocPicker}
            triggerRef={docPickerRef}
            align="left"
            direction="up"
            onClose={() => setShowDocPicker(false)}
            className="w-56 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/5">
              <p className="text-[9px] text-white/30 font-medium px-1">Attach docs as AI context</p>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {docs.length === 0 ? (
                <p className="text-[10px] text-white/20 text-center py-4">No docs yet</p>
              ) : (
                docs.map((doc) => {
                  const isSelected = attachedDocIds.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocAttach(doc.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-400/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-teal-400/20 border-teal-400/40' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-teal-400" />}
                      </div>
                      <span className="text-[11px] text-white/70 truncate">{doc.title || 'Untitled'}</span>
                    </button>
                  );
                })
              )}
            </div>
            {docs.length > 0 && (
              <div className="p-1.5 border-t border-white/5">
                <p className="text-[9px] text-white/20 px-1">
                  {attachedDocIds.length === 0 ? 'Select docs for AI to read' : `${attachedDocIds.length} doc${attachedDocIds.length > 1 ? 's' : ''} attached`}
                </p>
              </div>
            )}
          </PortalDropdown>
        </div>

        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer"
            aria-label="Stop streaming"
          >
            <Square className="w-3.5 h-3.5" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || !activeModelId || isArchived}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              input.trim() && activeModelId && !isArchived
                ? 'bg-teal-400 text-black hover:bg-teal-300'
                : 'bg-white/10 text-white/30'
            } disabled:cursor-not-allowed`}
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      <PortalDropdown
        isOpen={showModels}
        triggerRef={triggerRef}
        align="right"
        direction="up"
        onClose={() => setShowModels(false)}
        className="w-80 max-h-72 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-2 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search models..."
              className="bg-transparent outline-none text-white text-xs flex-1 placeholder-white/30"
              autoFocus
            />
            {modelSearch && (
              <button onClick={() => setModelSearch('')} className="text-white/30 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-52 p-1">
          {filteredModels.length === 0 && (
            <div className="text-center text-white/20 text-xs py-6">
              {models.length === 0 ? 'No models synced. Go to Settings → Providers.' : 'No matches'}
            </div>
          )}
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setShowModels(false);
                setModelSearch('');
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                activeModelId === model.id
                  ? 'bg-teal-400/15 text-teal-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="font-medium truncate">
                <span className="text-white/30">{model.providerId}/</span>{model.name}
              </div>
              <div className="text-white/20 mt-0.5">
                {model.contextLength.toLocaleString()} ctx
              </div>
            </button>
          ))}
        </div>
      </PortalDropdown>
    </motion.div>
  );
}
