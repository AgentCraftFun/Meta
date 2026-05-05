'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatPercent, formatUsd } from '@/lib/format';
import {
  FILTER_ACCENT,
  MOON_FILTERS,
  applyMoonFilter,
} from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { formatUtcClock } from '@/lib/time';
import type { Token } from '@/lib/types/token';
import { useTokens } from '@/lib/useTokens';

/**
 * Left-side HUD column for /moon. Replaces the top-right filter toggle
 * with a vertical stack:
 *
 *   1. Filter pills (vertical, full-width, mono uppercase)
 *   2. Global stats — total mcap, top gainer, top loser of the visible set
 *   3. Status — LIVE/MOCK pill with last-sync UTC clock
 *
 * Mirrors the right-side TokenList in width (280px) so the moon sits
 * visually between two equal sidebars.
 */
export default function MoonLeftHud() {
  const filter = useMetaStore((s) => s.moonFilter);
  const setFilter = useMetaStore((s) => s.setMoonFilter);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const { data, isFetching, isError } = useTokens(timeWindow);

  const visibleTokens = useMemo(
    () => applyMoonFilter(data?.tokens ?? [], filter),
    [data, filter]
  );

  const stats = useMemo(() => computeStats(visibleTokens), [visibleTokens]);

  const [clock, setClock] = useState('');
  useEffect(() => {
    setClock(formatUtcClock());
    const id = setInterval(() => setClock(formatUtcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const liveLabel = data?.source ? data.source.toUpperCase() : 'MOCK';
  const isLive = data?.source === 'dexscreener' || data?.source === 'birdeye';

  return (
    <aside
      aria-label="Moon HUD"
      className="pointer-events-auto fixed left-0 top-0 z-20 flex h-full w-[280px] flex-col gap-4 border-r border-white/8 bg-black/50 px-4 font-mono backdrop-blur-xl"
      style={{ paddingTop: 80, paddingBottom: 16 }}
    >
      {/* Section 1 — Filter pills */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.42em] text-cyan-300/80">
          <span className="h-1 w-1 rounded-full bg-cyan-300" />
          Filter
        </div>
        <div className="flex flex-col gap-1.5">
          {MOON_FILTERS.map((f) => {
            const active = filter === f.id;
            const accent = FILTER_ACCENT[f.id];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={[
                  'group flex items-center justify-between rounded-sm border px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.32em] transition-all',
                  active
                    ? 'border-transparent text-black'
                    : 'border-white/10 bg-[#0B1220] text-white/55 hover:border-white/25 hover:text-white/85',
                ].join(' ')}
                style={{
                  background: active ? accent : undefined,
                  boxShadow: active ? `0 0 14px ${accent}55` : undefined,
                }}
              >
                <span>{f.label}</span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: active ? '#000' : accent,
                    boxShadow: active ? 'none' : `0 0 6px ${accent}`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2 — Global stats */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.42em] text-cyan-300/80">
          <span className="h-1 w-1 rounded-full bg-cyan-300" />
          Global Stats
        </div>
        <div className="flex flex-col gap-2">
          <Stat label="Total MCAP" value={formatUsd(stats.totalMcap)} />
          {stats.topGainer ? (
            <StatRow
              label="Top Gainer"
              symbol={stats.topGainer.symbol}
              value={formatPercent(stats.topGainer.priceChange24h, 1)}
              tone="pos"
            />
          ) : (
            <Stat label="Top Gainer" value="—" />
          )}
          {stats.topLoser ? (
            <StatRow
              label="Top Loser"
              symbol={stats.topLoser.symbol}
              value={formatPercent(stats.topLoser.priceChange24h, 1)}
              tone="neg"
            />
          ) : (
            <Stat label="Top Loser" value="—" />
          )}
        </div>
      </section>

      {/* Section 3 — Status (anchored to bottom via mt-auto) */}
      <section className="mt-auto">
        <div className="flex items-center gap-2 rounded-sm border border-white/8 bg-black/40 px-3 py-2">
          <span
            className={[
              'h-1.5 w-1.5 rounded-full animate-pulse',
              isLive ? 'bg-cyan-300' : 'bg-amber-300',
            ].join(' ')}
            style={{
              boxShadow: isLive
                ? '0 0 8px rgba(34,211,238,0.85)'
                : '0 0 8px rgba(252,191,36,0.85)',
            }}
          />
          <span
            className={[
              'text-[10px] uppercase tracking-[0.32em]',
              isLive ? 'text-cyan-300' : 'text-amber-300',
            ].join(' ')}
          >
            Live
          </span>
          <span className="text-white/30">·</span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-white/55">
            {liveLabel}
          </span>
          <span className="ml-auto text-[9px] tracking-[0.2em] text-white/30">
            {isError ? 'ERR' : isFetching ? 'SYNC' : 'OK'}
          </span>
        </div>
        <div className="mt-2 text-center text-[9px] tracking-[0.32em] text-white/30 tabular-nums">
          Last sync · {clock || '— — : — — : — —'}
        </div>
      </section>
    </aside>
  );
}

type Stats = {
  totalMcap: number;
  topGainer: Token | null;
  topLoser: Token | null;
};

function computeStats(tokens: Token[]): Stats {
  if (tokens.length === 0) {
    return { totalMcap: 0, topGainer: null, topLoser: null };
  }
  let totalMcap = 0;
  let topGainer: Token | null = null;
  let topLoser: Token | null = null;
  for (const t of tokens) {
    totalMcap += t.marketCap;
    if (!topGainer || t.priceChange24h > topGainer.priceChange24h) topGainer = t;
    if (!topLoser || t.priceChange24h < topLoser.priceChange24h) topLoser = t;
  }
  return { totalMcap, topGainer, topLoser };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/8 bg-black/40 px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.36em] text-white/35">
        {label}
      </div>
      <div className="mt-1 font-display text-[18px] font-bold tabular-nums tracking-[-0.01em] text-white">
        {value}
      </div>
    </div>
  );
}

function StatRow({
  label,
  symbol,
  value,
  tone,
}: {
  label: string;
  symbol: string;
  value: string;
  tone: 'pos' | 'neg';
}) {
  const colour = tone === 'pos' ? '#86efac' : '#fda4af';
  const arrow = tone === 'pos' ? '▲' : '▼';
  return (
    <div className="rounded-sm border border-white/8 bg-black/40 px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.36em] text-white/35">
        {label}
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-white">
          {symbol}
        </span>
        <span className="text-[12px] tabular-nums" style={{ color: colour }}>
          {arrow} {value}
        </span>
      </div>
    </div>
  );
}
