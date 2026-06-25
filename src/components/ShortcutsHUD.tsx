import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open Command Palette', category: 'General' },
  { keys: ['⌘', '⇧', 'Q'], description: 'Quick Capture note', category: 'General' },
  { keys: ['⌘', '/'], description: 'Keyboard Shortcuts', category: 'General' },
  { keys: ['Esc'], description: 'Close overlay / Cancel', category: 'General' },

  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in message', category: 'Chat' },
  { keys: ['⌘', 'F'], description: 'Search messages in chat', category: 'Chat' },

  { keys: ['⌘', 'B'], description: 'Bold text', category: 'Text Editing' },
  { keys: ['⌘', 'I'], description: 'Italic text', category: 'Text Editing' },
  { keys: ['⌘', 'U'], description: 'Underline text', category: 'Text Editing' },
  { keys: ['⌘', 'Z'], description: 'Undo', category: 'Text Editing' },
  { keys: ['⌘', '⇧', 'Z'], description: 'Redo', category: 'Text Editing' },
];

const CATEGORIES = ['General', 'Chat', 'Text Editing'];

export function ShortcutsHUD() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('chpio:open-shortcuts', handler);
    return () => window.removeEventListener('chpio:open-shortcuts', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return SHORTCUTS;
    const q = query.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.keys.some((k) => k.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Shortcut[]>();
    for (const cat of CATEGORIES) {
      const items = filtered.filter((s) => s.category === cat);
      if (items.length > 0) groups.set(cat, items);
    }
    return groups;
  }, [filtered]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#1A201F]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <Keyboard className="w-4 h-4 text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shortcuts..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.12] text-[10px] text-white/25 font-mono">
                ESC
              </kbd>
            </div>

            {/* Table header */}
            <div className="flex items-center px-4 py-2 border-b border-white/[0.04]">
              <span className="flex-1 text-[10px] text-white/20 font-medium uppercase tracking-wider">Action</span>
              <span className="w-32 text-right text-[10px] text-white/20 font-medium uppercase tracking-wider">Shortcut</span>
            </div>

            {/* Table body */}
            <div className="max-h-[50vh] overflow-y-auto">
              {grouped.size === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-white/20 text-sm">No shortcuts found</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    {/* Category band */}
                    <div className="px-4 py-1.5 bg-white/[0.02] border-b border-white/[0.03]">
                      <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider">{category}</p>
                    </div>
                    {/* Rows */}
                    {items.map((item, i) => (
                      <div
                        key={`${category}-${i}`}
                        className="flex items-center px-4 py-2 hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-b-0"
                      >
                        <span className="flex-1 text-[13px] text-white/55">{item.description}</span>
                        <div className="w-32 flex items-center justify-end gap-1 shrink-0">
                          {item.keys.map((key, ki) => (
                            <kbd
                              key={ki}
                              className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.12] text-[11px] text-white/40 font-mono min-w-[26px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01]">
              <span className="text-[10px] text-white/15">{filtered.length} shortcuts</span>
              <span className="text-[10px] text-white/15">Press <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/20 font-mono mx-0.5">⌘/</kbd> to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
