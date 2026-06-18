import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { useAppStore, useIsMobile } from '../store/appStore';
import { BottomDock } from './BottomDock';
import { ChatHistoryPanel } from './panels/ChatHistoryPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { PageSkeleton, CardSkeleton } from './ui/skeleton';

const NotesPage = React.lazy(() => import('../pages/NotesPage'));
const DocsPage = React.lazy(() => import('../pages/DocsPage'));
const ResearchPage = React.lazy(() => import('../pages/ResearchPage'));
const EmailPage = React.lazy(() => import('../pages/EmailPage'));
const CalendarPage = React.lazy(() => import('../pages/CalendarPage'));
const MemoryPage = React.lazy(() => import('../pages/MemoryPage'));

const rightPages = ['chat', 'notes', 'docs', 'research', 'email', 'calendar', 'memory', 'settings'] as const;

function PageFallback({ type = 'default' }: { type?: 'default' | 'cards' }) {
  return (
    <div className="h-full overflow-hidden">
      {type === 'cards' ? <CardSkeleton /> : <PageSkeleton />}
    </div>
  );
}

export function RightPanel() {
  const activeFeature = useAppStore((s) => s.activeFeature);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const isMobile = useIsMobile();
  const showRight = rightPages.includes(activeFeature as typeof rightPages[number]);

  return (
    <AnimatePresence>
      {showRight && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: isMobile ? '100%' : '35%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`h-full overflow-hidden shrink-0 ${isMobile ? '' : 'border-l border-white/5'}`}
        >
          <div className="w-full h-full flex flex-col bg-[#0f1413]/60 backdrop-blur-md">
            {/* Mobile back button */}
            {isMobile && (
              <div className="shrink-0 px-3 pt-2 pb-1">
                <button
                  onClick={() => setActiveFeature('chat')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Back to Chat
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              <Suspense fallback={<PageFallback type={activeFeature === 'notes' ? 'cards' : 'default'} />}>
                {activeFeature === 'chat' && <ChatHistoryPanel />}
                {activeFeature === 'notes' && <NotesPage />}
                {activeFeature === 'docs' && <DocsPage />}
                {activeFeature === 'research' && <ResearchPage />}
                {activeFeature === 'email' && <EmailPage />}
                {activeFeature === 'calendar' && <CalendarPage />}
                {activeFeature === 'memory' && <MemoryPage />}
                {activeFeature === 'settings' && <SettingsPanel />}
              </Suspense>
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
