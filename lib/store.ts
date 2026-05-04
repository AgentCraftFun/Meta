import { create } from 'zustand';
import type { TimeWindow } from './types';

type State = {
  timeWindow: TimeWindow;
  selectedCountry: string | null;
  muted: boolean;
};

type Actions = {
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCountry: (iso: string | null) => void;
  toggleMuted: () => void;
};

export const useMetaStore = create<State & Actions>((set) => ({
  timeWindow: '24h',
  selectedCountry: null,
  muted: true,
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
