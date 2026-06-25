import { useRef } from 'react';
import { Settings } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-web';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { ClockWidget } from './ClockWidget';
import { NotificationCenter } from './NotificationCenter';
import chpioAvatar from '../assets/chpio-avatar.json';

export function OnboardingFooter() {
  const user = useSettingsStore((s) => s.user);
  const { setProfileModalOpen, setSettingsModalOpen, setView, setActiveFeature } = useAppStore();
  const dotLottieRef = useRef<DotLottie | null>(null);

  const handleChatClick = () => {
    setActiveFeature('chat');
    setView('workspace');
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
      {/* Clock widget - directly above the bar, no frame */}
      <div className="mb-3">
        <ClockWidget />
      </div>

      {/* Footer bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1A201F]/60 backdrop-blur-sm border border-white/5">
        <button
          onClick={() => setProfileModalOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 group-hover:border-teal-400/30 transition-colors">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-teal-400/20 flex items-center justify-center text-teal-400 text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-white/50 text-sm font-medium group-hover:text-white/70 transition-colors">
            {user.name}
          </span>
        </button>

        <div className="w-px h-4 bg-white/10" />

        <NotificationCenter />

        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={() => setSettingsModalOpen(true)}
          title="Settings"
          aria-label="Settings"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={handleChatClick}
          onMouseEnter={() => {
            dotLottieRef.current?.play();
          }}
          onMouseLeave={() => {
            dotLottieRef.current?.pause();
          }}
          title="Chat"
          aria-label="Open chat"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all cursor-pointer"
        >
          <DotLottieReact
            data={chpioAvatar}
            loop
            autoplay={false}
            dotLottieRefCallback={(ref) => {
              dotLottieRef.current = ref;
              if (ref) {
                ref.addEventListener('load', () => {
                  ref.setFrame(0);
                  ref.pause();
                });
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </button>
      </div>
    </div>
  );
}
