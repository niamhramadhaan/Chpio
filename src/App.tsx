import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { useAppStore } from './store/appStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { WALLPAPERS } from './types';
import { CommandBar } from './components/CommandBar';
import { RightPanel } from './components/RightPanel';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingFooter } from './components/OnboardingFooter';
import { ChatPage } from './pages/ChatPage';
import { getActiveModels } from './utils/models';
import type { ChatSession } from './types';

export default function App() {
  const view = useAppStore((s) => s.view);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const wallpaper = useSettingsStore((s) => s.wallpaper);

  const isVideo = WALLPAPERS.find((w) => w.url === wallpaper)?.type === 'video' || wallpaper.endsWith('.mp4');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
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

      <AnimatePresence mode="wait">
        {view === 'onboarding' ? (
          <OnboardingView key="onboarding" />
        ) : (
          <WorkspaceView key="workspace" />
        )}
      </AnimatePresence>

      <ProfileModal />
      <SettingsModal />
    </div>
  );
}

function OnboardingView() {
  const sessions = useChatStore((s) => s.sessions);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const providers = useSettingsStore((s) => s.providers);

  const models = useMemo(() => getActiveModels(providers), [providers]);
  const recent = useMemo(() => [...sessions].filter((s) => !s.archived).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10), [sessions]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    if (!scrollRef.current || hovering) return;
    const el = scrollRef.current;
    let frame: number;
    const step = () => {
      el.scrollLeft += 0.3;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [hovering, recent]);

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

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-white text-3xl font-serif font-light mb-8 tracking-wide italic opacity-90"
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
                className="overflow-hidden"
              >
                <div
                  ref={scrollRef}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  onWheel={(e) => {
                    if (scrollRef.current && e.deltaY !== 0) {
                      e.preventDefault();
                      scrollRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
                >
            {recent.map((session, i) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.75 + i * 0.05 }}
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
                  {getModelName(session.modelId)} · {relativeTime(session.updatedAt)}
                </div>
              </motion.button>
            ))}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <OnboardingFooter />
    </motion.div>
  );
}

function WorkspaceView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 w-full h-full flex"
    >
      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatPage />
        <div className="p-5 shrink-0">
          <CommandBar />
        </div>
      </div>

      <RightPanel />
    </motion.div>
  );
}
