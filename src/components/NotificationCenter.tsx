import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useLocation } from 'wouter';
import {
  Bell,
  MessageSquare,
  Tag,
  AlertCircle,
  ListTodo,
  X,
  Search,
  Keyboard,
  BookOpen,
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useNotesStore } from '../store/notesStore';
import { useMemoryStore } from '../store/memoryStore';
import { useAppStore } from '../store/appStore';
import { buildPath } from '../router';
import type { Feature } from '../types';

interface Notification {
  id: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  time: number;
  color: string;
  feature: Feature;
  actionId?: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sessions = useChatStore((s) => s.sessions);
  const notes = useNotesStore((s) => s.notes);
  const memories = useMemoryStore((s) => s.memories);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const setActiveFolder = useNotesStore((s) => s.setActiveFolder);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const notifications = useMemo(() => {
    const items: Notification[] = [];

    notes
      .filter((n) => !n.archived && n.tasks.some((t) => !t.done))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 4)
      .forEach((n) => {
        const pending = n.tasks.filter((t) => !t.done).length;
        const total = n.tasks.length;
        items.push({
          id: `tasks-${n.id}`,
          icon: ListTodo,
          title: n.title || 'Untitled Note',
          detail: `${pending}/${total} tasks pending`,
          time: n.updatedAt,
          color: 'text-amber-400',
          feature: 'notes',
          actionId: n.id,
        });
      });

    sessions
      .filter((s) => {
        if (s.archived || s.messages.length === 0) return false;
        const last = s.messages[s.messages.length - 1];
        return last?.role === 'assistant' && last.content.startsWith('Error:');
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .forEach((s) => {
        const last = s.messages[s.messages.length - 1];
        const errorMsg = last.content.replace('Error: ', '').slice(0, 50);
        items.push({
          id: `error-${s.id}`,
          icon: AlertCircle,
          title: s.title || 'Chat',
          detail: errorMsg + (errorMsg.length >= 50 ? '...' : ''),
          time: s.updatedAt,
          color: 'text-red-400',
          feature: 'chat',
          actionId: s.id,
        });
      });

    sessions
      .filter((s) => !s.archived && s.messages.length === 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .forEach((s) => {
        items.push({
          id: `empty-${s.id}`,
          icon: MessageSquare,
          title: s.title || 'New Chat',
          detail: 'No messages yet',
          time: s.createdAt,
          color: 'text-white/30',
          feature: 'chat',
          actionId: s.id,
        });
      });

    memories
      .filter((m) => m.tags.length === 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .forEach((m) => {
        items.push({
          id: `untagged-${m.id}`,
          icon: Tag,
          title: 'Untagged memory',
          detail: m.content.slice(0, 50) + (m.content.length > 50 ? '...' : ''),
          time: m.updatedAt,
          color: 'text-purple-400',
          feature: 'memory',
        });
      });

    return items
      .filter((n) => !dismissed.has(n.id))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  }, [sessions, notes, memories, dismissed]);

  const count = notifications.length;

  const handleClick = (notification: Notification) => {
    setView('workspace');
    setActiveFeature(notification.feature);
    if (notification.feature === 'chat' && notification.actionId) {
      setActiveSession(notification.actionId);
      navigate(buildPath('chat', { sessionId: notification.actionId }));
    } else if (notification.feature === 'notes' && notification.actionId) {
      setActiveNote(notification.actionId);
      const note = notes.find((n) => n.id === notification.actionId);
      if (note) setActiveFolder(note.folderId);
      navigate(buildPath('notes', { noteId: notification.actionId }));
    } else {
      navigate(buildPath(notification.feature));
    }
    setOpen(false);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-teal-400 text-black text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(45,212,191,0.4)]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && createPortal(
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-80 bg-[#1A201F]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden z-[99999]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <span className="text-xs text-white/50 font-medium">Notifications</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 hover:text-white/60 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[50vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-8 h-8 mx-auto mb-2.5 rounded-full bg-white/[0.04] flex items-center justify-center animate-pulse">
                  <Bell className="w-4 h-4 text-white/10" />
                </div>
                <p className="text-white/20 text-xs">All clear</p>
                <p className="text-white/10 text-[10px] mt-1">No items need attention</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group relative"
                  >
                    {/* Hover accent bar */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-teal-400/0 group-hover:bg-teal-400/40 group-hover:h-4 rounded-r transition-all duration-200" />
                    <div className={`mt-0.5 ${notification.color} opacity-60`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{notification.title}</p>
                      <p className="text-[10px] text-white/30 truncate mt-0.5">{notification.detail}</p>
                    </div>
                    <button
                      onClick={(e) => handleDismiss(notification.id, e)}
                      className="text-white/10 hover:text-white/40 mt-0.5 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-2 py-2 border-t border-white/[0.06] bg-white/[0.01] flex items-center gap-1">
            <button
              onClick={() => { window.dispatchEvent(new Event('chpio:open-command-palette')); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Commands</span>
            </button>
            <button
              onClick={() => { window.dispatchEvent(new Event('chpio:open-shortcuts')); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Keyboard className="w-3 h-3" />
              <span>Shortcuts</span>
            </button>
            <button
              onClick={() => { window.dispatchEvent(new Event('chpio:open-guides')); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Guides</span>
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}
