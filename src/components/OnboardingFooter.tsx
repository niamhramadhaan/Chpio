import { Settings } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';

export function OnboardingFooter() {
  const user = useSettingsStore((s) => s.user);
  const { setProfileModalOpen, setSettingsModalOpen } = useAppStore();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
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

        <button
          onClick={() => setSettingsModalOpen(true)}
          title="Settings"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
