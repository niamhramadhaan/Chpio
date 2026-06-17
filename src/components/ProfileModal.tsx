import { useState, useEffect, useRef } from 'react';
import { Pencil, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { Modal } from './ui/Modal';
import { PortalDropdown } from './ui/PortalDropdown';

const TIMEZONES = [
  'GMT-12', 'GMT-11', 'GMT-10', 'GMT-9', 'GMT-8', 'GMT-7', 'GMT-6',
  'GMT-5', 'GMT-4', 'GMT-3', 'GMT-2', 'GMT-1', 'GMT+0', 'GMT+1',
  'GMT+2', 'GMT+3', 'GMT+4', 'GMT+5', 'GMT+6', 'GMT+7', 'GMT+8',
  'GMT+9', 'GMT+10', 'GMT+11', 'GMT+12',
];

const WORKING_HOURS = [
  '9:00 - 17:00',
  '8:00 - 16:00',
  '10:00 - 18:00',
  '7:00 - 15:00',
  '10:00 - 19:00',
  'Flexible',
  'Not set',
];

export function ProfileModal() {
  const { profileModalOpen, setProfileModalOpen } = useAppStore();
  const { user, setUser } = useSettingsStore();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [title, setTitle] = useState(user.title);
  const [avatar, setAvatar] = useState(user.avatar);
  const [timezone, setTimezone] = useState(user.timezone || 'GMT+0');
  const [workingHours, setWorkingHours] = useState(user.workingHours || '9:00 - 17:00');
  const [tzOpen, setTzOpen] = useState(false);
  const [whOpen, setWhOpen] = useState(false);

  const tzTriggerRef = useRef<HTMLButtonElement>(null);
  const whTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (profileModalOpen) {
      setName(user.name);
      setEmail(user.email);
      setTitle(user.title);
      setAvatar(user.avatar);
      setTimezone(user.timezone || 'GMT+0');
      setWorkingHours(user.workingHours || '9:00 - 17:00');
    }
  }, [profileModalOpen, user]);

  const handleSave = () => {
    setUser({ ...user, name: name || 'User', email, title, avatar, timezone, workingHours });
    setProfileModalOpen(false);
  };

  return (
    <Modal
      isOpen={profileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      title="Profile"
      className="max-w-sm overflow-hidden flex flex-col"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center pb-4">
        <div className="relative mb-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-teal-400/15 flex items-center justify-center ring-2 ring-white/10">
              <span className="text-xl font-medium text-teal-400">
                {name.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          <button className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-[#1A201F] border border-white/10 text-white/50 hover:text-white transition-colors cursor-pointer">
            <Pencil size={10} />
          </button>
        </div>
        <h3 className="text-white text-sm font-medium">{name || 'Your Name'}</h3>
        {title && <p className="text-white/40 text-xs">{title}</p>}
      </div>

      {/* Form - compact horizontal */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs
                       bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs
                       bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs
                       bg-white/5 border-white/10 text-white focus:border-teal-400/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Avatar</label>
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2.5 py-1.5 rounded-lg border outline-none text-xs
                       bg-white/5 border-white/10 text-white/80 placeholder-white/20 focus:border-teal-400/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Timezone</label>
          <div className="flex-1 relative">
            <button
              ref={tzTriggerRef}
              onClick={() => { setTzOpen(!tzOpen); setWhOpen(false); }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer
                         bg-white/5 border-white/10 text-white hover:border-white/20 transition-all"
            >
              <span>{timezone}</span>
              <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${tzOpen ? 'rotate-180' : ''}`} />
            </button>
            <PortalDropdown
              isOpen={tzOpen}
              triggerRef={tzTriggerRef}
              align="left"
              direction="down"
              matchTriggerWidth
              onClose={() => setTzOpen(false)}
              className="max-h-48 overflow-y-auto rounded-xl bg-[#1A201F] border border-white/10 shadow-2xl"
            >
              {TIMEZONES.map((tz) => (
                <button
                  key={tz}
                  onClick={() => { setTimezone(tz); setTzOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                    timezone === tz ? 'bg-teal-400/15 text-teal-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tz}
                </button>
              ))}
            </PortalDropdown>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-white/40 w-20 shrink-0 text-right">Hours</label>
          <div className="flex-1 relative">
            <button
              ref={whTriggerRef}
              onClick={() => { setWhOpen(!whOpen); setTzOpen(false); }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer
                         bg-white/5 border-white/10 text-white hover:border-white/20 transition-all"
            >
              <span>{workingHours}</span>
              <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${whOpen ? 'rotate-180' : ''}`} />
            </button>
            <PortalDropdown
              isOpen={whOpen}
              triggerRef={whTriggerRef}
              align="left"
              direction="down"
              matchTriggerWidth
              onClose={() => setWhOpen(false)}
              className="rounded-xl bg-[#1A201F] border border-white/10 shadow-2xl"
            >
              {WORKING_HOURS.map((wh) => (
                <button
                  key={wh}
                  onClick={() => { setWorkingHours(wh); setWhOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                    workingHours === wh ? 'bg-teal-400/15 text-teal-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {wh}
                </button>
              ))}
            </PortalDropdown>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
        <button
          onClick={() => setProfileModalOpen(false)}
          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer
                     bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer
                     bg-teal-400 text-black hover:bg-teal-300 shadow-lg shadow-teal-400/20"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
