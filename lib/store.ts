import { create } from 'zustand';
import type { MoonFilter } from './moonFlags';
import type { TimeWindow } from './types';
import type { LiveEvent } from './types/liveEvent';
import type { Token } from './types/token';

export type ChainFilter = 'all' | 'solana' | 'ethereum' | 'base';

const FEED_CAP = 50;

type State = {
  timeWindow: TimeWindow;
  selectedCountry: string | null;
  selectedTokenId: string | null;
  /** Token id currently hovered on the moon (flag, crater, or list row).
   *  Drives bidirectional highlighting + auto-scroll. */
  hoveredTokenId: string | null;
  /** Active filter pill on /moon. */
  moonFilter: MoonFilter;
  /** Active chain pre-filter on /moon. */
  chain: ChainFilter;
  /** Capped event log driving the LiveFeed panel + crater impact triggers. */
  liveEvents: LiveEvent[];
  /** Synthetic tokens injected by the live simulator (new pairs). */
  simulatedTokens: Token[];
  muted: boolean;
};

type Actions = {
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCountry: (iso: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  setHoveredToken: (id: string | null) => void;
  setMoonFilter: (f: MoonFilter) => void;
  setChain: (c: ChainFilter) => void;
  pushLiveEvent: (e: LiveEvent) => void;
  pushSimulatedToken: (t: Token) => void;
  clearSimulated: () => void;
  toggleMuted: () => void;
};

export const useMetaStore = create<State & Actions>((set) => ({
  timeWindow: '24h',
  selectedCountry: null,
  selectedTokenId: null,
  hoveredTokenId: null,
  moonFilter: 'trending',
  chain: 'all',
  liveEvents: [],
  simulatedTokens: [],
  muted: true,
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedToken: (selectedTokenId) => set({ selectedTokenId }),
  setHoveredToken: (hoveredTokenId) => set({ hoveredTokenId }),
  setMoonFilter: (moonFilter) => set({ moonFilter }),
  setChain: (chain) => set({ chain }),
  pushLiveEvent: (e) =>
    set((s) => ({ liveEvents: [e, ...s.liveEvents].slice(0, FEED_CAP) })),
  pushSimulatedToken: (t) =>
    set((s) => ({ simulatedTokens: [t, ...s.simulatedTokens].slice(0, 30) })),
  clearSimulated: () => set({ simulatedTokens: [] }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
