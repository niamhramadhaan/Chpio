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
  Menu,
  Download,
  Clipboard,
  FileText,
  Bookmark,
  X,
  Star,
  AlertCircle,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useChatStore } from '../store/chatStore';
import { ContextMenu } from '../components/ui/ContextMenu';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore, useIsMobile } from '../store/appStore';
import { useProjectStore } from '../store/projectStore';
import { useDocsStore } from '../store/docsStore';
import { useMemoryStore } from '../store/memoryStore';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import { resolveModelProvider } from '../utils/resolveModel';
import { buildDocContextSystemMessage } from '../utils/docContext';
import { parseDocUpdates, executeDocUpdates, stripDocUpdates, formatDocUpdateSummary } from '../utils/parseDocUpdates';
import { buildMemoryContextSystemMessage, summarizeForMemory } from '../utils/memoryContext';
import { useNotesStore } from '../store/notesStore';
import { buildChpioSystemMessage } from '../utils/chpioContext';
import { buildProjectSystemMessage } from '../utils/projectContext';
import { parseInteractiveOptions, removeOptionsFromContent } from '../utils/parseOptions';
import { detectGoalResponse } from '../utils/parseGoal';
import { exportChatAsMd, exportChatAsTxt, copyChatToClipboard, downloadFile, getExportFilename } from '../utils/exportChat';
import { ChpioAvatar } from '../components/ChpioAvatar';

const LazyCodeBlock = React.lazy(() => import('../components/CodeBlock'));

