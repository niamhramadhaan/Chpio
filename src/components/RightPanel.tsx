import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { BottomDock } from './BottomDock';
import { ChatHistoryPanel } from './panels/ChatHistoryPanel';
import { NotesPage } from '../pages/NotesPage';
import { DocsPage } from '../pages/DocsPage';
import { ResearchPage } from '../pages/ResearchPage';
import { CalendarPage } from '../pages/CalendarPage';
import { MemoryPage } from '../pages/MemoryPage';
import { SettingsPanel } from './panels/SettingsPanel';

const rightPages = ['chat', 'notes', 'docs', 'research', 'calendar', 'memory', 'settings'] as const;

export function RightPanel() {
  const activeFeature = useAppStore((s) => s.activeFeature);
  const showRight = rightPages.includes(activeFeature as typeof rightPages[number]);

  return (
    <AnimatePresence>
      {showRight && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '35%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="h-full overflow-hidden border-l border-white/5 shrink-0"
        >
          <div className="w-full h-full flex flex-col bg-[#0f1413]/60 backdrop-blur-md">
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeFeature === 'chat' && <ChatHistoryPanel />}
              {activeFeature === 'notes' && <NotesPage />}
              {activeFeature === 'docs' && <DocsPage />}
              {activeFeature === 'research' && <ResearchPage />}
              {activeFeature === 'calendar' && <CalendarPage />}
              {activeFeature === 'memory' && <MemoryPage />}
              {activeFeature === 'settings' && <SettingsPanel />}
            </div>

            <div className="shrink-0 border-t border-white/5">
              <BottomDock />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
