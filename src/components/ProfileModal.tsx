import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';

export function ProfileModal() {
  const { profileModalOpen, setProfileModalOpen } = useAppStore();
  const { user, setUser } = useSettingsStore();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [title, setTitle] = useState(user.title);
  const [avatar, setAvatar] = useState(user.avatar);

  useEffect(() => {
    if (profileModalOpen) {
      setName(user.name);
      setEmail(user.email);
      setTitle(user.title);
      setAvatar(user.avatar);
    }
  }, [profileModalOpen, user]);

  const handleSave = () => {
    setUser({ ...user, name: name || 'User', email, title, avatar });
    setProfileModalOpen(false);
  };

  return (
    <AnimatePresence>
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProfileModalOpen(false)}
            className="fixed inset-0 backdrop-blur-sm bg-black/50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            className="relative z-[51] w-full max-w-sm rounded-2xl overflow-hidden
                       bg-[#1A201F]/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-white">Profile</h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar + Preview */}
            <div className="flex flex-col items-center px-5 pb-4">
              <div className="relative mb-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-400/15 flex items-center justify-center ring-2 ring-white/10">
                    <span className="text-2xl font-medium text-teal-400">
                      {name.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <button className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-[#1A201F] border border-white/10 text-white/50 hover:text-white transition-colors cursor-pointer">
                  <Pencil size={12} />
                </button>
              </div>
              <h3 className="text-white font-medium">{name || 'Your Name'}</h3>
              {title && <p className="text-white/40 text-sm">{title}</p>}
            </div>

            {/* Form */}
            <div className="px-5 pb-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium
                             bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium
                             bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Title / Role</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium
                             bg-white/5 border-white/10 text-white focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/40">Avatar URL</label>
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm font-medium
                             bg-white/5 border-white/10 text-white/80 placeholder-white/20 focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-3 border-t border-white/5">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer
                           bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer
                           bg-teal-400 text-black hover:bg-teal-300 shadow-lg shadow-teal-400/20"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
