import React, { useRef, useEffect, useState, useCallback, useMemo, Suspense, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Lightbulb,
  Code2,
  Pen,
  Search,
  Brain,
  Archive,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { useProjectStore } from '../store/projectStore';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import chpioAvatar from '../assets/chpio-avatar.json';

const LazyCodeBlock = React.lazy(() => import('../components/CodeBlock'));

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

const suggestedPrompts = [
  { icon: Lightbulb, text: 'Explain quantum computing simply' },
  { icon: Code2, text: 'Write a Python fibonacci function' },
  { icon: Pen, text: 'Help me write a professional email' },
  { icon: Search, text: 'Compare React vs Vue in 2025' },
];

export function ChatPage() {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const streamingSessionId = useChatStore((s) => s.streamingSessionId);
  const session = sessions.find((s) => s.id === activeSessionId);
  const projects = useProjectStore((s) => s.projects);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const createSession = useChatStore((s) => s.createSession);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage);
  const updateLastAssistantThinking = useChatStore((s) => s.updateLastAssistantThinking);
  const replaceSessionMessages = useChatStore((s) => s.replaceSessionMessages);
  const updateSessionTitle = useChatStore((s) => s.updateSessionTitle);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const editMessage = useChatStore((s) => s.editMessage);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const fallbackModelId = useSettingsStore((s) => s.fallbackModelId);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const providers = useSettingsStore((s) => s.providers);
  const mainProviderId = useSettingsStore((s) => s.mainProviderId);

  const models = useMemo(() => getActiveModels(providers), [providers]);

  const mainProviderFirstModel = useMemo(() => {
    const mainProvider = providers.find((p) => p.id === mainProviderId && p.enabled && p.syncedModels.length > 0);
    return mainProvider ? `${mainProvider.id}/${mainProvider.syncedModels[0].id}` : '';
  }, [providers, mainProviderId]);

  const activeModelId = selectedModelId || defaultModelId || mainProviderFirstModel;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const getModelName = useCallback((modelId: string) =>
    models.find((m) => m.id === modelId)?.name || modelId, [models]);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  const scrollContent = isStreaming ? streamingContent : null;

  useEffect(() => {
    if (!isStreaming) return;
    const rafId = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [scrollContent, isStreaming]);

  useEffect(() => {
    if (!isStreaming) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    }
  }, [session?.messages?.length]);

  const handleScroll = () => {
    setShowScrollBtn(!isNearBottom());
  };

  const handlePromptClick = async (text: string) => {
    setView('workspace');
    setActiveFeature('chat');

    const modelId = activeModelId;
    if (!modelId) return;
    const sessionId = useChatStore.getState().activeSessionId || createSession(modelId);

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
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

    const doStream = async (mId: string, msgs: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
      const m = models.find((x) => x.id === mId);
      const p = providers.find((x) => x.id === m?.providerId);
      const baseUrl = p?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = p?.apiKey || undefined;
      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), msgs, m?.providerId, controller.signal);
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
      updateLastAssistantMessage(sessionId, accumulated);
      if (thinkingAccum) updateLastAssistantThinking(sessionId, thinkingAccum);
    };

    try {
      const chatMessages = useChatStore
        .getState()
        .getActiveSession()
        ?.messages.filter((m) => m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })) || [];

      await doStream(modelId, chatMessages);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (fallbackModelId && fallbackModelId !== modelId) {
        try {
          const chatMessages = useChatStore
            .getState()
            .getActiveSession()
            ?.messages.filter((m) => m.content)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })) || [];
          await doStream(fallbackModelId, chatMessages);
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

  const handleRegenerate = useCallback(async (messageIndex: number) => {
    if (!session || isStreaming) return;

    const modelId = selectedModelId || session.modelId || activeModelId;
    if (!modelId) return;
    const messagesBefore = session.messages.slice(0, messageIndex);
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      modelId: modelId,
      timestamp: Date.now(),
    };

    replaceSessionMessages(session.id, [...messagesBefore, assistantMsg]);
    setStreaming(true);
    const controller = new AbortController();
    useChatStore.setState({ abortController: controller });

    const doStream = async (mId: string, msgs: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
      const m = models.find((x) => x.id === mId);
      const p = providers.find((x) => x.id === m?.providerId);
      const baseUrl = p?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = p?.apiKey || undefined;
      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), msgs, m?.providerId, controller.signal);
      let accumulated = '';
      let thinkingAccum = '';
      let rafId: number | null = null;

      const scheduleFlush = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateLastAssistantMessage(session.id, accumulated);
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
      updateLastAssistantMessage(session.id, accumulated);
      if (thinkingAccum) updateLastAssistantThinking(session.id, thinkingAccum);
    };

    try {
      const chatMessages = messagesBefore
        .filter((m) => m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      await doStream(modelId, chatMessages);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (fallbackModelId && fallbackModelId !== modelId) {
        try {
          const chatMessages = messagesBefore
            .filter((m) => m.content)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
          await doStream(fallbackModelId, chatMessages);
        } catch (e2) {
          if (e2 instanceof DOMException && e2.name === 'AbortError') return;
          updateLastAssistantMessage(session.id, `Error: ${parseChatError(e2)}`);
        }
      } else {
        updateLastAssistantMessage(session.id, `Error: ${parseChatError(e)}`);
      }
    } finally {
      setStreaming(false);
    }
  }, [session, isStreaming, selectedModelId, activeModelId, models, providers, replaceSessionMessages, setStreaming, updateLastAssistantMessage, updateLastAssistantThinking, fallbackModelId]);

  const handleEditMessage = useCallback((msgId: string, newContent: string) => {
    if (!session) return;
    editMessage(session.id, msgId, newContent);
    const idx = session.messages.findIndex((m) => m.id === msgId);
    const nextMsg = session.messages[idx + 1];
    if (nextMsg?.role === 'assistant') {
      handleRegenerate(idx + 1);
    }
  }, [session, editMessage, handleRegenerate]);

  const handleRegenerateMessage = useCallback((msgId: string) => {
    if (!session) return;
    const idx = session.messages.findIndex((m) => m.id === msgId);
    if (idx >= 0) handleRegenerate(idx);
  }, [session, handleRegenerate]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="px-6 pt-4 pb-2 shrink-0 flex items-center gap-2">
        <motion.button
          onClick={() => {
            setView('onboarding');
            setActiveFeature('home');
          }}
          className="w-7 h-7 shrink-0"
          whileHover={{ scale: 1.3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          title="Home"
        >
          <DotLottieReact
            src={LOTTIE_URL}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </motion.button>

        {session && (() => {
          const project = session.projectId ? projects.find((p) => p.id === session.projectId) : null;
          return (
            <>
              {project && (
                <>
                  <span className="text-teal-400/40 text-xs font-medium">{project.name}</span>
                  <span className="text-white/10 text-xs">/</span>
                </>
              )}
              {editingTitle ? (
                <input
                  autoFocus
                  defaultValue={session.title}
                  onBlur={(e) => {
                    updateSessionTitle(session.id, e.target.value || session.title);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="bg-transparent text-white/70 text-sm font-medium outline-none border-b border-teal-400/30 pb-0.5 w-full max-w-xs"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-white/40 hover:text-white/60 text-sm font-medium transition-colors cursor-pointer truncate max-w-xs block"
                >
                  {session.title}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {session?.archived && (
        <div className="mx-6 mb-2 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 shrink-0">
          <Archive className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="text-[11px] text-amber-400/70">This conversation is archived</span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 pb-4"
      >
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {!session && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center mb-6"
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] p-2"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <DotLottieReact
                    src={LOTTIE_URL}
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                  />
                </motion.div>
                <p className="text-white/40 text-lg font-light mb-1">What can I help with?</p>
                <p className="text-white/20 text-sm">Type below or pick a suggestion</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-2 max-w-2xl"
              >
                {suggestedPrompts.map((prompt, i) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={prompt.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                      onClick={() => handlePromptClick(prompt.text)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                                 bg-white/5 border border-white/5 text-white/50
                                 hover:bg-white/10 hover:text-white/80 hover:border-white/10
                                 transition-all duration-200 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-teal-400/50" />
                      {prompt.text}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          )}

          {session?.messages.map((msg, idx) => {
            const isLastAssistant = msg.role === 'assistant' && idx === session.messages.length - 1;
            const isCurrentlyStreaming = isStreaming && isLastAssistant && streamingSessionId === session.id;
            const displayContent = isCurrentlyStreaming ? streamingContent : msg.content;
            const displayThinking = isCurrentlyStreaming ? (useChatStore.getState().streamingThinking || msg.thinking) : msg.thinking;

            // Skip empty assistant message that's waiting for streaming content
            if (isLastAssistant && msg.content === '' && !streamingContent && isStreaming) return null;

            const isLastMessage = idx === session.messages.length - 1;
            const messageContent = msg.role === 'user' ? (
              <UserMessage
                content={msg.content}
                timestamp={msg.timestamp}
                onEdit={(newContent) => handleEditMessage(msg.id, newContent)}
              />
            ) : (
              <AssistantMessage
                content={displayContent}
                thinking={displayThinking}
                isStreaming={isCurrentlyStreaming}
                isLatest={isLastMessage}
                modelId={msg.modelId || session?.modelId || ''}
                timestamp={msg.timestamp}
                getModelName={getModelName}
                isError={msg.content.startsWith('Error:')}
                onRegenerate={() => handleRegenerateMessage(msg.id)}
                onEdit={(newContent) => handleEditMessage(msg.id, newContent)}
              />
            );

            if (isLastMessage) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {messageContent}
                </motion.div>
              );
            }

            return <div key={msg.id}>{messageContent}</div>;
          })}

          {isStreaming && session && streamingSessionId === session.id && streamingContent === '' && !useChatStore.getState().streamingThinking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] flex gap-2.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-1">
                  <DotLottieReact
                    data={chpioAvatar}
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div>
                  <div className="text-xs text-white/30 mb-1.5 font-medium flex items-center gap-2">
                    ChPio
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-white/15 text-[10px]">typing</span>
                  </div>
                  <div className="text-sm rounded-2xl rounded-tl-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg border border-white/10 min-w-[60px]">
                    <span className="inline-block w-2 h-4 bg-teal-400/40 animate-pulse rounded-sm" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full
                       bg-[#1A201F]/80 backdrop-blur-md border border-white/10 text-white/50
                       hover:text-white hover:bg-[#1A201F] transition-all text-xs
                       flex items-center gap-1.5 cursor-pointer shadow-lg z-10"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            New messages
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const UserMessage = React.memo(function UserMessage({ content, timestamp, onEdit }: { content: string; timestamp: number; onEdit: (newContent: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== content) {
      onEdit(editValue.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] min-w-0">
          <textarea
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-sm leading-relaxed rounded-2xl rounded-tr-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg text-white/90 border border-teal-400/30 outline-none resize-none"
            style={{ height: 'auto', minHeight: '60px' }}
            ref={(el) => {
              if (el && el.dataset.init !== '1') {
                el.dataset.init = '1';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === 'Escape') { setEditing(false); setEditValue(content); } }}
          />
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <button onClick={() => { setEditing(false); setEditValue(content); }} className="px-2 py-1 rounded-lg text-[10px] text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
            <button onClick={handleSave} className="px-2 py-1 rounded-lg text-[10px] bg-teal-400/20 text-teal-400 border border-teal-400/30 hover:bg-teal-400/30 transition-colors cursor-pointer">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end group">
      <div className="max-w-[85%] min-w-0 overflow-hidden">
        <div className="text-xs text-white/30 mb-1 text-right font-medium">You</div>
        <div className="relative">
          <div className="text-sm leading-relaxed rounded-2xl rounded-tr-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg text-white/90 border border-teal-400/15 overflow-hidden">
            <div className="break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{content}</div>
          </div>
          <div className="flex items-center gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/5">
              <span className="text-[10px] text-white/40 mr-1">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => { setEditing(true); setEditValue(content); }}
                className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                title="Edit"
              >
                <Pen className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ThinkingBlock = React.memo(function ThinkingBlock({ thinking, isStreaming }: { thinking: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(isStreaming);

  useEffect(() => {
    if (!isStreaming) setExpanded(false);
  }, [isStreaming]);

  if (!thinking.trim()) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
      >
        <Brain className="w-3 h-3" />
        <span>{isStreaming && expanded ? 'Thinking...' : 'Thought'}</span>
        {isStreaming && expanded && (
          <span className="w-1 h-1 rounded-full bg-teal-400/50 animate-pulse" />
        )}
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/40 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const AssistantMessage = React.memo(function AssistantMessage({
  content,
  thinking,
  isStreaming,
  isLatest,
  modelId,
  timestamp,
  getModelName,
  isError,
  onRegenerate,
  onEdit,
}: {
  content: string;
  thinking?: string;
  isStreaming: boolean;
  isLatest: boolean;
  modelId: string;
  timestamp: number;
  getModelName: (id: string) => string;
  isError: boolean;
  onRegenerate: () => void;
  onEdit: (newContent: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (editValue.trim() !== content) {
      onEdit(editValue.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex justify-start group">
      <div className="max-w-[85%] min-w-0 overflow-hidden flex gap-2.5">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-1 bg-teal-400/10 flex items-center justify-center">
          {isLatest ? (
            <DotLottieReact
              data={chpioAvatar}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <svg viewBox="0 0 40 40" className="w-8 h-8 text-teal-400/60">
              <rect width="40" height="40" rx="8" fill="currentColor" opacity="0.2" />
              <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">C</text>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/30 mb-1.5 font-medium">ChPio</div>
          {thinking && (
            <ThinkingBlock thinking={thinking} isStreaming={isStreaming && !content} />
          )}
          {editing ? (
            <>
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full text-sm leading-relaxed rounded-2xl rounded-tl-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg text-white/85 border border-teal-400/30 outline-none resize-none"
                style={{ height: 'auto', minHeight: '80px' }}
                ref={(el) => {
                  if (el && el.dataset.init !== '1') {
                    el.dataset.init = '1';
                    el.style.height = el.scrollHeight + 'px';
                  }
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setEditValue(content); } }}
              />
              <div className="flex items-center gap-1.5 mt-1">
                <button onClick={() => { setEditing(false); setEditValue(content); }} className="px-2 py-1 rounded-lg text-[10px] text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleSave} className="px-2 py-1 rounded-lg text-[10px] bg-teal-400/20 text-teal-400 border border-teal-400/30 hover:bg-teal-400/30 transition-colors cursor-pointer">Save</button>
              </div>
            </>
          ) : (
            <div
              className={`text-sm leading-relaxed rounded-2xl rounded-tl-md px-4 py-3 backdrop-blur-lg border overflow-hidden min-w-0 ${
                isError
                  ? 'bg-red-900/40 border-red-400/20 text-red-300/90'
                  : 'bg-slate-900/40 border-white/10 text-white/85'
              }`}
              style={{ contain: 'content' }}
            >
              {content ? (
                isStreaming ? <MessageContent content={content} /> : <LazyMessageContent content={content} />
              ) : (
                <span className="inline-block w-1.5 h-3.5 bg-white/30 rounded-sm animate-pulse" />
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/5">
              <span className="text-[10px] text-white/40">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/40">{getModelName(modelId)}</span>
              {!isError && !(isStreaming && content) && (
                <button
                  onClick={() => { setEditing(true); setEditValue(content); }}
                  className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer ml-1"
                  title="Edit"
                >
                  <Pen className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={onRegenerate}
                className="p-1 rounded-md text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all cursor-pointer"
                title="Regenerate"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

function MessageContent({ content }: { content: string }) {
  const deferredContent = useDeferredValue(content);

  const rendered = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={mdComponents}
      >
        {deferredContent}
      </ReactMarkdown>
    ),
    [deferredContent]
  );

  return (
    <div className="break-words overflow-hidden min-w-0 leading-relaxed" style={{ wordBreak: 'break-word', contain: 'content' }}>
      {rendered}
    </div>
  );
}

function LazyMessageContent({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? <MessageContent content={content} /> : <div className="min-h-[40px]" />}
    </div>
  );
}

const mdComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (match) {
      return (
        <Suspense fallback={<div className="p-4 text-white/20 text-xs">Loading...</div>}>
          <LazyCodeBlock language={match[1]} code={codeString} />
        </Suspense>
      );
    }

    return (
      <code
        className="bg-white/10 text-teal-300/90 px-1.5 py-0.5 rounded-md text-xs font-mono break-all inline-block max-w-full overflow-x-auto whitespace-normal"
        {...props}
      >
        {children}
      </code>
    );
  },
  p({ children }: { children?: React.ReactNode }) {
    return <p className="mb-2 last:mb-0 break-words" style={{ wordBreak: 'break-word' }}>{children}</p>;
  },
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="list-disc list-inside mb-2 space-y-0.5 break-words" style={{ wordBreak: 'break-word' }}>{children}</ul>;
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="list-decimal list-inside mb-2 space-y-0.5 break-words" style={{ wordBreak: 'break-word' }}>{children}</ol>;
  },
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="text-lg font-bold mb-2 text-white break-words" style={{ wordBreak: 'break-word' }}>{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="text-base font-bold mb-2 text-white break-words" style={{ wordBreak: 'break-word' }}>{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-sm font-bold mb-1 text-white break-words" style={{ wordBreak: 'break-word' }}>{children}</h3>;
  },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-400 hover:underline break-all"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }: { children?: React.ReactNode }) {
    return (
      <blockquote className="border-l-2 border-teal-400/30 pl-3 text-white/60 italic mb-2 break-words" style={{ wordBreak: 'break-word' }}>
        {children}
      </blockquote>
    );
  },
  table({ children }: { children?: React.ReactNode }) {
    return (
      <div className="overflow-x-auto mb-2">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  th({ children }: { children?: React.ReactNode }) {
    return (
      <th className="border border-white/10 px-3 py-1.5 text-left text-white/70 bg-white/5 font-medium">
        {children}
      </th>
    );
  },
  td({ children }: { children?: React.ReactNode }) {
    return (
      <td className="border border-white/10 px-3 py-1.5 text-white/70 break-words" style={{ wordBreak: 'break-word' }}>{children}</td>
    );
  },
  li({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement> & { children?: React.ReactNode }) {
    return <li className="ml-1 mb-0.5 break-words" style={{ wordBreak: 'break-word' }} {...props}>{children}</li>;
  },
  strong({ children }: { children?: React.ReactNode }) {
    return <strong className="font-bold text-white/90">{children}</strong>;
  },
  em({ children }: { children?: React.ReactNode }) {
    return <em className="italic text-white/70">{children}</em>;
  },
  del({ children }: { children?: React.ReactNode }) {
    return <del className="line-through text-white/40">{children}</del>;
  },
  img({ src, alt }: { src?: string; alt?: string }) {
    return (
      <span className="block my-2">
        <img src={src} alt={alt || ''} className="max-w-full rounded-lg border border-white/10" />
        {alt && <span className="block text-[10px] text-white/30 mt-1 text-center">{alt}</span>}
      </span>
    );
  },
  hr() {
    return <hr className="border-white/10 my-3" />;
  },
  input({ type, checked, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { type?: string; checked?: boolean }) {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-1.5 rounded border-white/20 accent-teal-400 align-middle"
          style={{ width: '14px', height: '14px' }}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};


