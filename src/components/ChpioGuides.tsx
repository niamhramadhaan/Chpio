import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  X,
  Rocket,
  MessageSquare,
  StickyNote,
  FileText,
  Search,
  Mail,
  Database,
  Keyboard,
  ChevronRight,
  Brain,
  Sparkles,
  Paperclip,
  Download,
  Pin,
  Zap,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface GuideItem {
  title: string;
  description: string;
  icon?: React.ElementType;
  tip?: string;
  shortcut?: string[];
  steps?: string[];
}

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  items: GuideItem[];
}

const SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'Getting Started',
    color: 'text-emerald-400',
    items: [
      {
        title: 'Set up a provider',
        description: 'Connect an AI provider to start chatting.',
        steps: ['Open Settings (gear icon)', 'Go to Providers tab', 'Add your API key', 'Click Sync Models'],
        tip: 'OpenRouter gives you access to 100+ models with a single API key.',
      },
      {
        title: 'Start chatting',
        description: 'Type in the CommandBar at the bottom and press Enter. Your first chat session is created automatically.',
        icon: MessageSquare,
      },
      {
        title: 'Choose a model',
        description: 'Click the model name in the CommandBar to switch between available models.',
        tip: 'Set a default model in Settings → Default Model to avoid selecting it every time.',
      },
      {
        title: 'Local AI (no API key)',
        description: 'Run AI models directly in your browser via WebGPU. No API key needed.',
        icon: Zap,
        tip: 'Enable "Local (Browser)" provider in Settings. Works best with Chrome or Edge 113+.',
      },
    ],
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Chat Features',
    color: 'text-teal-400',
    items: [
      {
        title: 'Thinking mode',
        description: 'Let the AI show its reasoning process step by step.',
        icon: Brain,
        tip: 'Works with DeepSeek, Gemini, and other thinking-capable models.',
      },
      {
        title: 'Memory context',
        description: 'Include your saved memories in the AI\'s context for personalized responses.',
        icon: Database,
      },
      {
        title: 'Chpio mode',
        description: 'Interactive responses with goals, clickable options, and structured outputs.',
        icon: Sparkles,
      },
      {
        title: 'Attach files',
        description: 'Supports text, PDF, DOCX, and images. The AI can read and analyze them.',
        icon: Paperclip,
        tip: 'Drag & drop files directly onto the CommandBar for quick attachment.',
      },
      {
        title: 'Export chat',
        description: 'Save your conversation as .md, .txt, or copy to clipboard.',
        icon: Download,
      },
    ],
  },
  {
    id: 'notes',
    icon: StickyNote,
    title: 'Notes & Tasks',
    color: 'text-amber-400',
    items: [
      {
        title: 'Organize with folders',
        description: 'Create folders to organize your notes by topic or project.',
        icon: StickyNote,
      },
      {
        title: 'Track tasks',
        description: 'Add checkbox tasks inside any note. Progress is shown on each note card.',
        steps: ['Open a note', 'Add a task item', 'Check it off when done'],
      },
      {
        title: 'Pin important notes',
        description: 'Keep your most-used notes at the top of the list.',
        icon: Pin,
      },
      {
        title: 'Quick Capture',
        description: 'Instantly save a note without leaving your current view.',
        shortcut: ['⌘', '⇧', 'Q'],
        tip: 'Notes are saved to a "Quick Notes" folder automatically.',
      },
    ],
  },
  {
    id: 'docs',
    icon: FileText,
    title: 'Documents',
    color: 'text-blue-400',
    items: [
      {
        title: 'Rich text editor',
        description: 'Create documents with headings, bold, italic, tables, code blocks, and more.',
        icon: FileText,
      },
      {
        title: 'Export options',
        description: 'Export documents as Markdown, HTML, or Word (.docx) format.',
        icon: Download,
      },
      {
        title: 'Use as AI context',
        description: 'Attach documents to chat sessions so the AI can read and reference them.',
        icon: Brain,
        tip: 'Great for giving the AI code files, articles, or reference material.',
      },
    ],
  },
  {
    id: 'research',
    icon: Search,
    title: 'Deep Research',
    color: 'text-purple-400',
    items: [
      {
        title: 'How it works',
        description: 'ChPio runs a multi-step research pipeline to find and synthesize information.',
        steps: ['Plan — generate search queries', 'Search — find relevant sources', 'Read — extract key facts', 'Evaluate — decide if more research needed', 'Report — synthesize findings'],
      },
      {
        title: 'Set up Tavily',
        description: 'Get a free API key from tavily.com to enable web search for deep research.',
        tip: 'Tavily offers 1000 free searches per month.',
      },
    ],
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email',
    color: 'text-rose-400',
    items: [
      {
        title: 'Connect your email',
        description: 'Configure IMAP/SMTP in Settings → Email. Supports Gmail, Outlook, and custom servers.',
        steps: ['Go to Settings → Email', 'Add your email account details', 'Configure IMAP and SMTP settings', 'Test the connection'],
      },
      {
        title: 'AI triage',
        description: 'ChPio automatically classifies emails as urgent, FYI, newsletter, or spam.',
        icon: Zap,
      },
      {
        title: 'Smart replies',
        description: 'Generate draft responses based on the email thread context.',
        icon: MessageSquare,
      },
    ],
  },
  {
    id: 'memory',
    icon: Database,
    title: 'Memory',
    color: 'text-violet-400',
    items: [
      {
        title: 'How memory works',
        description: 'Save important facts, preferences, and context. The AI references these when Memory is toggled on.',
        icon: Database,
      },
      {
        title: 'Organize with tags',
        description: 'Tag memories to filter and find related entries quickly.',
      },
      {
        title: 'Auto-summarize',
        description: 'Click "Remember" on any chat message to let the AI extract and save key facts.',
        icon: Sparkles,
        tip: 'The AI looks for preferences, goals, patterns, and project context.',
      },
    ],
  },
  {
    id: 'shortcuts',
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    color: 'text-white/50',
    items: [
      {
        title: 'Command Palette',
        description: 'Search across all chats, notes, docs, and memory. Jump to any feature.',
        shortcut: ['⌘', 'K'],
      },
      {
        title: 'Quick Capture',
        description: 'Instantly save a note without leaving your current view.',
        shortcut: ['⌘', '⇧', 'Q'],
      },
      {
        title: 'Keyboard Shortcuts',
        description: 'View all available keyboard shortcuts.',
        shortcut: ['⌘', '/'],
      },
      {
        title: 'Search Messages',
        description: 'Search within the current chat conversation.',
        shortcut: ['⌘', 'F'],
      },
      {
        title: 'Focus Mode',
        description: 'Distraction-free chat. Open via Command Palette (⌘K) → Toggle Focus Mode.',
        icon: Search,
      },
    ],
  },
];

