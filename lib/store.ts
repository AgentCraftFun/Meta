import { create } from 'zustand';
import type { MoonFilter } from './moonFlags';
import type { TimeWindow } from './types';

type State = {
  timeWindow: TimeWindow;
  selectedCountry: string | null;
  selectedTokenId: string | null;
  /** Token id currently hovered on the moon (flag or list row). Drives
   *  bidirectional highlighting + auto-scroll. */
  hoveredTokenId: string | null;
  /** Active filter pill on /moon. */
  moonFilter: MoonFilter;
  muted: boolean;
};

type Actions = {
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCountry: (iso: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  setHoveredToken: (id: string | null) => void;
  setMoonFilter: (f: MoonFilter) => void;
  toggleMuted: () => void;
};

export const useMetaStore = create<State & Actions>((set) => ({
  timeWindow: '24h',
  selectedCountry: null,
  selectedTokenId: null,
  hoveredTokenId: null,
  moonFilter: 'trending',
  muted: true,
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedToken: (selectedTokenId) => set({ selectedTokenId }),
  setHoveredToken: (hoveredTokenId) => set({ hoveredTokenId }),
  setMoonFilter: (moonFilter) => set({ moonFilter }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
