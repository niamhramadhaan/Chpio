import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import {
  Search,
  MessageSquare,
  StickyNote,
  FileText,
  Database,
  Settings,
  Mail,
  Palette,
  Plus,
  Compass,
  Focus,
  CornerDownLeft,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChatStore } from '../store/chatStore';
import { useNotesStore } from '../store/notesStore';
import { useDocsStore } from '../store/docsStore';
import { useMemoryStore } from '../store/memoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { buildPath } from '../router';
import type { Feature } from '../types';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);
  const [, navigate] = useLocation();

  const sessions = useChatStore((s) => s.sessions);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const createSession = useChatStore((s) => s.createSession);
  const notes = useNotesStore((s) => s.notes);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const setActiveFolder = useNotesStore((s) => s.setActiveFolder);
  const docs = useDocsStore((s) => s.docs);
  const setActiveDoc = useDocsStore((s) => s.setActiveDoc);
  const memories = useMemoryStore((s) => s.memories);
  const providers = useSettingsStore((s) => s.providers);
  const defaultModelId = useSettingsStore((s) => s.defaultModelId);

  // Open/close with Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Open from notification footer
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('chpio:open-command-palette', handler);
    return () => window.removeEventListener('chpio:open-command-palette', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const navigateTo = useCallback((feature: Feature, sessionId?: string, noteId?: string, docId?: string) => {
    setView('workspace');
    setActiveFeature(feature);
    if (sessionId) setActiveSession(sessionId);
    if (noteId) {
      setActiveNote(noteId);
      const note = notes.find((n) => n.id === noteId);
      if (note) setActiveFolder(note.folderId);
    }
    if (docId) setActiveDoc(docId);
    navigate(buildPath(feature, { sessionId, noteId, docId }));
    setOpen(false);
  }, [setView, setActiveFeature, setActiveSession, setActiveNote, setActiveFolder, setActiveDoc, notes, navigate]);

  const items = useMemo<CommandItem[]>(() => {
    const result: CommandItem[] = [];

    // Actions
    result.push(
      {
        id: 'action-new-chat',
        label: 'New Chat',
        description: 'Start a fresh conversation',
        icon: Plus,
        category: 'Actions',
        action: () => {
          const enabledProviders = providers.filter((p) => p.enabled && (p.apiKey || ['ollama', 'llamacpp', 'webllm', 'custom'].includes(p.id)));
          const firstModel = enabledProviders.length > 0 && enabledProviders[0].syncedModels.length > 0
            ? `${enabledProviders[0].id}/${enabledProviders[0].syncedModels[0].id}`
            : defaultModelId || '';
          if (firstModel) {
            createSession(firstModel);
            setView('workspace');
            setActiveFeature('chat');
            navigate('/chat');
            setOpen(false);
          }
        },
        keywords: ['new', 'chat', 'create', 'start'],
      },
      {
        id: 'action-focus-mode',
        label: 'Toggle Focus Mode',
        description: 'Distraction-free chat',
        icon: Focus,
        category: 'Actions',
        action: () => {
          toggleFocusMode();
          setOpen(false);
        },
        keywords: ['focus', 'zen', 'fullscreen', 'distraction'],
      },
      {
        id: 'action-settings',
        label: 'Open Settings',
        description: 'Providers, models, wallpaper',
        icon: Settings,
        category: 'Actions',
        action: () => {
          setSettingsModalOpen(true);
          setOpen(false);
        },
        keywords: ['settings', 'config', 'preferences', 'provider', 'model'],
      },
      {
        id: 'action-guides',
        label: 'Chpio Guides',
        description: 'Tutorial & how-to guides',
        icon: Compass,
        category: 'Actions',
        action: () => {
          window.dispatchEvent(new Event('chpio:open-guides'));
          setOpen(false);
        },
        keywords: ['guides', 'tutorial', 'help', 'how', 'learn'],
      },
    );

    // Features
    const features: { feature: Feature; label: string; icon: React.ElementType; keywords: string[] }[] = [
      { feature: 'notes', label: 'Go to Notes', icon: StickyNote, keywords: ['notes', 'sticky', 'pocket'] },
      { feature: 'docs', label: 'Go to Docs', icon: FileText, keywords: ['docs', 'documents', 'editor'] },
      { feature: 'research', label: 'Go to Research', icon: Compass, keywords: ['research', 'search', 'deep'] },
      { feature: 'email', label: 'Go to Email', icon: Mail, keywords: ['email', 'mail', 'inbox'] },
      { feature: 'memory', label: 'Go to Memory', icon: Database, keywords: ['memory', 'memories', 'store'] },
      { feature: 'imagegen', label: 'Go to Image Gen', icon: Palette, keywords: ['image', 'generate', 'art', 'picture'] },
    ];

    features.forEach((f) => {
      result.push({
        id: `nav-${f.feature}`,
        label: f.label,
        icon: f.icon,
        category: 'Navigate',
        action: () => {
          setView('workspace');
          setActiveFeature(f.feature);
          navigate(buildPath(f.feature));
          setOpen(false);
        },
        keywords: f.keywords,
      });
    });

    // Chats (non-archived, sorted by recent)
    const activeChats = sessions
      .filter((s) => !s.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20);

    activeChats.forEach((session) => {
      result.push({
        id: `chat-${session.id}`,
        label: session.title || 'New Chat',
        description: session.messages.length > 0 ? `${session.messages.length} messages` : undefined,
        icon: MessageSquare,
        category: 'Chats',
        action: () => navigateTo('chat', session.id),
        keywords: ['chat', session.title?.toLowerCase() || ''],
      });
    });

    // Notes (non-archived)
    const activeNotes = notes
      .filter((n) => !n.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 15);

    activeNotes.forEach((note) => {
      result.push({
        id: `note-${note.id}`,
        label: note.title || 'Untitled Note',
        description: note.content ? note.content.slice(0, 60) : undefined,
        icon: StickyNote,
        category: 'Notes',
        action: () => navigateTo('notes', undefined, note.id),
        keywords: ['note', note.title?.toLowerCase() || '', note.content?.toLowerCase() || ''],
      });
    });

    // Docs
    const activeDocs = docs
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);

    activeDocs.forEach((doc) => {
      result.push({
        id: `doc-${doc.id}`,
        label: doc.title || 'Untitled Doc',
        description: doc.content ? doc.content.slice(0, 60) : undefined,
        icon: FileText,
        category: 'Docs',
        action: () => navigateTo('docs', undefined, undefined, doc.id),
        keywords: ['doc', 'document', doc.title?.toLowerCase() || ''],
      });
    });

    // Memory
    const recentMemories = memories
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);

    recentMemories.forEach((memory) => {
      result.push({
        id: `memory-${memory.id}`,
        label: memory.content.slice(0, 50) + (memory.content.length > 50 ? '...' : ''),
        description: memory.tags.length > 0 ? memory.tags.join(', ') : undefined,
        icon: Database,
        category: 'Memory',
        action: () => {
          setView('workspace');
          setActiveFeature('memory');
          navigate(buildPath('memory'));
          setOpen(false);
        },
        keywords: ['memory', memory.content.toLowerCase(), ...memory.tags],
      });
    });

    return result;
  }, [sessions, notes, docs, memories, providers, defaultModelId, navigateTo, setView, setActiveFeature, createSession, toggleFocusMode, setSettingsModalOpen]);

  // Fuzzy search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      const searchable = [item.label, item.description, ...item.keywords].join(' ').toLowerCase();
      // Simple fuzzy: all chars of query must appear in order
      let qi = 0;
      for (let si = 0; si < searchable.length && qi < q.length; si++) {
        if (searchable[si] === q[qi]) qi++;
      }
      return qi === q.length;
    });
  }, [items, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const existing = groups.get(item.category);
      if (existing) existing.push(item);
      else groups.set(item.category, [item]);
    }
    return groups;
  }, [filtered]);

  const flatItems = useMemo(() => {
    const result: CommandItem[] = [];
    for (const items of grouped.values()) {
      result.push(...items);
    }
    return result;
  }, [grouped]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const accentColor = 'text-teal-400';
  const accentBg = 'bg-teal-400/15';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-lg bg-[#1A201F]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats, notes, docs, actions..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/25 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1.5">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-white/20 text-sm">No results</p>
                  <p className="text-white/10 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([category, categoryItems]) => {
                  const startIndex = flatItems.indexOf(categoryItems[0]);
                  return (
                    <div key={category}>
                      <div className="px-4 py-1.5">
                        <p className="text-[10px] text-white/20 font-medium uppercase tracking-wider">{category}</p>
                      </div>
                      {categoryItems.map((item, i) => {
                        const globalIndex = startIndex + i;
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            data-index={globalIndex}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer ${
                              isSelected ? accentBg : 'hover:bg-white/5'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? accentColor : 'text-white/30'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-[11px] text-white/25 truncate mt-0.5">{item.description}</p>
                              )}
                            </div>
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5">
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/20 font-mono">↑↓</kbd>
                <span className="text-[10px] text-white/15">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/20 font-mono">↵</kbd>
                <span className="text-[10px] text-white/15">Open</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/20 font-mono">ESC</kbd>
                <span className="text-[10px] text-white/15">Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
