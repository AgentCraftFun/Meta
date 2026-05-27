'use client';

import { create } from 'zustand';
import type { TokenFilter } from '../types/token';

/**
 * Terminal-LOCAL UI state. The shared filter state (chain, narrative
 * ids, selected country/token, hover state, time window) lives in
 * `useMetaStore` so the Terminal, Earth, and Moon all reach into the
 * same source of truth. This store only holds Terminal-specific UI
 * preferences that don't make sense on the canvas surfaces.
 *
 *   timeframe      — drives which priceChange column is the sort key
 *                    AND highlights that column in the table header
 *   filterTab      — trending / gainers / losers / new (header pills)
 *   sortColumn     — overrides the secondary-tab default; null = use tab
 *   sortDirection  — 'asc' | 'desc'
 *   selectedRowId  — id of the row focused via j/k for Enter to open
 */

export type Timeframe = '5m' | '1h' | '6h' | '24h';
export type SortDirection = 'asc' | 'desc';

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
  timeframe: Timeframe;
  filterTab: TokenFilter;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  selectedRowId: string | null;
};

type Actions = {
  setTimeframe: (t: Timeframe) => void;
  setFilterTab: (f: TokenFilter) => void;
  setSort: (col: SortColumn, dir?: SortDirection) => void;
  setSelectedRow: (id: string | null) => void;
};

export const useTerminalStore = create<State & Actions>((set) => ({
  timeframe: '24h',
  filterTab: 'trending',
  sortColumn: null,
  sortDirection: 'desc',
  selectedRowId: null,
  setTimeframe: (timeframe) => set({ timeframe }),
  setFilterTab: (filterTab) => set({ filterTab }),
  setSort: (sortColumn, sortDirection) =>
    set((s) => ({
      sortColumn,
      sortDirection:
        sortDirection ??
        (s.sortColumn === sortColumn && s.sortDirection === 'desc' ? 'asc' : 'desc'),
    })),
  setSelectedRow: (selectedRowId) => set({ selectedRowId }),
}));
