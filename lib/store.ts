import { create } from 'zustand';
import type { TimeWindow } from './types';

type State = {
  timeWindow: TimeWindow;
  selectedCountry: string | null;
  selectedTokenId: string | null;
  muted: boolean;
};

type Actions = {
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCountry: (iso: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  toggleMuted: () => void;
};

export const useMetaStore = create<State & Actions>((set) => ({
  timeWindow: '24h',
  selectedCountry: null,
  selectedTokenId: null,
  muted: true,
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedToken: (selectedTokenId) => set({ selectedTokenId }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
