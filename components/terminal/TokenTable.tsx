'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import Delta from '@/components/primitives/Delta';
import Pill from '@/components/primitives/Pill';
import { formatAge, formatUsd } from '@/lib/format';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { CHAIN_BADGE } from '@/lib/terminal/chains';
import { applyFilters, sortTokens } from '@/lib/terminal/sortFilter';
import { tokenHref } from '@/lib/tokenHref';
import {
  useTerminalStore,
  type SortColumn,
  type Timeframe,
} from '@/lib/terminal/state';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';
import type { Token, TokenFilter } from '@/lib/types/token';

const ROW_HEIGHT_PX = 44;
const OVERSCAN = 8;
const RECENT_PULSE_MS = 5 * 60 * 1000;
const SKELETON_ROW_COUNT = 20;

const TIMEFRAMES: Timeframe[] = ['5m', '1h', '6h', '24h'];

const TAB_LABELS: { id: TokenFilter; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'new', label: 'New Pairs' },
];

type Column = {
  id: SortColumn | null;
  label: string;
  width: number;
  align?: 'left' | 'right';
  /** Only highlights when current timeframe matches. */
  emphasised?: Timeframe;
};

const COLUMNS: Column[] = [
  { id: 'rank', label: '#', width: 48, align: 'right' },
  { id: 'symbol', label: 'Token', width: 220, align: 'left' },
  { id: null, label: 'Tags', width: 200, align: 'left' },
  { id: 'age', label: 'Age', width: 64, align: 'right' },
  { id: 'mcap', label: 'MCap', width: 96, align: 'right' },
  { id: 'price', label: 'Price', width: 96, align: 'right' },
  { id: 'change5m', label: '5m', width: 76, align: 'right', emphasised: '5m' },
  { id: 'change1h', label: '1h', width: 76, align: 'right', emphasised: '1h' },
  { id: 'change6h', label: '6h', width: 76, align: 'right', emphasised: '6h' },
  { id: 'change24h', label: '24h', width: 76, align: 'right', emphasised: '24h' },
  { id: 'volume', label: 'Volume', width: 92, align: 'right' },
  { id: 'txns', label: 'Txns', width: 72, align: 'right' },
  { id: 'liquidity', label: 'Liquidity', width: 96, align: 'right' },
];

const TOTAL_WIDTH = COLUMNS.reduce((a, c) => a + c.width, 0);

