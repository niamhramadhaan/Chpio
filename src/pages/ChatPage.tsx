import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Lightbulb,
  Code2,
  Pen,
  Search,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { useProjectStore } from '../store/projectStore';
import { streamChat } from '../services/providers';
import { getActiveModels, stripProviderPrefix } from '../utils/models';
import chpioAvatar from '../assets/chpio-avatar.json';

const LOTTIE_URL = 'https://lottie.host/3bd7f01f-14d7-4c9b-86a2-5024f6cb44f3/eUurreIWqI.lottie';

const suggestedPrompts = [
  { icon: Lightbulb, text: 'Explain quantum computing simply' },
  { icon: Code2, text: 'Write a Python fibonacci function' },
  { icon: Pen, text: 'Help me write a professional email' },
  { icon: Search, text: 'Compare React vs Vue in 2025' },
];

export function ChatPage() {
  const { sessions, activeSessionId, isStreaming } = useChatStore();
  const session = sessions.find((s) => s.id === activeSessionId);
  const projects = useProjectStore((s) => s.projects);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const createSession = useChatStore((s) => s.createSession);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastAssistantMessage = useChatStore((s) => s.updateLastAssistantMessage);
  const replaceSessionMessages = useChatStore((s) => s.replaceSessionMessages);
  const updateSessionTitle = useChatStore((s) => s.updateSessionTitle);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);
  const providers = useSettingsStore((s) => s.providers);

  const models = useMemo(() => getActiveModels(providers), [providers]);
  const activeModelId = defaultModelId;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const getModelName = (modelId: string) =>
    models.find((m) => m.id === modelId)?.name || modelId;

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

  const lastMessageContent = session?.messages?.[session.messages.length - 1]?.content;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'instant',
    });
  }, [session?.messages?.length, lastMessageContent, isStreaming]);

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
      timestamp: Date.now(),
    };
    addMessage(sessionId, assistantMsg);
    setStreaming(true);

    try {
      const model = models.find((m) => m.id === modelId);
      const provider = providers.find((p) => p.id === model?.providerId);
      const baseUrl = provider?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = provider?.apiKey || undefined;

      const chatMessages = useChatStore
        .getState()
        .getActiveSession()
        ?.messages.filter((m) => m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })) || [];

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(modelId), chatMessages, model?.providerId);
      let accumulated = '';

      for await (const chunk of stream) {
        accumulated += chunk;
        updateLastAssistantMessage(sessionId, accumulated);
      }
    } catch (e) {
      const errorContent = `Error: ${e instanceof Error ? e.message : 'Failed to get response'}`;
      updateLastAssistantMessage(sessionId, errorContent);
    } finally {
      setStreaming(false);
    }
  };

  const handleRegenerate = async (messageIndex: number) => {
    if (!session || isStreaming) return;

    const modelId = session.modelId || activeModelId;
    if (!modelId) return;
    const messagesBefore = session.messages.slice(0, messageIndex);
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
    };

    replaceSessionMessages(session.id, [...messagesBefore, assistantMsg]);
    setStreaming(true);

    try {
      const model = models.find((m) => m.id === modelId);
      const provider = providers.find((p) => p.id === model?.providerId);
      const baseUrl = provider?.baseUrl || 'https://openrouter.ai/api/v1';
      const apiKey = provider?.apiKey || undefined;

      const chatMessages = messagesBefore
        .filter((m) => m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const stream = streamChat(baseUrl, apiKey, stripProviderPrefix(modelId), chatMessages, model?.providerId);
      let accumulated = '';

      for await (const chunk of stream) {
        accumulated += chunk;
        updateLastAssistantMessage(session.id, accumulated);
      }
    } catch (e) {
      const errorContent = `Error: ${e instanceof Error ? e.message : 'Failed to get response'}`;
      updateLastAssistantMessage(session.id, errorContent);
    } finally {
      setStreaming(false);
    }
  };

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
                  className="w-16 h-16 mx-auto mb-4"
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
            const isLastEmpty = msg.role === 'assistant' && msg.content === '' && isStreaming && idx === (session?.messages.length ?? 0) - 1;
            if (isLastEmpty) return null;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === 'user' ? (
                  <UserMessage content={msg.content} timestamp={msg.timestamp} />
                ) : (
                  <AssistantMessage
                    content={msg.content}
                    modelId={session?.modelId ?? ''}
                    timestamp={msg.timestamp}
                    getModelName={getModelName}
                    isError={msg.content.startsWith('Error:')}
                    onRegenerate={() => handleRegenerate(idx)}
                  />
                )}
              </motion.div>
            );
          })}

          {isStreaming && session && session.messages[session.messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] flex gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 mt-1">
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

function UserMessage({ content, timestamp }: { content: string; timestamp: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-end group">
      <div className="max-w-[85%]">
        <div className="text-xs text-white/30 mb-1 text-right font-medium">You</div>
        <div className="relative">
          <div className="text-sm leading-relaxed rounded-2xl rounded-tr-md px-4 py-3 bg-slate-900/40 backdrop-blur-lg text-white/90 border border-teal-400/15">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
          <div className="flex items-center gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/5">
              <span className="text-[10px] text-white/40 mr-1">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
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
}

function AssistantMessage({
  content,
  modelId,
  timestamp,
  getModelName,
  isError,
  onRegenerate,
}: {
  content: string;
  modelId: string;
  timestamp: number;
  getModelName: (id: string) => string;
  isError: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-start group">
      <div className="max-w-[85%] flex gap-2.5">
        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 mt-1">
          <DotLottieReact
            data={chpioAvatar}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/30 mb-1.5 font-medium">ChPio</div>
          <div
            className={`text-sm leading-relaxed rounded-2xl rounded-tl-md px-4 py-3 backdrop-blur-lg border ${
              isError
                ? 'bg-red-900/40 border-red-400/20 text-red-300/90'
                : 'bg-slate-900/40 border-white/10 text-white/85'
            }`}
          >
            <MessageContent content={content} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/5">
              <span className="text-[10px] text-white/40">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/40">{getModelName(modelId)}</span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer ml-1"
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
              </button>
              {isError && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded-md text-white/40 hover:text-teal-400 hover:bg-white/10 transition-all cursor-pointer"
                  title="Retry"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match) {
            return <CodeBlock language={match[1]} code={codeString} />;
          }

          return (
            <code
              className="bg-white/10 text-teal-300/90 px-1.5 py-0.5 rounded-md text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>;
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold mb-2 text-white">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:underline"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-teal-400/30 pl-3 text-white/60 italic mb-2">
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-white/10 px-3 py-1.5 text-left text-white/70 bg-white/5 font-medium">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-white/10 px-3 py-1.5 text-white/70">{children}</td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden mb-3 border border-white/5">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-white/5">
        <span className="text-xs text-white/30 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-teal-400" />
              <span className="text-teal-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'rgba(15, 20, 19, 0.8)',
          fontSize: '0.8rem',
          lineHeight: '1.5',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
