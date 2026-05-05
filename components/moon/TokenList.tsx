'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { formatPercent, formatUsd } from '@/lib/format';
import { computeActivity } from '@/lib/tokenActivity';
import {
  FILTER_ACCENT,
  MOON_FILTERS,
  applyMoonFilter,
} from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import type { HeatLevel, Token } from '@/lib/types/token';
import { useTokens } from '@/lib/useTokens';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

/**
 * Right-side ranked list of the same 30 tokens shown as flags. Bidirectional
 * highlighting with the moon: hovering a row pings the flag, hovering a
 * flag pings + auto-scrolls the row. Clicking either opens the existing
 * TokenSidePanel from Phase D.
 *
 * Sits at the right edge with top padding to clear the HUD pills above it.
 * A header chevron collapses the panel so the moon goes full-screen.
 */
export default function TokenList() {
  const window = useMetaStore((s) => s.timeWindow);
  const filter = useMetaStore((s) => s.moonFilter);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const setHoveredToken = useMetaStore((s) => s.setHoveredToken);
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const { data } = useTokens(window);

  const filtered = useMemo(
    () => applyMoonFilter(data?.tokens ?? [], filter),
    [data, filter]
  );

  const [collapsed, setCollapsed] = useState(false);

  // Auto-scroll the hovered row into view (when the hover originated from
  // the moon, not from this list itself).
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const lastHoverFromList = useRef<string | null>(null);
  useEffect(() => {
    if (!hoveredTokenId) return;
    if (lastHoverFromList.current === hoveredTokenId) return;
    const el = itemRefs.current.get(hoveredTokenId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hoveredTokenId]);

  const filterMeta = MOON_FILTERS.find((f) => f.id === filter)!;
  const accent = FILTER_ACCENT[filter];

  return (
    <aside
      className={[
        'pointer-events-auto fixed right-0 top-0 z-20 flex h-full flex-col border-l border-white/8 bg-black/50 font-mono backdrop-blur-xl transition-[width,transform] duration-300 ease-out',
        collapsed ? 'w-[44px]' : 'w-[360px]',
      ].join(' ')}
      style={{ paddingTop: 80 }}
    >
      {/* Collapse toggle — always visible at right edge */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand list' : 'Collapse list'}
        className="absolute left-3 top-[88px] z-10 flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-black/55 text-white/55 transition-colors hover:border-white/30 hover:text-white"
      >
        <span aria-hidden>{collapsed ? '‹' : '›'}</span>
      </button>

      {!collapsed && (
        <>
          <div className="flex items-center gap-3 px-5 pb-4 pt-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.42em]"
              style={{ color: accent }}
            >
              {filterMeta.label}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.32em] text-white/40">
              {filtered.length} tokens
            </span>
          </div>

          <ol className="flex-1 overflow-y-auto pb-6">
            {filtered.length === 0 ? (
              <li className="px-5 py-6 text-[10px] uppercase tracking-[0.36em] text-white/35">
                No tokens for this filter
              </li>
            ) : (
              filtered.map((token, i) => (
                <Row
                  key={token.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(token.id, el);
                    else itemRefs.current.delete(token.id);
                  }}
                  rank={i + 1}
                  token={token}
                  highlighted={hoveredTokenId === token.id}
                  selected={selectedTokenId === token.id}
                  accent={accent}
                  onPointerEnter={() => {
                    lastHoverFromList.current = token.id;
                    setHoveredToken(token.id);
                  }}
                  onPointerLeave={() => {
                    if (useMetaStore.getState().hoveredTokenId === token.id) {
                      setHoveredToken(null);
                    }
                    lastHoverFromList.current = null;
                  }}
                  onClick={() =>
                    setSelectedToken(
                      selectedTokenId === token.id ? null : token.id
                    )
                  }
                />
              ))
            )}
          </ol>
        </>
      )}
    </aside>
  );
}

type RowProps = {
  rank: number;
  token: Token;
  highlighted: boolean;
  selected: boolean;
  accent: string;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
};

const Row = forwardRef<HTMLLIElement, RowProps>(function Row(
  { rank, token, highlighted, selected, accent, onPointerEnter, onPointerLeave, onClick },
  ref
) {
  const heat = HEAT_HEX[token.category];
  const up = token.priceChange24h >= 0;
  const activity = computeActivity(token);
  const activityPct = Math.round(activity * 100);

  return (
    <li
      ref={ref}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onClick={onClick}
      className={[
        'group relative cursor-pointer border-l-2 px-5 py-2.5 transition-colors',
        highlighted || selected
          ? 'bg-white/[0.04]'
          : 'border-l-transparent hover:bg-white/[0.025]',
      ].join(' ')}
      style={{
        borderLeftColor: highlighted || selected ? accent : 'transparent',
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="w-7 text-[10px] tabular-nums text-white/35">
          #{String(rank).padStart(2, '0')}
        </span>
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ background: heat, boxShadow: `0 0 6px ${heat}` }}
        />
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-white">
          {token.symbol}
        </span>
        <span className="truncate text-[10px] uppercase tracking-[0.22em] text-white/40">
          {token.name}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3 pl-7">
        <span className="text-[10px] tabular-nums text-white/55">
          {formatUsd(token.marketCap)}
        </span>
        <span
          className="ml-auto text-[10px] tabular-nums"
          style={{ color: up ? '#86efac' : '#fda4af' }}
        >
          {up ? '▲' : '▼'} {formatPercent(token.priceChange24h, 1)}
        </span>
      </div>
      {/* Activity bar — visually correlates with crater size on the moon */}
      <div className="mt-1.5 flex items-center gap-2 pl-7">
        <span className="text-[8px] uppercase tracking-[0.32em] text-white/30">
          ACT
        </span>
        <div className="h-[3px] flex-1 overflow-hidden bg-white/8">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${activityPct}%`,
              background: heat,
              boxShadow: `0 0 6px ${heat}`,
            }}
          />
        </div>
        <span
          className="w-6 text-right text-[9px] tabular-nums"
          style={{ color: heat }}
        >
          {activityPct}
        </span>
      </div>
    </li>
  );
});
