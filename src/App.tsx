import { useEffect, useMemo, useRef, useState } from 'react';
import { Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ChevronDown, Settings, ArrowRight } from 'lucide-react';
import { useAppStore, useIsMobile } from './store/appStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { WALLPAPERS } from './types';
import { CommandBar } from './components/CommandBar';
import { RightPanel } from './components/RightPanel';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingFooter } from './components/OnboardingFooter';
import { ChatPage } from './pages/ChatPage';
import { BottomDock } from './components/BottomDock';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import { QuickCapture } from './components/QuickCapture';
import { FocusModeOverlay } from './components/FocusModeOverlay';
import { ShortcutsHUD } from './components/ShortcutsHUD';
import { ActivityPulse } from './components/ActivityPulse';
import { ChpioGuides } from './components/ChpioGuides';
import { getActiveModels } from './utils/models';
import { relativeTime } from './utils/relativeTime';
import { useRouteSync } from './hooks/useRouteSync';
import type { ChatSession } from './types';

export default function App() {
  useRouteSync();

  const view = useAppStore((s) => s.view);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const autoSyncProviders = useSettingsStore((s) => s.autoSyncProviders);
  const wallpaper = useSettingsStore((s) => s.wallpaper);

  const isVideo = WALLPAPERS.find((w) => w.url === wallpaper)?.type === 'video' || wallpaper.endsWith('.mp4');

  useEffect(() => {
    loadSettings();
    // Auto-sync providers on app start (checks 12-hour interval)
    autoSyncProviders();
  }, [loadSettings, autoSyncProviders]);

  return (
    <Router hook={useHashLocation}>
    <div className="relative w-full h-screen overflow-hidden">
      {isVideo ? (
        <video
          src={wallpaper}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img
          src={wallpaper}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {view === 'onboarding' ? (
            <OnboardingView key="onboarding" />
          ) : (
            <WorkspaceView key="workspace" />
          )}
        </AnimatePresence>
      </ErrorBoundary>

      <ProfileModal />
      <SettingsModal />
      <ToastContainer />
      <CommandPalette />
      <QuickCapture />
      <FocusModeOverlay />
      <ShortcutsHUD />
      <ChpioGuides />
    </div>
    </Router>
  );
}

function OnboardingView() {
  const sessions = useChatStore((s) => s.sessions);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);
  const providers = useSettingsStore((s) => s.providers);

  const models = useMemo(() => getActiveModels(providers), [providers]);
  const hasConfiguredProvider = providers.some(
    (p) => p.enabled && (p.apiKey || ['ollama', 'llamacpp', 'webllm', 'custom'].includes(p.id)),
  );
  const recent = useMemo(() => [...sessions].filter((s) => !s.archived).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10), [sessions]);

  const [listOpen, setListOpen] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCardClick = (session: ChatSession) => {
    setActiveSession(session.id);
    setActiveFeature('chat');
    setView('workspace');
  };

  const getModelName = (modelId: string) => {
    const m = models.find((m) => m.id === modelId);
    if (m) return m.name;
    const providerId = modelId.split('/')[0];
    return modelId.replace(`${providerId}/`, '');
  };

  const shouldAnimate = listOpen && recent.length > 1;

  // Pause on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Calculate duration based on item count (keep similar speed to before)
  const marqueeDuration = recent.length * 4; // 4 seconds per item

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-white text-2xl sm:text-3xl font-serif font-light mb-6 sm:mb-8 tracking-wide italic opacity-90"
      >
        Welcome to <span className="text-teal-400 not-italic font-normal">ChPio</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full flex justify-center"
      >
        <CommandBar />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white/30 text-sm mt-6"
      >
        Chatting Pioneer — your self-hosted AI workspace
      </motion.p>

      {!hasConfiguredProvider && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={() => setSettingsModalOpen(true)}
          className="mt-5 flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                     bg-teal-400/10 border border-teal-400/20 hover:bg-teal-400/20
                     hover:border-teal-400/30 transition-all cursor-pointer group"
        >
          <Settings className="w-4 h-4 text-teal-400/70" />
          <span className="text-sm text-teal-400/80 group-hover:text-teal-400 transition-colors">
            Add an API key to get started
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-400/50 group-hover:text-teal-400/80 group-hover:translate-x-0.5 transition-all" />
        </motion.button>
      )}

      {recent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full max-w-2xl mt-6"
        >
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setListOpen(!listOpen)}
              className="flex items-center gap-1.5 text-white/25 text-xs hover:text-white/40 transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${listOpen ? '' : '-rotate-90'}`} />
              Recent Chats
            </button>
          </div>
          <AnimatePresence>
            {listOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-visible"
              >
                <div
                  className="overflow-hidden pb-2"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={`flex gap-3 ${shouldAnimate ? 'marquee' : ''} ${isPaused ? 'marquee-paused' : ''}`}
                    style={shouldAnimate ? { '--marquee-duration': `${marqueeDuration}s` } as React.CSSProperties : undefined}
                  >
                    {[...recent, ...recent].map((session, i) => (
                      <motion.button
                        key={`${session.id}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
                        onClick={() => handleCardClick(session)}
                        className="shrink-0 px-4 py-3 rounded-xl bg-[#1A201F]/60 backdrop-blur-sm border border-white/5
                                   hover:border-teal-400/20 hover:bg-white/5 transition-all duration-200 cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-white/20 group-hover:text-teal-400/50 transition-colors" />
                          <span className="text-white/80 text-sm font-medium truncate max-w-[160px]">
                            {session.title}
                          </span>
                        </div>
                        <div className="text-white/25 text-xs">
                          {getModelName(session.modelId)} · {relativeTime(session.updatedAt, true)}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <ActivityPulse />

      <OnboardingFooter />
    </motion.div>
  );
}

function WorkspaceView() {
  const isMobile = useIsMobile();
  const activeFeature = useAppStore((s) => s.activeFeature);
  const focusMode = useAppStore((s) => s.focusMode);
  const showChat = activeFeature === 'chat';

  const chatContent = (
    <>
      <ChatPage />
      <div className={`shrink-0 ${focusMode && showChat ? 'px-4 pb-8' : 'p-3 sm:p-5'}`}>
        <CommandBar />
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 w-full h-full flex flex-col lg:flex-row"
    >
      {focusMode && showChat ? (
        <div className="flex-1 flex justify-center min-h-0">
          <div className="w-full max-w-2xl flex flex-col min-h-0 min-w-0 relative">
            {chatContent}
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col min-h-0 min-w-0 relative ${isMobile && !showChat ? 'hidden' : ''}`}>
          {chatContent}
        </div>
      )}

      {/* Right panel — hidden in focus mode or on mobile when chat is shown */}
      {!focusMode && (!isMobile || !showChat) && <RightPanel />}

      {/* Mobile bottom dock — always visible on mobile when in chat view (hidden in focus mode) */}
      {!focusMode && isMobile && showChat && (
        <div className="shrink-0 border-t border-white/5 bg-[#0f1413]/80 backdrop-blur-md safe-bottom">
          <BottomDock />
        </div>
      )}
    </motion.div>
  );
}
