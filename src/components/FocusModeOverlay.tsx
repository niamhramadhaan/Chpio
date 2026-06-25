import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import { Focus, Home } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function FocusModeOverlay() {
  const focusMode = useAppStore((s) => s.focusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const setView = useAppStore((s) => s.setView);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const [, navigate] = useLocation();

  return (
    <AnimatePresence>
      {focusMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-3 right-3 z-[100] flex items-center gap-1.5"
        >
          <button
            onClick={() => {
              setView('onboarding');
              setActiveFeature('home');
              toggleFocusMode();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A201F]/70 backdrop-blur-md border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer text-xs"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A201F]/70 backdrop-blur-md border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer text-xs"
            title="Exit Focus Mode (⌘K → Toggle Focus Mode)"
          >
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Focus</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
