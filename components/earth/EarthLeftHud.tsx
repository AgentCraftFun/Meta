'use client';

import { useEffect, useMemo, useState } from 'react';
import { flagEmoji } from '@/lib/flags';
import { useMetaStore } from '@/lib/store';
import { formatUtcClock } from '@/lib/time';
import type { TimeWindow } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';
import NarrativeLiveFeed from './NarrativeLiveFeed';

const WINDOW_OPTIONS: Array<{ id: TimeWindow; label: string; accent: string }> =
  [
    { id: '1h', label: 'Breaking Now', accent: '#22D3EE' },
    { id: '24h', label: '24H', accent: '#fbbf24' },
    { id: '7d', label: '7D', accent: '#e5e7eb' },
  ];

/**
 * Left-side HUD column for /. Mirrors the moon's MoonLeftHud layout:
 *
 *   1. Time window pills (vertical stack — replaces the old TimeToggle)
 *   2. Live breaking-news feed (cards from store.narrativeEvents)
 *   3. Global stats (total narratives / top country / hottest)
 *   4. Status pill — driven by the global TopBar StatusIndicator
 *
 * Width 280px, fixed left, top padding clears the TopBar wordmark.
 */
export default function EarthLeftHud() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const setWindow = useMetaStore((s) => s.setTimeWindow);
  const { data } = useNarratives(window_);

  const stats = useMemo(() => {
    const ns = data?.narratives ?? [];
    if (ns.length === 0) {
      return { total: 0, topCountry: null as string | null, hottest: null as
        | { title: string; impact: number }
        | null };
    }
    const byCountry = new Map<string, number>();
    for (const n of ns) {
      byCountry.set(n.country, (byCountry.get(n.country) ?? 0) + 1);
    }
    let topCountry = '';
    let topCount = 0;
    for (const [iso, count] of byCountry) {
      if (count > topCount) {
        topCount = count;
        topCountry = iso;
      }
    }
    const hottest = [...ns].sort((a, b) => b.volume - a.volume)[0];
    return {
      total: ns.length,
      topCountry,
      hottest: hottest ? { title: hottest.title, impact: hottest.volume } : null,
    };
  }, [data?.narratives]);

  const [clock, setClock] = useState('');
  useEffect(() => {
    setClock(formatUtcClock());
    const id = setInterval(() => setClock(formatUtcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      aria-label="Earth HUD"
      className="pointer-events-auto fixed left-0 top-12 z-20 flex h-[calc(100vh-48px)] w-[280px] flex-col gap-4 border-r border-white/8 bg-black/50 px-4 font-mono backdrop-blur-xl"
      style={{ paddingTop: 32, paddingBottom: 16 }}
    >
      {/* 1 — Time window pills */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.42em] text-cyan-300/80">
          <span className="h-1 w-1 rounded-full bg-cyan-300" />
          Window
        </div>
        <div className="flex flex-col gap-1.5">
          {WINDOW_OPTIONS.map((opt) => {
            const active = window_ === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWindow(opt.id)}
                aria-pressed={active}
                className={[
                  'group flex items-center justify-between rounded-sm border px-3 py-2 text-left text-[11px] uppercase tracking-[0.32em] transition-all',
                  active
                    ? 'border-transparent text-black'
                    : 'border-white/10 bg-[#0B1220] text-white/55 hover:border-white/25 hover:text-white/85',
                ].join(' ')}
                style={{
                  background: active ? opt.accent : undefined,
                  boxShadow: active ? `0 0 14px ${opt.accent}55` : undefined,
                }}
              >
                <span>{opt.label}</span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: active ? '#000' : opt.accent,
                    boxShadow: active ? 'none' : `0 0 6px ${opt.accent}`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 — Live feed (takes the remaining vertical space) */}
      <div className="flex-1 overflow-y-auto pr-1">
        <NarrativeLiveFeed maxItems={12} />
      </div>

      {/* 3 — Global stats */}
      <section className="flex flex-col gap-1.5 rounded-sm border border-white/8 bg-black/40 px-3 py-2.5">
        <Stat label="Narratives" value={String(stats.total)} />
        <Stat
          label="Top Country"
          value={
            stats.topCountry
              ? `${flagEmoji(stats.topCountry)} ${stats.topCountry}`
              : '—'
          }
        />
        <Stat
          label="Hottest"
          value={
            stats.hottest
              ? `${stats.hottest.title.slice(0, 18)}${stats.hottest.title.length > 18 ? '…' : ''}`
              : '—'
          }
          tail={stats.hottest ? `▲ ${stats.hottest.impact}` : undefined}
        />
      </section>

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
          <span className="ml-auto text-[9px] uppercase tracking-[0.32em] text-white/40">
            Live
          </span>
        </div>
        <div className="mt-2 text-center text-[9px] tracking-[0.32em] text-white/30 tabular-nums">
          Last sync · {clock || '— — : — — : — —'}
        </div>
      </section>
    </aside>
  );
}

function Stat({
  label,
  value,
  tail,
}: {
  label: string;
  value: string;
  tail?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-[78px] uppercase tracking-[0.3em] text-white/35">
        {label}
      </span>
      <span className="flex-1 truncate text-white/85">{value}</span>
      {tail && (
        <span className="text-[10px] tabular-nums text-emerald-300/85">
          {tail}
        </span>
      )}
    </div>
  );
}
