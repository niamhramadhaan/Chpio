import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../store/settingsStore';

const WORK_MESSAGES = [
  "Keep crushing it — peak productivity hours",
  "Deep work mode activated",
  "You're in the zone — keep going",
  "Focus time — distractions minimized",
  "Building something great",
];

const REST_MESSAGES = [
  "Time to recharge — you've earned it",
  "Rest is part of the process",
  "Take a break, come back stronger",
  "Even pioneers need downtime",
  "Recharge mode — you deserve it",
];

function parseWorkingHours(wh: string): { start: number; end: number } {
  const parts = wh.split(' - ');
  if (parts.length !== 2) return { start: 9, end: 17 };
  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h + (m || 0) / 60;
  };
  return { start: parseTime(parts[0]), end: parseTime(parts[1]) };
}

function isWorkingHour(workingHours: string): boolean {
  if (workingHours === 'Flexible' || workingHours === 'Not set') return true;
  const { start, end } = parseWorkingHours(workingHours);
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return currentHour >= start && currentHour < end;
}

export function ClockWidget() {
  const user = useSettingsStore((s) => s.user);
  const [time, setTime] = useState(new Date());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const message = useMemo(() => {
    const isWorking = isWorkingHour(user.workingHours || '9:00 - 17:00');
    const pool = isWorking ? WORK_MESSAGES : REST_MESSAGES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [user.workingHours]);

  const isWorking = isWorkingHour(user.workingHours || '9:00 - 17:00');

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip above - pushes content up */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mb-2 px-3 py-1.5 rounded-lg bg-[#1A201F]/60 backdrop-blur-md border border-white/[0.06] shadow-sm"
          >
            <p className={`text-[10px] text-center whitespace-nowrap ${isWorking ? 'text-teal-400/70' : 'text-amber-400/70'}`}>
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clock - no frame */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 relative">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="20"
                y1="5"
                x2="20"
                y2={i % 3 === 0 ? '7.5' : '6'}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={i % 3 === 0 ? '1' : '0.5'}
                transform={`rotate(${i * 30} 20 20)`}
              />
            ))}
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${hourDeg} 20 20)`}
            />
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="8"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${minuteDeg} 20 20)`}
            />
            <line
              x1="20"
              y1="20"
              x2="20"
              y2="6"
              stroke="#2dd4bf"
              strokeWidth="0.8"
              strokeLinecap="round"
              transform={`rotate(${secondDeg} 20 20)`}
            />
            <circle cx="20" cy="20" r="1.5" fill="#2dd4bf" />
          </svg>
        </div>

        <span className="text-white/40 text-xs font-mono tracking-wider tabular-nums">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
