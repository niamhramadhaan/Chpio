import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, type Transition } from 'motion/react';
import { useLocation } from 'wouter';
import {
  MessageSquare,
  StickyNote,
  FileText,
  Search,
  Mail,
  Database,
  Palette,
  MoreHorizontal,
  Focus,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { buildPath } from '../router';
import type { Feature } from '../types';

interface DockItem {
  id: number;
  feature: Feature;
  icon: React.ElementType;
  label: string;
}

const primaryItems: DockItem[] = [
  { id: 1, feature: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 2, feature: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 3, feature: 'docs', icon: FileText, label: 'Docs' },
  { id: 4, feature: 'research', icon: Search, label: 'Research' },
  { id: 5, feature: 'email', icon: Mail, label: 'Email' },
];

const secondaryItems: DockItem[] = [
  { id: 6, feature: 'memory', icon: Database, label: 'Memory' },
  { id: 7, feature: 'imagegen', icon: Palette, label: 'Image Gen' },
];

const dockSpring: Transition = {
  stiffness: 300,
  damping: 22,
  mass: 0.7,
};

export function BottomDock() {
  const { activeFeature, setActiveFeature, focusMode, toggleFocusMode } = useAppStore();
  const [, navigate] = useLocation();
  const [animateSelected, setAnimateSelected] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  const handleClick = (item: DockItem) => {
    setActiveFeature(item.feature);
    navigate(buildPath(item.feature));
    setAnimateSelected(item.id);
    setMoreOpen(false);
    setTimeout(() => setAnimateSelected(null), 200);
  };

  const handleMoreClick = useCallback(() => {
    if (moreButtonRef.current) {
      setButtonRect(moreButtonRef.current.getBoundingClientRect());
    }
    setMoreOpen((prev) => !prev);
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  // Close on scroll
  useEffect(() => {
    if (!moreOpen) return;
    const handler = () => setMoreOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [moreOpen]);

  const isSecondaryActive = secondaryItems.some((item) => item.feature === activeFeature);

  return (
    <div className="flex w-full items-center justify-center py-2 sm:py-3">
      <motion.div
        layout
        transition={dockSpring}
        className="relative flex items-end gap-1.5 sm:gap-2 rounded-2xl border border-white/10 bg-[#1A201F]/80 backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg overflow-x-auto scrollbar-none"
      >
        {primaryItems.map((item) => {
          const isActive = activeFeature === item.feature;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              className="relative"
              onClick={() => handleClick(item)}
              style={{ transformOrigin: 'bottom' }}
              initial={{ scale: 1 }}
              whileHover={{ y: -4 }}
              animate={{
                scale: animateSelected === item.id ? 1.2 : 1,
                y: animateSelected === item.id ? -6 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 550,
                damping: 15,
                mass: 1.1,
              }}
            >
              <motion.div
                className={`cursor-pointer rounded-xl p-2 transition-colors duration-200 ${
                  isActive
                    ? 'bg-teal-400/15'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                title={item.label}
                aria-label={item.label}
                role="button"
                tabIndex={0}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-all duration-200 ${
                    isActive ? 'text-teal-400' : 'text-white/40'
                  }`}
                />
              </motion.div>

              <motion.div
                className={`absolute mt-0.5 flex w-full items-center justify-center opacity-0 transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : ''
                }`}
              >
                <div
                  className="rounded-full bg-teal-400"
                  style={{ width: 4, height: 4 }}
                />
              </motion.div>
            </motion.div>
          );
        })}

        {/* More button */}
        <div className="relative" ref={moreRef}>
          <motion.div
            className="relative"
            ref={moreButtonRef}
            onClick={handleMoreClick}
            style={{ transformOrigin: 'bottom' }}
            initial={{ scale: 1 }}
            whileHover={{ y: -4 }}
          >
            <motion.div
              className={`cursor-pointer rounded-xl p-2 transition-colors duration-200 ${
                isSecondaryActive || moreOpen
                  ? 'bg-teal-400/15'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              title="More"
              aria-label="More features"
              role="button"
              tabIndex={0}
            >
              <MoreHorizontal
                className={`w-[18px] h-[18px] transition-all duration-200 ${
                  isSecondaryActive ? 'text-teal-400' : 'text-white/40'
                }`}
              />
            </motion.div>

            {isSecondaryActive && (
              <motion.div
                className="absolute mt-0.5 flex w-full items-center justify-center"
              >
                <div
                  className="rounded-full bg-teal-400"
                  style={{ width: 4, height: 4 }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Dropdown via portal */}
          {moreOpen && buttonRect && createPortal(
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                bottom: window.innerHeight - buttonRect.top + 8,
                left: buttonRect.right - 176,
                zIndex: 9999,
              }}
              className="w-44 bg-[#1A201F] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              ref={(el) => {
                // Update ref for outside-click detection
                if (el && moreRef.current) {
                  (moreRef as any).current = el;
                }
              }}
            >
              <div className="p-1">
                {secondaryItems.map((item) => {
                  const isActive = activeFeature === item.feature;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-400/15 text-teal-400'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
                <div className="h-px bg-white/5 mx-2 my-1" />
                <button
                  onClick={() => {
                    toggleFocusMode();
                    setMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    focusMode
                      ? 'bg-teal-400/15 text-teal-400'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Focus className="w-4 h-4" />
                  {focusMode ? 'Exit Focus' : 'Focus Mode'}
                </button>
              </div>
            </motion.div>,
            document.body
          )}
        </div>
      </motion.div>
    </div>
  );
}
