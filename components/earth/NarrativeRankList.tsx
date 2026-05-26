'use client';

import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { flagEmoji } from '@/lib/flags';
import { useMetaStore } from '@/lib/store';
import type { Narrative, NarrativeCategory, TimeWindow } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';

const HEAT_HEX: Record<NarrativeCategory, string> = {
  breaking: '#ef4444',
  trending: '#22D3EE',
  emerging: '#e5e7eb',
};

const WINDOW_LABEL: Record<TimeWindow, string> = {
  '1h': 'Breaking Now',
  '24h': 'Last 24H',
  '7d': 'Last 7D',
};

const WINDOW_ACCENT: Record<TimeWindow, string> = {
  '1h': '#22D3EE',
  '24h': '#fbbf24',
  '7d': '#e5e7eb',
};

/**
 * Right-side ranked narratives panel for /. Mirrors the moon's TokenList:
 * one row per narrative ranked by impact (volume), with bidirectional
 * hover and click-to-open-panel-and-tween-camera behaviour.
 */
export default function NarrativeRankList() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const hoveredCountry = useMetaStore((s) => s.hoveredCountry);
  const setHoveredCountry = useMetaStore((s) => s.setHoveredCountry);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const { data } = useNarratives(window_);

  const ranked = useMemo(() => {
    const ns = data?.narratives ?? [];
    return [...ns].sort((a, b) => b.volume - a.volume);
  }, [data?.narratives]);

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const lastHoverFromList = useRef<string | null>(null);
  useEffect(() => {
    if (!hoveredCountry) return;
    if (lastHoverFromList.current === hoveredCountry) return;
    // First matching narrative for the hovered country.
    const match = ranked.find((n) => n.country === hoveredCountry);
    if (!match) return;
    const el = itemRefs.current.get(match.id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hoveredCountry, ranked]);

  const accent = WINDOW_ACCENT[window_];

  return (
    <aside
      className="pointer-events-auto fixed right-0 top-12 z-20 flex h-[calc(100vh-48px)] w-[360px] flex-col border-l border-white/8 bg-black/50 font-mono backdrop-blur-xl"
      style={{ paddingTop: 32 }}
    >
      <div className="flex items-center gap-3 px-5 pb-4 pt-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
        />
        <span
          className="text-[11px] uppercase tracking-[0.42em]"
          style={{ color: accent }}
        >
          {WINDOW_LABEL[window_]}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.32em] text-white/40">
          {ranked.length} narratives
        </span>
      </div>

      <ol className="flex-1 overflow-y-auto pb-6">
        {ranked.length === 0 ? (
          <li className="px-5 py-6 text-[10px] uppercase tracking-[0.36em] text-white/35">
            Scanning global signal…
          </li>
        ) : (
          ranked.map((n, i) => (
            <Row
              key={n.id}
              ref={(el) => {
                if (el) itemRefs.current.set(n.id, el);
                else itemRefs.current.delete(n.id);
              }}
              rank={i + 1}
              narrative={n}
              highlighted={hoveredCountry === n.country}
              selected={selectedCountry === n.country}
              accent={accent}
              onPointerEnter={() => {
                lastHoverFromList.current = n.country;
                setHoveredCountry(n.country);
              }}
              onPointerLeave={() => {
                if (useMetaStore.getState().hoveredCountry === n.country) {
                  setHoveredCountry(null);
                }
                lastHoverFromList.current = null;
              }}
              onClick={() =>
                setSelectedCountry(
                  selectedCountry === n.country ? null : n.country
                )
              }
            />
          ))
        )}
      </ol>
    </aside>
  );
}

type RowProps = {
  rank: number;
  narrative: Narrative;
  highlighted: boolean;
  selected: boolean;
  accent: string;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
};

const Row = forwardRef<HTMLLIElement, RowProps>(function Row(
  { rank, narrative, highlighted, selected, accent, onPointerEnter, onPointerLeave, onClick },
  ref
) {
  const heat = HEAT_HEX[narrative.category];
  const impactPct = Math.max(0, Math.min(100, Math.round(narrative.volume)));

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
        <span className="text-base leading-none">
          {flagEmoji(narrative.country)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
          {narrative.country}
        </span>
        <span
          className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ background: heat, boxShadow: `0 0 6px ${heat}` }}
          aria-label={`${narrative.category} narrative`}
        />
        <span
          className="w-8 text-right text-[10px] tabular-nums"
          style={{ color: heat }}
        >
          {impactPct}
        </span>
      </div>
      <div className="mt-1 pl-7">
        <p className="line-clamp-1 text-[12px] leading-snug text-white/85">
          {narrative.title}
        </p>
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-7">
        <span className="text-[8px] uppercase tracking-[0.32em] text-white/30">
          IMP
        </span>
        <div className="h-[3px] flex-1 overflow-hidden bg-white/8">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${impactPct}%`,
              background: heat,
              boxShadow: `0 0 6px ${heat}`,
            }}
          />
        </div>
      </div>
    </li>
  );
});