export default function TokenTable() {
  const router = useRouter();
  const timeWindow = useMetaStore((s) => s.timeWindow);

  const chain = useMetaStore((s) => s.chain);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const timeframe = useTerminalStore((s) => s.timeframe);
  const filterTab = useTerminalStore((s) => s.filterTab);
  const sortColumn = useTerminalStore((s) => s.sortColumn);
  const sortDirection = useTerminalStore((s) => s.sortDirection);
  const setTimeframe = useTerminalStore((s) => s.setTimeframe);
  const setFilterTab = useTerminalStore((s) => s.setFilterTab);
  const setSort = useTerminalStore((s) => s.setSort);
  const selectedRowId = useTerminalStore((s) => s.selectedRowId);
  const setSelectedRow = useTerminalStore((s) => s.setSelectedRow);

  const { data, isLoading } = useTokens(timeWindow);
  const tokens = data?.tokens ?? [];

  const filtered = useMemo(
    () => applyFilters(tokens, chain, narrativeIds),
    [tokens, chain, narrativeIds]
  );

  const sorted = useMemo(
    () => sortTokens(filtered, filterTab, timeframe, sortColumn, sortDirection),
    [filtered, filterTab, timeframe, sortColumn, sortDirection]
  );

  // Pulse map — which narrative ids had an event in the last 5 min.
  const narrativeEvents = useMetaStore((s) => s.narrativeEvents);
  const pulsingNarratives = useMemo(() => {
    const out = new Set<string>();
    const cutoff = Date.now() - RECENT_PULSE_MS;
    for (const e of narrativeEvents) {
      if (e.timestamp >= cutoff) out.add(e.narrativeId);
    }
    return out;
  }, [narrativeEvents]);

  // Virtualizer ---------------------------------------------------------
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: isLoading ? SKELETON_ROW_COUNT : sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: OVERSCAN,
  });

  // Keyboard j/k/Enter — listen here so the table owns its selection
  // semantics even when the rail steals focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const idx = selectedRowId
          ? sorted.findIndex((t) => t.id === selectedRowId)
          : -1;
        const next =
          e.key === 'j'
            ? Math.min(sorted.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        const nextTok = sorted[next];
        if (nextTok) {
          setSelectedRow(nextTok.id);
          rowVirtualizer.scrollToIndex(next, { align: 'auto' });
        }
      }
      if (e.key === 'Enter' && selectedRowId) {
        const selected = sorted.find((t) => t.id === selectedRowId);
        if (selected) router.push(tokenHref(selected));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sorted, selectedRowId, setSelectedRow, rowVirtualizer, router]);

  return (
    <div className="flex h-full flex-col bg-ds-bg-base">
      <TableHeader
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        sortColumn={sortColumn}
      />
      <FilterChips />
      <ColumnHeader
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        timeframe={timeframe}
        onSort={setSort}
      />

      <div
        ref={parentRef}
        className="relative flex-1 overflow-auto"
        style={{ contain: 'strict' }}
        role="grid"
        aria-rowcount={sorted.length}
        aria-label="Token table"
      >
        {!isLoading && sorted.length === 0 ? (
          <EmptyState
            hasFilters={chain !== 'all' || narrativeIds.length > 0}
          />
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: `${TOTAL_WIDTH}px`,
              position: 'relative',
            }}
          >
            {isLoading
              ? rowVirtualizer.getVirtualItems().map((vi) => (
                  <SkeletonRow
                    key={vi.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${vi.size}px`,
                      transform: `translateY(${vi.start}px)`,
                    }}
                  />
                ))
              : rowVirtualizer.getVirtualItems().map((vi) => {
                  const token = sorted[vi.index];
                  if (!token) return null;
                  const selected = token.id === selectedRowId;
                  return (
                    <Row
                      key={token.id}
                      rank={vi.index + 1}
                      token={token}
                      selected={selected}
                      pulsingNarratives={pulsingNarratives}
                      timeframe={timeframe}
                      onHover={() => setSelectedRow(token.id)}
                      onClick={() => router.push(tokenHref(token))}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${vi.size}px`,
                        transform: `translateY(${vi.start}px)`,
                      }}
                    />
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────── Header ────────────────────────────

function TableHeader({
  timeframe,
  setTimeframe,
  filterTab,
  setFilterTab,
  sortColumn,
}: {
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  filterTab: TokenFilter;
  setFilterTab: (f: TokenFilter) => void;
  sortColumn: SortColumn | null;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-ds5 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 py-ds3 font-ds-mono">
      <div className="flex items-center gap-ds1" role="tablist" aria-label="Timeframe">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            role="tab"
            aria-selected={timeframe === tf}
            onClick={() => setTimeframe(tf)}
            className={[
              'h-7 rounded-ds-sm px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
              timeframe === tf
                ? 'bg-ds-bg-surfaceHi text-ds-text-primary'
                : 'text-ds-text-secondary hover:bg-ds-bg-surface',
            ].join(' ')}
          >
            {tf}
          </button>
        ))}
      </div>

      <span aria-hidden className="h-4 w-px bg-ds-border-subtle" />

      <div className="flex items-center gap-ds1" role="tablist" aria-label="Token category">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filterTab === tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={[
              'h-7 rounded-ds-sm px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
              filterTab === tab.id
                ? 'bg-ds-accent-cyan/15 text-ds-accent-cyan'
                : 'text-ds-text-secondary hover:bg-ds-bg-surface',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <span
        className="ml-auto text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary"
        aria-live="polite"
      >
        Sort {sortColumn ? `· ${sortColumn}` : ''}
      </span>
    </div>
  );
}

function FilterChips() {
  const chain = useMetaStore((s) => s.chain);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const setChain = useMetaStore((s) => s.setChain);
  const toggleNarrative = useMetaStore((s) => s.toggleNarrativeId);
  const clearAll = useMetaStore((s) => s.clearAllFilters);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(timeWindow);

  const tagsById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of data?.narratives ?? []) m.set(n.id, n.tagLabel || n.title);
    return m;
  }, [data]);

  const hasFilters = chain !== 'all' || narrativeIds.length > 0;
  if (!hasFilters) return null;

  return (
    <div
      data-testid="filter-chips"
      className="flex flex-wrap items-center gap-ds2 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 py-ds2 font-ds-mono"
      aria-label="Active filters"
    >
      {chain !== 'all' && (
        <button
          type="button"
          onClick={() => setChain('all')}
          className="inline-flex items-center gap-ds2 rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds2 py-ds1 text-[10px] uppercase tracking-[0.32em] text-ds-text-primary hover:border-ds-accent-cyan/50"
          aria-label={`Remove ${chain} filter`}
        >
          {chain}
          <span aria-hidden className="text-ds-text-tertiary">×</span>
        </button>
      )}
      {narrativeIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => toggleNarrative(id)}
          className="inline-flex items-center gap-ds2 rounded-ds-sm border border-ds-accent-cyan/40 bg-ds-accent-cyan/10 px-ds2 py-ds1 text-[10px] uppercase tracking-[0.32em] text-ds-accent-cyan hover:border-ds-accent-cyan/70"
          aria-label={`Remove ${tagsById.get(id) ?? id} filter`}
        >
          {tagsById.get(id) ?? id}
          <span aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="ml-ds1 h-6 rounded-ds-sm border border-transparent px-ds2 text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary hover:border-ds-border-strong hover:text-ds-text-primary"
      >
        Clear all
      </button>
    </div>
  );
}