function ShortcutBadge({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.12] text-[11px] text-white/40 font-mono min-w-[26px] text-center"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/40 font-medium shrink-0">
            {i + 1}
          </span>
          <span className="text-[11px] text-white/40">{step}</span>
          {i < steps.length - 1 && (
            <ArrowRight className="w-3 h-3 text-white/15 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function TipBox({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-teal-400/[0.04]">
      <Lightbulb className="w-3 h-3 text-teal-400/50 shrink-0 mt-0.5" />
      <p className="text-[11px] text-teal-400/50 leading-relaxed">{text}</p>
    </div>
  );
}

export function ChpioGuides() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('chpio:open-guides', handler);
    return () => window.removeEventListener('chpio:open-guides', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl h-[70vh] bg-[#1A201F]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-white/70 font-medium">ChPio Guides</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-48 shrink-0 border-r border-white/[0.06] overflow-y-auto py-1.5 bg-white/[0.01]">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = s.id === activeSection;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.06] text-white/80'
                          : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? s.color : ''}`} />
                      <span className="truncate">{s.title}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-white/20" />}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex items-center gap-2.5 mb-5">
                  {(() => { const Icon = section.icon; return <Icon className={`w-5 h-5 ${section.color}`} />; })()}
                  <h3 className="text-white/80 text-sm font-medium">{section.title}</h3>
                </div>
                <div className="space-y-4">
                  {section.items.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} className="group">
                        <div className="flex items-start gap-2.5">
                          {ItemIcon && (
                            <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                              <ItemIcon className={`w-3 h-3 ${section.color} opacity-60`} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white/60 text-xs font-medium">{item.title}</p>
                            <p className="text-white/30 text-[11px] leading-relaxed mt-0.5">{item.description}</p>
                            {item.shortcut && <ShortcutBadge keys={item.shortcut} />}
                            {item.steps && <StepList steps={item.steps} />}
                            {item.tip && <TipBox text={item.tip} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-white/[0.01] shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-white/15">{SECTIONS.length} sections · {SECTIONS.reduce((acc, s) => acc + s.items.length, 0)} guides</span>
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] text-white/25 hover:text-white/40 transition-colors cursor-pointer"
              >
                Press Esc to close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
