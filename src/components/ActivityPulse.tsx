import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import {
  MessageSquare,
  StickyNote,
  FileText,
  Database,
  ChevronDown,
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useNotesStore } from '../store/notesStore';
import { useDocsStore } from '../store/docsStore';
import { useMemoryStore } from '../store/memoryStore';
import { useAppStore } from '../store/appStore';
import { buildPath } from '../router';
import { relativeTime } from '../utils/relativeTime';
import type { Feature } from '../types';

interface ActivityItem {
  id: string;
  icon: React.ElementType;
  label: string;
  detail: string;
  time: number;
  feature: Feature;
  color: string;
}

export function ActivityPulse() {
  const sessions = useChatStore((s) => s.sessions);
  const notes = useNotesStore((s) => s.notes);
  const docs = useDocsStore((s) => s.docs);
  const memories = useMemoryStore((s) => s.memories);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const all: ActivityItem[] = [];

    // Recent chats
    sessions
      .filter((s) => !s.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .forEach((s) => {
        all.push({
          id: `chat-${s.id}`,
          icon: MessageSquare,
          label: s.title || 'New Chat',
          detail: `${s.messages.length} messages`,
          time: s.updatedAt,
          feature: 'chat',
          color: 'text-teal-400',
        });
      });

    // Recent notes
    notes
      .filter((n) => !n.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 2)
      .forEach((n) => {
        all.push({
          id: `note-${n.id}`,
          icon: StickyNote,
          label: n.title || 'Untitled Note',
          detail: n.tasks.length > 0 ? `${n.tasks.filter((t) => t.done).length}/${n.tasks.length} tasks` : 'Note',
          time: n.updatedAt,
          feature: 'notes',
          color: 'text-amber-400',
        });
      });

    // Recent docs
    docs
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 2)
      .forEach((d) => {
        all.push({
          id: `doc-${d.id}`,
          icon: FileText,
          label: d.title || 'Untitled Doc',
          detail: 'Document',
          time: d.updatedAt,
          feature: 'docs',
          color: 'text-blue-400',
        });
      });

    // Recent memories
    memories
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 2)
      .forEach((m) => {
        all.push({
          id: `memory-${m.id}`,
          icon: Database,
          label: m.content.slice(0, 40) + (m.content.length > 40 ? '...' : ''),
          detail: m.tags.length > 0 ? m.tags[0] : 'Memory',
          time: m.createdAt,
          feature: 'memory',
          color: 'text-purple-400',
        });
      });

    return all.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [sessions, notes, docs, memories]);

  if (items.length === 0) return null;

  const handleClick = (item: ActivityItem) => {
    setView('workspace');
    setActiveFeature(item.feature);
    if (item.feature === 'chat') {
      const sessionId = item.id.replace('chat-', '');
      setActiveSession(sessionId);
      navigate(buildPath('chat', { sessionId }));
    } else {
      navigate(buildPath(item.feature));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="w-full max-w-2xl mt-4"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-2.5 cursor-pointer group"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-white/25 text-xs font-medium group-hover:text-white/40 transition-colors">Recent Activity</span>
        <ChevronDown className={`w-3 h-3 text-white/15 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    onClick={() => handleClick(item)}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[#1A201F]/50 backdrop-blur-sm border border-white/5
                               hover:border-white/10 hover:bg-white/5 transition-all duration-200 cursor-pointer text-left group"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.color} opacity-50 group-hover:opacity-80 transition-opacity`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-white/60 text-xs truncate group-hover:text-white/80 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-white/20 text-[10px] mt-0.5">
                        {relativeTime(item.time, true)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
