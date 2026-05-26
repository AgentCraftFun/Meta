'use client';

import { create } from 'zustand';
import type { ChainFilter } from '../store';
import type { TokenFilter } from '../types/token';

/**
 * Terminal-local UI state. Kept separate from the Earth/Moon
 * `useMetaStore` so the two surfaces can evolve independently — and
 * so a user landing on /terminal doesn't get their selection wiped
 * because the globe scene was unmounting.
 *
 *   chain          — single-select chain pre-filter (rail section 1)
 *   narrativeIds   — multi-select narrative tag ids (rail section 2)
 *   timeframe      — drives which priceChange column is the sort key
 *                    AND highlights that column in the table header
 *   filterTab      — trending / gainers / losers / new (header pills)
 *   sortColumn     — overrides the secondary-tab default; null = use tab
 *   sortDirection  — 'asc' | 'desc'
 *   selectedRowId  — id of the row focused via j/k for Enter to open
 */

export type Timeframe = '5m' | '1h' | '6h' | '24h';
export type SortDirection = 'asc' | 'desc';

/** Sortable column ids. The numeric columns share a `priceChange<X>`
 *  structure; `volume`, `mcap`, `liquidity`, `age` are special. */
export type SortColumn =
  | 'rank'
  | 'symbol'
  | 'age'
  | 'mcap'
  | 'price'
  | 'change5m'
  | 'change1h'
  | 'change6h'
  | 'change24h'
  | 'volume'
  | 'txns'
  | 'liquidity';

type State = {
  chain: ChainFilter;
  narrativeIds: string[];
  timeframe: Timeframe;
  filterTab: TokenFilter;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  selectedRowId: string | null;
};

type Actions = {
  setChain: (c: ChainFilter) => void;
  toggleNarrative: (id: string) => void;
  clearNarratives: () => void;
  clearAll: () => void;
  setTimeframe: (t: Timeframe) => void;
  setFilterTab: (f: TokenFilter) => void;
  setSort: (col: SortColumn, dir?: SortDirection) => void;
  setSelectedRow: (id: string | null) => void;
};

export const useTerminalStore = create<State & Actions>((set) => ({
  chain: 'all',
  narrativeIds: [],
  timeframe: '24h',
  filterTab: 'trending',
  sortColumn: null,
  sortDirection: 'desc',
  selectedRowId: null,
  setChain: (chain) => set({ chain }),
  toggleNarrative: (id) =>
    set((s) => ({
      narrativeIds: s.narrativeIds.includes(id)
        ? s.narrativeIds.filter((n) => n !== id)
        : [...s.narrativeIds, id],
    })),
  clearNarratives: () => set({ narrativeIds: [] }),
  clearAll: () => set({ chain: 'all', narrativeIds: [] }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setFilterTab: (filterTab) => set({ filterTab }),
  setSort: (sortColumn, sortDirection) =>
    set((s) => ({
      sortColumn,
      sortDirection:
        sortDirection ?? (s.sortColumn === sortColumn && s.sortDirection === 'desc' ? 'asc' : 'desc'),
    })),
  setSelectedRow: (selectedRowId) => set({ selectedRowId }),
}));
