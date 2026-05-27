import { create } from 'zustand';
import type { MoonFilter } from './moonFlags';
import type { TimeWindow } from './types';
import type { LiveEvent } from './types/liveEvent';
import type { NarrativeEvent } from './types/narrativeEvent';
import type { Token } from './types/token';

export type ChainFilter = 'all' | 'solana' | 'ethereum' | 'base' | 'bsc';

const FEED_CAP = 50;

type State = {
  timeWindow: TimeWindow;
  selectedCountry: string | null;
  selectedTokenId: string | null;
  /** Token id currently hovered on the moon (flag, crater, or list row).
   *  Drives bidirectional highlighting + auto-scroll. */
  hoveredTokenId: string | null;
  /** Country ISO currently hovered on Earth (beacon, list row, or feed
   *  card). Drives bidirectional highlighting between the right narrative
   *  list, the left feed, and the markers on the globe. */
  hoveredCountry: string | null;
  /** Active filter pill on /moon. */
  moonFilter: MoonFilter;
  /** Active chain pre-filter. Shared across Terminal + Moon. */
  chain: ChainFilter;
  /** Active narrative tag ids. Multi-select. Shared across Terminal,
   *  Earth, Moon — one source of truth for "which narratives is the
   *  user looking at". Empty array = no filter. */
  narrativeIds: string[];
  /** Capped event log driving the LiveFeed panel + crater impact triggers. */
  liveEvents: LiveEvent[];
  /** Capped narrative event log for Earth's left HUD live feed. */
  narrativeEvents: NarrativeEvent[];
  /** Synthetic tokens injected by the live simulator (new pairs). */
  simulatedTokens: Token[];
  muted: boolean;
};

type Actions = {
  setTimeWindow: (w: TimeWindow) => void;
  setSelectedCountry: (iso: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  setHoveredToken: (id: string | null) => void;
  setHoveredCountry: (iso: string | null) => void;
  setMoonFilter: (f: MoonFilter) => void;
  setChain: (c: ChainFilter) => void;
  setNarrativeIds: (ids: string[]) => void;
  toggleNarrativeId: (id: string) => void;
  clearNarrativeIds: () => void;
  clearAllFilters: () => void;
  pushLiveEvent: (e: LiveEvent) => void;
  pushNarrativeEvent: (e: NarrativeEvent) => void;
  pushSimulatedToken: (t: Token) => void;
  clearSimulated: () => void;
  toggleMuted: () => void;
};

export const useMetaStore = create<State & Actions>((set) => ({
  timeWindow: '24h',
  selectedCountry: null,
  selectedTokenId: null,
  hoveredTokenId: null,
  hoveredCountry: null,
  moonFilter: 'trending',
  chain: 'all',
  narrativeIds: [],
  liveEvents: [],
  narrativeEvents: [],
  simulatedTokens: [],
  muted: true,
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedToken: (selectedTokenId) => set({ selectedTokenId }),
  setHoveredToken: (hoveredTokenId) => set({ hoveredTokenId }),
  setHoveredCountry: (hoveredCountry) => set({ hoveredCountry }),
  setMoonFilter: (moonFilter) => set({ moonFilter }),
  setChain: (chain) => set({ chain }),
  setNarrativeIds: (narrativeIds) => set({ narrativeIds }),
  toggleNarrativeId: (id) =>
    set((s) => ({
      narrativeIds: s.narrativeIds.includes(id)
        ? s.narrativeIds.filter((x) => x !== id)
        : [...s.narrativeIds, id],
    })),
  clearNarrativeIds: () => set({ narrativeIds: [] }),
  clearAllFilters: () =>
    set({ chain: 'all', narrativeIds: [], selectedCountry: null, selectedTokenId: null }),
  pushLiveEvent: (e) =>
    set((s) => ({ liveEvents: [e, ...s.liveEvents].slice(0, FEED_CAP) })),
  pushNarrativeEvent: (e) =>
    set((s) => ({
      narrativeEvents: [e, ...s.narrativeEvents].slice(0, FEED_CAP),
    })),
  pushSimulatedToken: (t) =>
    set((s) => ({ simulatedTokens: [t, ...s.simulatedTokens].slice(0, 30) })),
  clearSimulated: () => set({ simulatedTokens: [] }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
