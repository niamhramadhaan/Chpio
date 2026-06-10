import { create } from 'zustand';
import type { AppView, Feature } from '../types';

interface AppState {
  view: AppView;
  activeFeature: Feature;
  profileModalOpen: boolean;
  settingsModalOpen: boolean;

  setView: (view: AppView) => void;
  setActiveFeature: (feature: Feature) => void;
  setProfileModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'onboarding',
  activeFeature: 'chat',
  profileModalOpen: false,
  settingsModalOpen: false,

  setView: (view) => set({ view }),
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
}));
