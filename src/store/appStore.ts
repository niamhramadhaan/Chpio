import { useState, useEffect } from 'react';
import { create } from 'zustand';
import type { AppView, Feature } from '../types';

const CHPIO_MODE_KEY = 'chpio-mode';

function loadChpioMode(): boolean {
  try {
    return localStorage.getItem(CHPIO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveChpioMode(enabled: boolean) {
  try {
    localStorage.setItem(CHPIO_MODE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

interface AppState {
  view: AppView;
  activeFeature: Feature;
  profileModalOpen: boolean;
  settingsModalOpen: boolean;
  settingsInitialTab: string | null;
  chpioMode: boolean;

  setView: (view: AppView) => void;
  setActiveFeature: (feature: Feature) => void;
  setProfileModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setSettingsInitialTab: (tab: string | null) => void;
  setChpioMode: (enabled: boolean) => void;
  toggleChpioMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'onboarding',
  activeFeature: 'chat',
  profileModalOpen: false,
  settingsModalOpen: false,
  settingsInitialTab: null,
  chpioMode: loadChpioMode(),

  setView: (view) => set({ view }),
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setSettingsInitialTab: (tab) => set({ settingsInitialTab: tab }),
  setChpioMode: (enabled) => {
    saveChpioMode(enabled);
    set({ chpioMode: enabled });
  },
  toggleChpioMode: () => set((state) => {
    const next = !state.chpioMode;
    saveChpioMode(next);
    return { chpioMode: next };
  }),
}));

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}
