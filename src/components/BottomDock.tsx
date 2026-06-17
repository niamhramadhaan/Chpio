import { useState } from 'react';
import { motion, type Transition } from 'motion/react';
import {
  MessageSquare,
  StickyNote,
  FileText,
  Search,
  Calendar,
  Database,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Feature } from '../types';

interface DockItem {
  id: number;
  feature: Feature;
  icon: React.ElementType;
  label: string;
}

const dockItems: DockItem[] = [
  { id: 1, feature: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 2, feature: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 3, feature: 'docs', icon: FileText, label: 'Docs' },
  { id: 4, feature: 'research', icon: Search, label: 'Research' },
  { id: 5, feature: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 6, feature: 'memory', icon: Database, label: 'Memory' },
];

const dockSpring: Transition = {
  stiffness: 300,
  damping: 22,
  mass: 0.7,
};

export function BottomDock() {
  const { activeFeature, setActiveFeature } = useAppStore();
  const [animateSelected, setAnimateSelected] = useState<number | null>(null);

  const handleClick = (item: DockItem) => {
    setActiveFeature(item.feature);
    setAnimateSelected(item.id);
    setTimeout(() => setAnimateSelected(null), 200);
  };

  return (
    <div className="flex w-full items-center justify-center py-2 sm:py-3">
      <motion.div
        layout
        transition={dockSpring}
        className="relative flex items-end gap-1.5 sm:gap-2 rounded-2xl border border-white/10 bg-[#1A201F]/80 backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg overflow-x-auto scrollbar-none"
      >
        {dockItems.map((item) => {
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
      </motion.div>
    </div>
  );
}