function ColumnHeader({
  sortColumn,
  sortDirection,
  timeframe,
  onSort,
}: {
  sortColumn: SortColumn | null;
  sortDirection: 'asc' | 'desc';
  timeframe: Timeframe;
  onSort: (col: SortColumn) => void;
}) {
  return (
    <div
      className="sticky top-0 z-[5] flex border-b border-ds-border-strong bg-ds-bg-surface font-ds-mono"
      role="row"
      style={{ minWidth: TOTAL_WIDTH }}
    >
      {COLUMNS.map((col) => {
        const sortable = !!col.id;
        const active = sortColumn === col.id;
        const isEmphasised = col.emphasised === timeframe;
        const arrow = active ? (sortDirection === 'desc' ? '↓' : '↑') : '';
        return (
          <button
            key={`${col.id ?? 'tags'}-${col.label}`}
            type="button"
            role="columnheader"
            disabled={!sortable}
            onClick={() => sortable && col.id && onSort(col.id)}
            aria-sort={
              active
                ? sortDirection === 'desc'
                  ? 'descending'
                  : 'ascending'
                : sortable
                  ? 'none'
                  : undefined
            }
            className={[
              'flex h-9 shrink-0 items-center px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
              col.align === 'right' ? 'justify-end' : 'justify-start',
              sortable
                ? 'cursor-pointer hover:text-ds-text-primary'
                : 'cursor-default',
              active || isEmphasised
                ? 'text-ds-accent-cyan'
                : 'text-ds-text-tertiary',
            ].join(' ')}
            style={{ width: col.width }}
          >
            {col.label}
            {arrow && (
              <span aria-hidden className="ml-ds1 text-ds-text-secondary">
                {arrow}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────── Row ────────────────────────────

function Row({
  rank,
  token,
  selected,
  pulsingNarratives,
  timeframe,
  onHover,
  onClick,
  style,
}: {
  rank: number;
  token: Token;
  selected: boolean;
  pulsingNarratives: Set<string>;
  timeframe: Timeframe;
  onHover: () => void;
  onClick: () => void;
  style: CSSProperties;
}) {
  const tagSlice = token.narrativeTags.slice(0, 2);
  const extra = token.narrativeTags.length - tagSlice.length;
  const txns = (token.buys24h ?? 0) + (token.sells24h ?? 0);

  return (
    <div
      role="row"
      aria-rowindex={rank}
      tabIndex={-1}
      onMouseEnter={onHover}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
      className={[
        'group relative flex cursor-pointer items-center border-b border-ds-border-subtle/40 transition-colors duration-ds-fast ease-ds-standard',
        selected
          ? 'bg-ds-bg-surfaceHi outline outline-1 -outline-offset-1 outline-ds-accent-cyan/60'
          : 'hover:bg-ds-bg-surface',
      ].join(' ')}
      style={style}
    >
      <Cell width={48} align="right" muted>
        <span data-numeric="true" className="tabular-nums text-ds-text-tertiary">
          {rank}
        </span>
      </Cell>
      <Cell width={220} align="left">
        <div className="flex min-w-0 items-center gap-ds2">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi text-[9px] uppercase text-ds-text-secondary"
          >
            {token.symbol.slice(0, 2)}
          </span>
          <span className="truncate text-[12px] font-bold uppercase tracking-[0.14em] text-ds-text-primary">
            {token.symbol}
          </span>
          <span className="rounded-ds-sm border border-ds-border-subtle bg-ds-bg-surface px-1 py-[1px] text-[8px] uppercase tracking-[0.2em] text-ds-text-secondary">
            {CHAIN_BADGE[token.chain]}
          </span>
          <span className="truncate text-[10px] uppercase tracking-[0.22em] text-ds-text-tertiary">
            {token.name}
          </span>
        </div>
      </Cell>
      <Cell width={200} align="left">
        <div className="flex items-center gap-ds1">
          {tagSlice.length === 0 ? (
            <span className="text-[10px] uppercase tracking-[0.28em] text-ds-text-tertiary">
              —
            </span>
          ) : (
            tagSlice.map((tag) => (
              <Pill
                key={tag.id}
                size="sm"
                variant="info"
                pulse={pulsingNarratives.has(tag.id)}
              >
                {tag.label}
              </Pill>
            ))
          )}
          {extra > 0 && (
            <span
              data-numeric="true"
              className="text-[10px] tabular-nums text-ds-text-tertiary"
              aria-label={`${extra} more tags`}
            >
              +{extra}
            </span>
          )}
        </div>
      </Cell>
      <Cell width={64} align="right" muted>
        <span data-numeric="true" className="tabular-nums">
          {formatAge(token.age)}
        </span>
      </Cell>
      <Cell width={96} align="right">
        <span data-numeric="true" className="tabular-nums text-ds-text-primary">
          {formatUsd(token.marketCap)}
        </span>
      </Cell>
      <Cell width={96} align="right">
        <span data-numeric="true" className="tabular-nums text-ds-text-primary">
          {formatUsd(token.priceUsd)}
        </span>
      </Cell>
      <ChangeCell value={token.priceChange5m} emphasised={timeframe === '5m'} />
      <ChangeCell value={token.priceChange1h} emphasised={timeframe === '1h'} />
      <ChangeCell value={token.priceChange6h} emphasised={timeframe === '6h'} />
      <ChangeCell
        value={token.priceChange24h}
        emphasised={timeframe === '24h'}
      />
      <Cell width={92} align="right">
        <span data-numeric="true" className="tabular-nums text-ds-text-primary">
          {formatUsd(token.volume24h)}
        </span>
      </Cell>
      <Cell width={72} align="right" muted>
        <span data-numeric="true" className="tabular-nums">
          {txns > 0 ? compactInt(txns) : '—'}
        </span>
      </Cell>
      <Cell width={96} align="right">
        <span data-numeric="true" className="tabular-nums text-ds-text-primary">
          {token.liquidityUsd ? formatUsd(token.liquidityUsd) : '—'}
        </span>
      </Cell>
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute right-ds3 text-ds-text-tertiary transition-opacity duration-ds-fast ease-ds-standard',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        ›
      </span>
    </div>
  );
}

function ChangeCell({
  value,
  emphasised,
}: {
  value: number | undefined;
  emphasised: boolean;
}) {
  return (
    <Cell width={76} align="right">
      {value === undefined ? (
        <span data-numeric="true" className="tabular-nums text-ds-text-tertiary">
          —
        </span>
      ) : (
        <Delta
          value={value}
          className={emphasised ? 'opacity-100' : 'opacity-80'}
        />
      )}
    </Cell>
  );
}

function Cell({
  width,
  align,
  muted,
  children,
}: {
  width: number;
  align: 'left' | 'right';
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="gridcell"
      className={[
        'flex h-full shrink-0 items-center px-ds3 text-[12px]',
        align === 'right' ? 'justify-end' : 'justify-start',
        muted ? 'text-ds-text-secondary' : 'text-ds-text-primary',
      ].join(' ')}
      style={{ width }}
    >
      {children}
    </div>
  );
}

function SkeletonRow({ style }: { style: CSSProperties }) {
  return (
    <div
      role="row"
      aria-busy
      className="flex items-center border-b border-ds-border-subtle/40 px-ds3"
      style={style}
    >
      {COLUMNS.map((c) => (
        <div
          key={`${c.id}-${c.label}`}
          className="flex h-full shrink-0 items-center px-ds3"
          style={{ width: c.width }}
        >
          <div
            className="h-2 w-3/4 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi"
            aria-hidden
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const clearAll = useMetaStore((s) => s.clearAllFilters);
  return (
    <div
      role="status"
      className="absolute inset-0 flex flex-col items-center justify-center gap-ds3 font-ds-mono"
    >
      <p className="text-[12px] uppercase tracking-[0.32em] text-ds-text-secondary">
        {hasFilters
          ? 'No tokens match the current filters'
          : 'No tokens available'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-ds-sm border border-ds-border-strong px-ds3 py-ds2 text-[10px] uppercase tracking-[0.32em] text-ds-text-primary hover:border-ds-accent-cyan/60 hover:text-ds-accent-cyan"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function compactInt(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
