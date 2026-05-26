'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FILTER_ACCENT,
  MOON_FILTERS,
  applyMoonFilter,
} from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { formatUtcClock } from '@/lib/time';
import { computeActivity } from '@/lib/tokenActivity';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';
import ChainSelector from './ChainSelector';
import LiveFeedPanel from './LiveFeedPanel';

const MAX_CRATERS = 40;

/**
 * Left-side HUD column for /moon. Sections from top to bottom:
 *   1. Chain selector (segmented ALL / SOL / ETH / BASE)
 *   2. Filter pills (Trending / Hot / New / Gainers / Losers)
 *   3. Live feed (cards, tallest section, expands when filter = 'new')
 *   4. Status pill — LIVE/MOCK + active vs faded count
 *
 * The whole column is fixed at width 280px with top padding clearing
 * the TopBar wordmark.
 */
export default function MoonLeftHud() {
  const filter = useMetaStore((s) => s.moonFilter);
  const setFilter = useMetaStore((s) => s.setMoonFilter);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const universe = useEffectiveTokens(timeWindow);

  const filtered = useMemo(
    () => applyMoonFilter(universe, filter),
    [universe, filter]
  );

  // Active = top 40 by activity (the moon caps at this); faded = the rest
  // of the filter slice. Mirrors the rule in TokenCraters.pickTopByActivity.
  const counts = useMemo(() => {
    const active = Math.min(MAX_CRATERS, filtered.length);
    const faded = Math.max(0, filtered.length - MAX_CRATERS);
    return { active, faded };
  }, [filtered]);

  // Dummy use of computeActivity to keep the import live for downstream
  // consumers; calling it on the top item is essentially free.
  void (filtered[0] && computeActivity(filtered[0]));

  const [clock, setClock] = useState('');
  useEffect(() => {
    setClock(formatUtcClock());
    const id = setInterval(() => setClock(formatUtcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const isNewMode = filter === 'new';

  return (
    <aside
      aria-label="Moon HUD"
      className="pointer-events-auto fixed left-0 top-12 z-20 flex h-[calc(100vh-48px)] w-[280px] flex-col gap-4 border-r border-white/8 bg-black/50 px-4 font-mono backdrop-blur-xl"
      style={{ paddingTop: 32, paddingBottom: 16 }}
    >
      {/* 1 — Chain selector */}
      <ChainSelector />

      {/* 2 — Filter pills */}
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
                  'group flex items-center justify-between rounded-sm border px-3 py-2 text-left text-[11px] uppercase tracking-[0.32em] transition-all',
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

      {/* 3 — Live feed (takes the remaining vertical space) */}
      <div className="flex-1 overflow-y-auto pr-1">
        <LiveFeedPanel
          newPairsOnly={isNewMode}
          maxItems={isNewMode ? 16 : 10}
        />
      </div>

      {/* 4 — Status — anchored to bottom */}
      <section>
        <div className="flex items-center gap-2 rounded-sm border border-white/8 bg-black/40 px-3 py-2">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300"
            style={{ boxShadow: '0 0 8px rgba(252,191,36,0.85)' }}
          />
          <span className="text-[10px] uppercase tracking-[0.32em] text-amber-300">
            Mock
          </span>
          <span className="ml-auto flex items-center gap-1 text-[9px] uppercase tracking-[0.32em] text-white/50">
            <span className="text-cyan-300">{counts.active}</span>
            <span className="text-white/25">/</span>
            <span>{counts.faded} faded</span>
          </span>
        </div>
        <div className="mt-2 text-center text-[9px] tracking-[0.32em] text-white/30 tabular-nums">
          Last sync · {clock || '— — : — — : — —'}
        </div>
      </section>
    </aside>
  );
}