function parseChatError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Failed to get response';
  if (msg.includes('401')) return 'Invalid API key. Check your key in Settings → Providers.';
  if (msg.includes('403')) return 'Access denied. Your API key may not have permission for this model.';
  if (msg.includes('429')) return 'Rate limit exceeded. Try again shortly or switch models.';
  if (msg.includes('402')) return 'Payment required. Add credits to your provider account.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed'))
    return 'Could not reach provider. Check your connection.';
  if (msg.includes('WebGPU')) return 'WebGPU not available. Use Chrome or Edge 113+ with GPU enabled.';
  if (msg.includes('out of memory') || msg.includes('device lost') || msg.includes('GPU'))
    return 'GPU ran out of memory. Try a smaller model or close other GPU-heavy tabs.';
  if (msg.includes('Local model error')) return msg;
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
  const session = sessions.find((s) => s.id === activeSessionId);
  const projects = useProjectStore((s) => s.projects);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const focusMode = useAppStore((s) => s.focusMode);
  const isMobile = useIsMobile();
  const createSession = useChatStore((s) => s.createSession);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage);
  const updateLastAssistantThinking = useChatStore((s) => s.updateLastAssistantThinking);
  const replaceSessionMessages = useChatStore((s) => s.replaceSessionMessages);
  const updateSessionTitle = useChatStore((s) => s.updateSessionTitle);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const editMessage = useChatStore((s) => s.editMessage);
  const toggleStar = useChatStore((s) => s.toggleStar);
  const setGoal = useChatStore((s) => s.setGoal);
  const setGoalStatus = useChatStore((s) => s.setGoalStatus);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const fallbackModelId = useSettingsStore((s) => s.fallbackModelId);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const providers = useSettingsStore((s) => s.providers);
  const mainProviderId = useSettingsStore((s) => s.mainProviderId);
  const user = useSettingsStore((s) => s.user);

  const models = useMemo(() => getActiveModels(providers), [providers]);

  const mainProviderFirstModel = useMemo(() => {
    const mainProvider = providers.find((p) => p.id === mainProviderId && p.enabled && p.syncedModels.length > 0);
    return mainProvider ? `${mainProvider.id}/${mainProvider.syncedModels[0].id}` : '';
  }, [providers, mainProviderId]);

  const activeModelId = selectedModelId || defaultModelId || mainProviderFirstModel;

  const scrollRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [rememberingMsgId, setRememberingMsgId] = useState<string | null>(null);
  const [rememberedMsgId, setRememberedMsgId] = useState<string | null>(null);
  const [nothingToRemember, setNothingToRemember] = useState<string | null>(null);
  const [rememberErrorMsgId, setRememberErrorMsgId] = useState<string | null>(null);
  const [rememberErrorText, setRememberErrorText] = useState<string>('');
  const createMemory = useMemoryStore((s) => s.createMemory);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIds, setSearchMatchIds] = useState<string[]>([]);
  const [searchCurrentIdx, setSearchCurrentIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chpioMode = useAppStore((s) => s.chpioMode);
  const toggleChpioMode = useAppStore((s) => s.toggleChpioMode);

  const notes = useNotesStore((s) => s.notes);
  const clearActiveNote = useChatStore((s) => s.clearActiveNote);
  const activeNoteId = session?.activeNoteId;
  const activeNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) : null;
  const [sentToNote, setSentToNote] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Trigger celebration animation when goal is completed
  useEffect(() => {
    if (session?.goalStatus === 'completed' && chpioMode) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [session?.goalStatus, chpioMode]);

  const handleSentToNote = useCallback(() => {
    setSentToNote(true);
    setTimeout(() => setSentToNote(false), 2000);
  }, []);

  const handleOptionClick = useCallback((text: string) => {
    if (!session || isStreaming) return;
    const modelId = selectedModelId || session.modelId || activeModelId;
    if (!modelId) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };
    addMessage(session.id, userMsg);

    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      modelId,
      timestamp: Date.now(),
    };
    addMessage(session.id, assistantMsg);
    setStreaming(true);
    const controller = new AbortController();
    useChatStore.setState({ abortController: controller });

    const doStream = async (mId: string, msgs: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
      const { baseUrl, apiKey, providerId: pId } = resolveModelProvider(mId, models, providers);

      const sessionData = useChatStore.getState().sessions.find((s) => s.id === session.id);
      const allDocs = useDocsStore.getState().docs;
      const sessionDocs = allDocs.filter((d) => sessionData?.attachedDocIds?.includes(d.id));
      const docSystemMsg = sessionDocs.length > 0
        ? buildDocContextSystemMessage(sessionDocs)
        : 'If the user asks to write to a document, remind them to attach a document first.';
      const { memories, activeTag } = useMemoryStore.getState();
      const filteredMemories = activeTag ? memories.filter(m => m.tags.includes(activeTag)) : memories;
      const memorySystemMsg = buildMemoryContextSystemMessage(filteredMemories);
      const chpioSystemMsg = chpioMode ? buildChpioSystemMessage(user) : null;
      const activeProject = sessionData?.projectId ? projects.find((p) => p.id === sessionData.projectId) : null;
      const projectSystemMsg = activeProject ? buildProjectSystemMessage(activeProject) : null;

      const combinedSystem = [chpioSystemMsg, projectSystemMsg, memorySystemMsg, docSystemMsg].filter(Boolean).join('\n\n');
      const messages = combinedSystem
        ? [{ role: 'system' as const, content: combinedSystem }, ...msgs]
        : msgs;

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), messages, pId, controller.signal);
      let accumulated = '';
      let rafId: number | null = null;

      const scheduleFlush = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateLastAssistantMessage(session.id, accumulated);
        });
      };

      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          accumulated += chunk.text;
          scheduleFlush();
        }
      }
      if (rafId !== null) cancelAnimationFrame(rafId);

      // Detect goal patterns in AI response
      if (chpioMode) {
        const goalDetection = detectGoalResponse(accumulated);
        if (goalDetection.isGoalAck && goalDetection.goal) {
          setGoal(session.id, goalDetection.goal, goalDetection.steps);
        } else if (goalDetection.isGoalComplete) {
          setGoalStatus(session.id, 'completed');
        }
      }

      updateLastAssistantMessage(session.id, accumulated);
    };

    const chatMessages = useChatStore
      .getState()
      .getActiveSession()
      ?.messages.filter((m) => m.content)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })) || [];

    doStream(modelId, chatMessages).catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      updateLastAssistantMessage(session.id, `Error: ${parseChatError(e)}`);
    }).finally(() => {
      setStreaming(false);
    });
  }, [session, isStreaming, selectedModelId, activeModelId, models, providers, projects, user, chpioMode, addMessage, setStreaming, updateLastAssistantMessage, setGoal, setGoalStatus]);

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
    if (!showExport) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchMatchIds([]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen]);

  useEffect(() => {
    if (!session || !searchQuery.trim()) {
      setSearchMatchIds([]);
      setSearchCurrentIdx(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = session.messages
      .filter((m) => m.content.toLowerCase().includes(q))
      .map((m) => m.id);
    setSearchMatchIds(matches);
    setSearchCurrentIdx(matches.length > 0 ? 0 : -1);
  }, [searchQuery, session?.messages]);

  useEffect(() => {
    if (searchMatchIds.length === 0) return;
    const msgId = searchMatchIds[searchCurrentIdx];
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchCurrentIdx, searchMatchIds]);

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
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    });
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [activeSessionId, session?.messages?.length]);

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
      const { baseUrl, apiKey, providerId: pId } = resolveModelProvider(mId, models, providers);

      const session = useChatStore.getState().sessions.find((s) => s.id === sessionId);
      const allDocs = useDocsStore.getState().docs;
      const sessionDocs = allDocs.filter((d) => session?.attachedDocIds?.includes(d.id));
      const docSystemMsg = sessionDocs.length > 0
        ? buildDocContextSystemMessage(sessionDocs)
        : 'If the user asks to write to a document, remind them to attach a document first using the BookOpen icon in the input bar.';
      const { memories, activeTag } = useMemoryStore.getState();
      const filteredMemories = activeTag ? memories.filter(m => m.tags.includes(activeTag)) : memories;
      const memorySystemMsg = buildMemoryContextSystemMessage(filteredMemories);
      const chpioSystemMsg = chpioMode ? buildChpioSystemMessage(user) : null;
      const activeProject = session?.projectId ? projects.find((p) => p.id === session.projectId) : null;
      const projectSystemMsg = activeProject ? buildProjectSystemMessage(activeProject) : null;

      const combinedSystem = [chpioSystemMsg, projectSystemMsg, memorySystemMsg, docSystemMsg].filter(Boolean).join('\n\n');
      const messages = combinedSystem
        ? [{ role: 'system' as const, content: combinedSystem }, ...msgs]
        : msgs;

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), messages, pId, controller.signal);
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

      // Detect goal patterns in AI response
      if (chpioMode) {
        const goalDetection = detectGoalResponse(accumulated);
        if (goalDetection.isGoalAck && goalDetection.goal) {
          // Store the goal (user will confirm in next message)
          setGoal(sessionId, goalDetection.goal, goalDetection.steps);
        } else if (goalDetection.isGoalComplete) {
          // Mark goal as completed and trigger celebration
          setGoalStatus(sessionId, 'completed');
        }
      }

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
      const { baseUrl, apiKey, providerId: pId } = resolveModelProvider(mId, models, providers);

      const allDocs = useDocsStore.getState().docs;
      const sessionDocs = allDocs.filter((d) => session.attachedDocIds?.includes(d.id));
      const docSystemMsg = sessionDocs.length > 0
        ? buildDocContextSystemMessage(sessionDocs)
        : 'If the user asks to write to a document, remind them to attach a document first using the BookOpen icon in the input bar.';
      const { memories: mem, activeTag: tag } = useMemoryStore.getState();
      const filteredMem = tag ? mem.filter(m => m.tags.includes(tag)) : mem;
      const memorySystemMsg = buildMemoryContextSystemMessage(filteredMem);
      const chpioSystemMsg = chpioMode ? buildChpioSystemMessage(user) : null;
      const activeProject = session.projectId ? projects.find((p) => p.id === session.projectId) : null;
      const projectSystemMsg = activeProject ? buildProjectSystemMessage(activeProject) : null;

      const combinedSystem = [chpioSystemMsg, projectSystemMsg, memorySystemMsg, docSystemMsg].filter(Boolean).join('\n\n');
      const messages = combinedSystem
        ? [{ role: 'system' as const, content: combinedSystem }, ...msgs]
        : msgs;

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(mId), messages, pId, controller.signal);
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

      const updates = parseDocUpdates(accumulated);
      const results = executeDocUpdates(updates);
      const summary = formatDocUpdateSummary(results);
      if (summary) {
        accumulated = stripDocUpdates(accumulated) + '\n\n> ' + summary;
      }

      // Detect goal patterns in AI response
      if (chpioMode) {
        const goalDetection = detectGoalResponse(accumulated);
        if (goalDetection.isGoalAck && goalDetection.goal) {
          setGoal(session.id, goalDetection.goal, goalDetection.steps);
        } else if (goalDetection.isGoalComplete) {
          setGoalStatus(session.id, 'completed');
        }
      }

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
  }, [session, isStreaming, selectedModelId, activeModelId, models, providers, replaceSessionMessages, setStreaming, updateLastAssistantMessage, updateLastAssistantThinking, fallbackModelId, chpioMode, user, setGoal, setGoalStatus]);

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

  const handleRemember = useCallback(async (msgId: string, content: string) => {
    if (rememberingMsgId) return;
    setRememberingMsgId(msgId);
    setRememberErrorMsgId(null);

    try {
      const { model, provider, baseUrl, apiKey, providerId: pId } = resolveModelProvider(activeModelId, models, providers);

      if (!model || !provider) {
        setNothingToRemember(null);
        setRememberErrorText('Configure a provider first');
        setRememberErrorMsgId(msgId);
        setTimeout(() => setRememberErrorMsgId(null), 3000);
        return;
      }

      const extraction = await summarizeForMemory(content, (msgs) => {
        return streamChat(baseUrl, apiKey, stripProviderPrefix(model.id), msgs, pId);
      });

      if (extraction) {
        createMemory(extraction.content, ['from-chat'], extraction.type);
        setRememberedMsgId(msgId);
        setTimeout(() => setRememberedMsgId(null), 2000);
      } else {
        setNothingToRemember(msgId);
        setTimeout(() => setNothingToRemember(null), 2000);
      }
    } catch (err) {
      console.error('[handleRemember] Failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to save memory';
      setRememberErrorText(message);
      setRememberErrorMsgId(msgId);
      setTimeout(() => setRememberErrorMsgId(null), 3000);
    } finally {
      setRememberingMsgId(null);
    }
  }, [rememberingMsgId, activeModelId, models, providers, createMemory]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Header — hidden in focus mode when no messages */}
      {!(focusMode && (!session || session.messages.length === 0)) && (
      <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 shrink-0 flex items-center gap-2">
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

        {isMobile && (
          <button
            onClick={() => setActiveFeature('notes')}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

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

              {session.goal && chpioMode && (
                <div className="flex items-center gap-1.5 ml-2">
                  <div className={`w-2 h-2 rounded-full ${
                    session.goalStatus === 'completed' 
                      ? 'bg-green-400' 
                      : 'bg-purple-400 animate-pulse'
                  }`} />
                  <span className="text-xs text-white/30 truncate max-w-[120px]" title={session.goal}>
                    {session.goal}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-1 relative" ref={exportRef}>
                <button
                  onClick={toggleChpioMode}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    chpioMode ? 'bg-purple-400/15 text-purple-400 border border-purple-400/30 chpio-active' : 'text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent'
                  }`}
                  title="Chpio mode"
                  aria-label="Chpio mode"
                  aria-pressed={chpioMode}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${chpioMode ? 'chpio-sparkle' : ''}`} />
                </button>
                <button
                  onClick={() => toggleStar(session.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    session.starred ? 'text-amber-400 hover:text-amber-300' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                  title={session.starred ? 'Unstar chat' : 'Star chat'}
                  aria-label={session.starred ? 'Unstar chat' : 'Star chat'}
                >
                  <Star className="w-3.5 h-3.5" fill={session.starred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Search messages (Ctrl+F)"
                  aria-label="Search messages"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Export chat"
                  aria-label="Export chat"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {showExport && (
                  <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <button
                      onClick={() => {
                        const text = copyChatToClipboard(session);
                        navigator.clipboard.writeText(text);
                        setExportCopied(true);
                        setTimeout(() => setExportCopied(false), 2000);
                        setShowExport(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {exportCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {exportCopied ? 'Copied!' : 'Copy all'}
                    </button>
                    <button
                      onClick={() => {
                        const md = exportChatAsMd(session);
                        downloadFile(md, getExportFilename(session, 'md'), 'text/markdown');
                        setShowExport(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Export .md
                    </button>
                    <button
                      onClick={() => {
                        const txt = exportChatAsTxt(session);
                        downloadFile(txt, getExportFilename(session, 'txt'), 'text/plain');
                        setShowExport(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Export .txt
                    </button>
                  </div>
                )}
                {activeNote && (
                  <button
                    onClick={() => session && clearActiveNote(session.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      sentToNote ? 'bg-teal-400/15 text-teal-400' : 'text-teal-400/50 hover:text-teal-400 hover:bg-teal-400/10'
                    }`}
                    title={sentToNote ? 'Sent!' : `${activeNote.title || 'Untitled'} — click to unlink`}
                    aria-label={sentToNote ? 'Sent to note' : `Active note: ${activeNote.title || 'Untitled'}`}
                  >
                    {sentToNote ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StickyNote className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px] truncate max-w-[100px]">
                      {sentToNote ? 'Sent!' : (activeNote.title || 'Untitled')}
                    </span>
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </div>
      )}

      {session?.archived && (
        <div className="mx-3 sm:mx-6 mb-2 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 shrink-0">
          <Archive className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="text-[11px] text-amber-400/70">This conversation is archived</span>
        </div>
      )}

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mx-3 sm:mx-6 mb-2 px-3 py-2 rounded-lg bg-[#1A201F]/80 backdrop-blur-md border border-white/10 flex items-center gap-2 shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchMatchIds.length > 0) {
                    setSearchCurrentIdx((prev) => (prev + 1) % searchMatchIds.length);
                  }
                }
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Search messages..."
              className="bg-transparent text-white text-xs outline-none flex-1 placeholder-white/30"
              autoFocus
            />
            {searchQuery && (
              <span className="text-[10px] text-white/30 shrink-0">
                {searchMatchIds.length > 0 ? `${searchCurrentIdx + 1}/${searchMatchIds.length}` : 'No matches'}
              </span>
            )}
            <button
              onClick={() => {
                if (searchMatchIds.length > 0) {
                  setSearchCurrentIdx((prev) => (prev + 1) % searchMatchIds.length);
                }
              }}
              className="p-1 rounded text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              aria-label="Next match"
            >
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            </button>
            <button
              onClick={() => {
                if (searchMatchIds.length > 0) {
                  setSearchCurrentIdx((prev) => (prev - 1 + searchMatchIds.length) % searchMatchIds.length);
                }
              }}
              className="p-1 rounded text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              aria-label="Previous match"
            >
              <ChevronDown className="w-3 h-3 rotate-[90deg]" />
            </button>
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 rounded text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pb-4"
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
                className="flex flex-wrap justify-center gap-2 max-w-2xl px-2"
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
            const isCurrentlyStreaming = isStreaming && isLastAssistant;
            const displayContent = isCurrentlyStreaming ? (streamingContent || msg.content) : msg.content;
            const displayThinking = isCurrentlyStreaming ? (useChatStore.getState().streamingThinking || msg.thinking) : msg.thinking;

            const isLastMessage = idx === session.messages.length - 1;
            const messageContent = msg.role === 'user' ? (
              <UserMessage
                content={msg.content}
                timestamp={msg.timestamp}
                onEdit={(newContent) => handleEditMessage(msg.id, newContent)}
                onRemember={() => handleRemember(msg.id, msg.content)}
                isRemembering={rememberingMsgId === msg.id}
                isRemembered={rememberedMsgId === msg.id}
                isNothingToRemember={nothingToRemember === msg.id}
                isRememberError={rememberErrorMsgId === msg.id}
                rememberErrorText={rememberErrorMsgId === msg.id ? rememberErrorText : ''}
                imageData={msg.imageData}
                fileContext={msg.fileContext ? { name: msg.fileContext.name, type: msg.fileContext.type } : undefined}
              />
            ) : (
              <AssistantMessage
                content={displayContent}
                thinking={displayThinking}
                isStreaming={isCurrentlyStreaming}
                modelId={msg.modelId || session?.modelId || ''}
                timestamp={msg.timestamp}
                getModelName={getModelName}
                isError={msg.content.startsWith('Error:')}
                fallbackModelId={fallbackModelId}
                onRegenerate={() => handleRegenerateMessage(msg.id)}
                onEdit={(newContent) => handleEditMessage(msg.id, newContent)}
                onRemember={() => handleRemember(msg.id, msg.content)}
                isRemembering={rememberingMsgId === msg.id}
                isRemembered={rememberedMsgId === msg.id}
                isNothingToRemember={nothingToRemember === msg.id}
                isRememberError={rememberErrorMsgId === msg.id}
                rememberErrorText={rememberErrorMsgId === msg.id ? rememberErrorText : ''}
                chpioMode={chpioMode}
                showCelebration={showCelebration}
                onSentToNote={handleSentToNote}
                onOptionClick={handleOptionClick}
              />
            );

            const isSearchMatch = searchOpen && searchQuery && searchMatchIds.includes(msg.id);
            const isCurrentSearchMatch = searchOpen && searchQuery && searchMatchIds[searchCurrentIdx] === msg.id;

            if (isLastMessage) {
              return (
                <motion.div
                  key={msg.id}
                  data-msg-id={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={isCurrentSearchMatch ? 'ring-1 ring-teal-400/40 rounded-2xl' : isSearchMatch ? 'ring-1 ring-teal-400/15 rounded-2xl' : ''}
                >
                  {messageContent}
                </motion.div>
              );
            }

            return <div key={msg.id} data-msg-id={msg.id} className={isCurrentSearchMatch ? 'ring-1 ring-teal-400/40 rounded-2xl' : isSearchMatch ? 'ring-1 ring-teal-400/15 rounded-2xl' : ''}>{messageContent}</div>;
          })}
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

const UserMessage = React.memo(function UserMessage({ content, timestamp, onEdit, onRemember, isRemembering, isRemembered, isNothingToRemember, isRememberError, rememberErrorText, imageData, fileContext }: { content: string; timestamp: number; onEdit: (newContent: string) => void; onRemember: () => void; isRemembering: boolean; isRemembered: boolean; isNothingToRemember: boolean; isRememberError: boolean; rememberErrorText: string; imageData?: { base64: string; mimeType: string }; fileContext?: { name: string; type: string } }) {
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
    <ContextMenu
      items={[
        { icon: <Copy className="w-3.5 h-3.5" />, label: 'Copy', onClick: handleCopy },
        { icon: <Pen className="w-3.5 h-3.5" />, label: 'Edit', onClick: () => { setEditing(true); setEditValue(content); } },
        { icon: <Bookmark className="w-3.5 h-3.5" />, label: 'Save to memory', onClick: onRemember, disabled: isRemembering },
      ]}
    >
      <div className="flex justify-end group">
        <div className="max-w-[85%] min-w-0 overflow-hidden">
          <div className="text-xs text-white/30 mb-1 text-right font-medium">You</div>
          <div className="relative">
            <div className="text-sm leading-relaxed rounded-2xl rounded-tr-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg text-white/90 border border-teal-400/15 overflow-hidden">
              <div className="break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{content}</div>
              {imageData && (
                <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-[200px]">
                  <img
                    src={`data:${imageData.mimeType};base64,${imageData.base64}`}
                    alt="Attached image"
                    className="w-full h-auto max-h-[150px] object-contain"
                  />
                </div>
              )}
              {fileContext && (
                <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <FileText className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-[11px] text-white/40 truncate">{fileContext.name}</span>
                </div>
              )}
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
                  aria-label="Edit message"
                >
                  <Pen className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                  title="Copy"
                  aria-label="Copy message"
                >
                  {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <button
                  onClick={onRemember}
                  disabled={isRemembering}
                  className="p-1 rounded-md text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40"
                  title={isRememberError ? rememberErrorText : "Save to memory"}
                  aria-label="Save to memory"
                >
                  {isRemembered ? <Check className="w-3 h-3 text-teal-400" /> : isRememberError ? <AlertCircle className="w-3 h-3 text-red-400" /> : isNothingToRemember ? <X className="w-3 h-3 text-white/30" /> : isRemembering ? <span className="w-3 h-3 block rounded-full border-2 border-teal-400/40 border-t-teal-400 animate-spin" /> : <Bookmark className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContextMenu>
  );
});

const ThinkingBlock = React.memo(function ThinkingBlock({ thinking, isStreaming }: { thinking: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(isStreaming);
  const [startTime] = useState(() => Date.now());
  const [duration, setDuration] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setExpanded(false);
      setFinalDuration(duration);
    }
  }, [isStreaming, duration]);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDuration(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming, startTime]);

  if (!thinking.trim()) return null;

  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 1) return `${Math.floor(ms)}ms`;
    return `${seconds.toFixed(1)}s`;
  };

  const tokenCount = Math.ceil(thinking.length / 4);
  const displayDuration = isStreaming ? duration : finalDuration;

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
      >
        <Brain className={`w-3 h-3 ${isStreaming ? 'think-dot' : ''}`} />
        {isStreaming ? (
          <span className="flex items-center gap-1.5">
            <span>Thinking for {formatDuration(duration)}</span>
            <span className="think-dots flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-teal-400/60 inline-block" />
              <span className="w-1 h-1 rounded-full bg-teal-400/60 inline-block" />
              <span className="w-1 h-1 rounded-full bg-teal-400/60 inline-block" />
            </span>
            <span className="text-white/15 ml-1">~{tokenCount} tokens</span>
          </span>
        ) : (
          <span>Thought</span>
        )}
        {!isStreaming && displayDuration && (
          <span className="text-white/20 ml-0.5">
            {formatDuration(displayDuration)} · ~{tokenCount} tokens
          </span>
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
  modelId,
  timestamp,
  getModelName,
  isError,
  fallbackModelId,
  onRegenerate,
  onEdit,
  onRemember,
  isRemembering,
  isRemembered,
  isNothingToRemember,
  isRememberError,
  rememberErrorText,
  chpioMode,
  showCelebration,
  onSentToNote,
  onOptionClick,
}: {
  content: string;
  thinking?: string;
  isStreaming: boolean;
  modelId: string;
  timestamp: number;
  getModelName: (id: string) => string;
  isError: boolean;
  fallbackModelId: string;
  onRegenerate: () => void;
  onEdit: (newContent: string) => void;
  onRemember: () => void;
  isRemembering: boolean;
  isRemembered: boolean;
  isNothingToRemember: boolean;
  isRememberError: boolean;
  rememberErrorText: string;
  chpioMode?: boolean;
  showCelebration?: boolean;
  onSentToNote?: () => void;
  onOptionClick?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [sentToNote, setSentToNote] = useState(false);

  const activeSession = useChatStore((s) => s.sessions.find((sess) => sess.id === s.activeSessionId));
  const activeNoteId = activeSession?.activeNoteId;
  const notes = useNotesStore((s) => s.notes);
  const appendToNote = useNotesStore((s) => s.appendToNote);

  const activeNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) : null;

  const getSelectedText = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const messageEl = container instanceof HTMLElement ? container : container.parentElement;
    if (!messageEl?.closest('.assistant-message')) return null;
    return sel.toString().trim();
  };

  const handleSendToNote = () => {
    if (!activeNoteId) return;
    const selectedText = getSelectedText();
    const textToSend = selectedText || content;
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatted = `[${timestamp}] ${textToSend}`;
    appendToNote(activeNoteId, formatted);
    setSentToNote(true);
    setTimeout(() => setSentToNote(false), 2000);
    onSentToNote?.();
    window.getSelection()?.removeAllRanges();
  };

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

  const isEmptyAndStreaming = isStreaming && !content && !thinking;

  return (
    <ContextMenu
      items={[
        { icon: <Copy className="w-3.5 h-3.5" />, label: 'Copy', onClick: handleCopy },
        ...(!isError && !(isStreaming && content) ? [{ icon: <Pen className="w-3.5 h-3.5" />, label: 'Edit', onClick: () => { setEditing(true); setEditValue(content); } }] : []),
        { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Regenerate', onClick: onRegenerate },
        { icon: <Bookmark className="w-3.5 h-3.5" />, label: 'Save to memory', onClick: onRemember, disabled: isRemembering },
        ...(activeNote ? [{
          icon: sentToNote ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <StickyNote className="w-3.5 h-3.5" />,
          label: sentToNote ? 'Sent!' : (getSelectedText() ? 'Send selection to note' : 'Send to note'),
          onClick: handleSendToNote,
          disabled: sentToNote,
        }] : []),
      ]}
    >
      <div className="relative flex justify-start group">
        <div className="max-w-[85%] min-w-0 overflow-hidden flex gap-2.5">
          <ChpioAvatar
            animated={isStreaming}
            mood={showCelebration ? 'celebrating' : isStreaming ? 'responding' : 'idle'}
            className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-1 flex items-center justify-center ${
              chpioMode ? 'bg-purple-400/15 chpio-avatar-glow' : 'bg-teal-400/10'
            } ${showCelebration ? 'chpio-celebrate' : ''}`}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/30 mb-1.5 font-medium">ChPio</div>
            {thinking && (
              <ThinkingBlock thinking={thinking} isStreaming={isStreaming && !content} />
            )}
            {isEmptyAndStreaming ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-teal-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-white/15 text-[10px]">typing</span>
              </div>
            ) : editing ? (
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
                className={`assistant-message text-sm leading-relaxed rounded-2xl rounded-tl-md px-4 py-3 backdrop-blur-lg border overflow-hidden min-w-0 ${
                  isError
                    ? 'bg-red-900/40 border-red-400/20 text-red-300/90'
                    : 'bg-slate-900/40 border-white/10 text-white/85'
                }`}
                style={{ contain: 'content' }}
              >
                {content ? (
                  isStreaming ? <MessageContent content={content} /> : <LazyMessageContent content={content} onOptionClick={onOptionClick} />
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
                {fallbackModelId && modelId === fallbackModelId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 font-medium">Fallback</span>
                )}
                {!isError && !(isStreaming && content) && (
                  <button
                    onClick={() => { setEditing(true); setEditValue(content); }}
                    className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer ml-1"
                    title="Edit"
                    aria-label="Edit message"
                  >
                    <Pen className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
                  title="Copy"
                  aria-label="Copy message"
                >
                  {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded-md text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all cursor-pointer"
                  title="Regenerate"
                  aria-label="Regenerate response"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={onRemember}
                  disabled={isRemembering}
                  className="p-1 rounded-md text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40"
                  title={isRememberError ? rememberErrorText : "Save to memory"}
                  aria-label="Save to memory"
                >
                  {isRemembered ? <Check className="w-3 h-3 text-teal-400" /> : isRememberError ? <AlertCircle className="w-3 h-3 text-red-400" /> : isNothingToRemember ? <X className="w-3 h-3 text-white/30" /> : isRemembering ? <span className="w-3 h-3 block rounded-full border-2 border-teal-400/40 border-t-teal-400 animate-spin" /> : <Bookmark className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toast notification for send to note */}
        {sentToNote && (
          <div className="absolute -bottom-8 left-0 px-2 py-1 rounded-md bg-teal-400/15 border border-teal-400/30 backdrop-blur-md flex items-center gap-1.5 z-10">
            <Check className="w-3 h-3 text-teal-400" />
            <span className="text-[10px] text-teal-400">Sent to {activeNote?.title || 'note'}</span>
          </div>
        )}
      </div>
    </ContextMenu>
  );
});

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

function MessageContent({ content, onOptionClick }: { content: string; onOptionClick?: (text: string) => void }) {
  const deferredContent = useDeferredValue(content);

  const options = useMemo(() => parseInteractiveOptions(deferredContent), [deferredContent]);
  const textContent = useMemo(
    () => (options ? removeOptionsFromContent(deferredContent) : deferredContent),
    [deferredContent, options]
  );

  const rendered = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={mdComponents}
      >
        {textContent}
      </ReactMarkdown>
    ),
    [textContent]
  );

  return (
    <div className="break-words overflow-hidden min-w-0 leading-relaxed" style={{ wordBreak: 'break-word', contain: 'content' }}>
      {rendered}
      {options && onOptionClick && (
        <div className="flex flex-wrap gap-2 mt-3">
          {options.map((opt) => (
            <button
              key={opt.number}
              onClick={() => onOptionClick(opt.text)}
              className="px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 
                         text-white/70 hover:bg-teal-400/10 hover:text-teal-400 
                         hover:border-teal-400/20 transition-all cursor-pointer text-left"
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LazyMessageContent({ content, onOptionClick }: { content: string; onOptionClick?: (text: string) => void }) {
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
      {isVisible ? <MessageContent content={content} onOptionClick={onOptionClick} /> : <div className="min-h-[40px]" />}
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


