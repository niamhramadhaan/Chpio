import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Globe, Code2, Brain, ArrowUp, ChevronDown, Search, X, Square } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import { PortalDropdown } from './ui/PortalDropdown';

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

const LOTTIE_URL = 'https://lottie.host/3bd7f01f-14d7-4c9b-86a2-5024f6cb44f3/eUurreIWqI.lottie';

export function CommandBar() {
  const { view, setView, setActiveFeature } = useAppStore();
  const { createSession, addMessage, updateLastAssistantMessage, updateLastAssistantThinking, setStreaming, stopStreaming, isStreaming } = useChatStore();
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const { defaultModelId, providers } = useSettingsStore();
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);

  const models = useMemo(() => getActiveModels(providers), [providers]);

  const [input, setInput] = useState('');
  const [showModels, setShowModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [toggles, setToggles] = useState({ web: false, code: false, think: false });
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const activeModelId = selectedModelId || defaultModelId;
  const activeModel = models.find((m) => m.id === activeModelId);
  const isHero = view === 'onboarding';
  const isArchived = sessions.find((s) => s.id === activeSessionId)?.archived ?? false;

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

    const sessionId = useChatStore.getState().activeSessionId || createSession(modelId);

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
      timestamp: Date.now(),
    };
    addMessage(sessionId, assistantMsg);
    setStreaming(true);
    const controller = new AbortController();
    useChatStore.setState({ abortController: controller });

    try {
      const providerId = activeModel?.providerId;
      const provider = providers.find((p) => p.id === providerId);
      const baseUrl = provider?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = provider?.apiKey || undefined;

      const chatMessages = useChatStore
        .getState()
        .getActiveSession()
        ?.messages.filter((m) => m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })) || [];

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(modelId), chatMessages, providerId, controller.signal, toggles.think);
      let accumulated = '';
      let thinkingAccum = '';

      for await (const chunk of stream) {
        if (chunk.type === 'thinking') {
          thinkingAccum += chunk.text;
        } else {
          accumulated += chunk.text;
          updateLastAssistantMessage(sessionId, accumulated);
        }
      }
      if (thinkingAccum) {
        updateLastAssistantThinking(sessionId, thinkingAccum);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const errorContent = `Error: ${parseChatError(e)}`;
      updateLastAssistantMessage(sessionId, errorContent);
    } finally {
      setStreaming(false);
    }
  };

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

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const toggleButton = (key: keyof typeof toggles, icon: typeof Globe, label: string) => (
    <button
      key={key}
      onClick={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
        toggles[key]
          ? 'bg-teal-400/15 text-teal-400 border border-teal-400/30'
          : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
      }`}
      title={label}
    >
      {(() => { const I = icon; return <I className="w-3.5 h-3.5" />; })()}
      {isHero && <span>{label}</span>}
    </button>
  );

  return (
    <motion.div
      layout
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`
        w-full glass rounded-2xl shadow-2xl overflow-hidden
        ${isHero ? 'max-w-2xl' : 'max-w-4xl'}
      `}
    >
      <div className="p-4">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <Paperclip className="w-3 h-3 text-white/30 shrink-0" />
            <span className="text-[11px] text-white/50 truncate flex-1">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-white/30 hover:text-white/60 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-7 h-7 shrink-0"
            whileHover={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <DotLottieReact
              src={LOTTIE_URL}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all cursor-pointer border border-white/5"
            >
              {activeModel ? (
                <span className="truncate max-w-[120px]">{activeModel.name}</span>
              ) : (
                <span>Select Model</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModels ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-3 pt-0">
        <div className="flex items-center gap-1.5">
          {toggleButton('web', Globe, 'Web')}
          {toggleButton('code', Code2, 'Code')}
          {toggleButton('think', Brain, 'Think')}

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.onchange = () => {
                const file = fileInput.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setAttachedFile({ name: file.name, text: reader.result as string });
                };
                reader.readAsText(file);
              };
              fileInput.click();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer border border-transparent"
            title="Attach file"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {isHero && <span>Attach</span>}
          </button>
        </div>

        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer"
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
