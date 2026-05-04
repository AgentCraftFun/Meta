'use client';

import { useMemo, useState } from 'react';
import centroidsRaw from '@/public/data/country-centroids.json';
import { flagEmoji } from '@/lib/flags';
import { useMetaStore } from '@/lib/store';
import { timeAgo } from '@/lib/time';
import type { Narrative, NarrativeCategory } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';

type Centroid = { name: string; lat: number; lng: number };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

const COLOR: Record<NarrativeCategory, string> = {
  breaking: '#ffb547',
  trending: '#5ef0ff',
  emerging: '#b48bff',
};

export default function SidePanel() {
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);
  const window = useMetaStore((s) => s.timeWindow);
  const { data, isFetching } = useNarratives(window);

  const open = !!selectedCountry;
  const centroid = selectedCountry ? CENTROIDS[selectedCountry] : null;

  const items = useMemo(() => {
    if (!selectedCountry || !data) return [];
    return data.narratives
      .filter((n) => n.country === selectedCountry)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10);
  }, [selectedCountry, data]);

  const stats = useMemo(() => {
    if (!items.length) return null;
    const totalVolume = items.reduce((acc, n) => acc + n.volume, 0);
    const avgSent = items.reduce((acc, n) => acc + n.sentiment, 0) / items.length;
    const avgMomentum =
      items.reduce((acc, n) => acc + n.momentum, 0) / items.length;
    return { totalVolume, avgSent, avgMomentum, count: items.length };
  }, [items]);

  return (
    <aside
      aria-hidden={!open}
      className={[
        'pointer-events-auto fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-neon-cyan/15 bg-black/55 font-mono backdrop-blur-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      style={{ boxShadow: open ? '0 0 60px rgba(94,240,255,0.06)' : 'none' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <span className="text-2xl leading-none">
          {selectedCountry ? flagEmoji(selectedCountry) : ''}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            Country
          </span>
          <span className="text-sm uppercase tracking-[0.18em] text-white">
            {centroid?.name ?? selectedCountry}
          </span>
        </div>
        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-white/55 transition-colors hover:border-white/30 hover:text-white"
          onClick={() => setSelectedCountry(null)}
          aria-label="Close country panel"
        >
          ×
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 border-b border-white/8 px-5 py-4">
          <Stat
            label="Mentions"
            value={stats.totalVolume.toString()}
            sub={`${stats.count} narratives`}
          />
          <SentimentStat value={stats.avgSent} />
          <MomentumStat value={stats.avgMomentum} />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isFetching && !items.length ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <ol className="flex flex-col gap-2">
            {items.map((n) => (
              <NarrativeRow key={n.id} n={n} />
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums text-white">
        {value}
      </span>
      {sub && (
        <span className="text-[9px] tracking-[0.2em] text-white/40">{sub}</span>
      )}
    </div>
  );
}

function SentimentStat({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, Math.abs(value)));
  const positive = value >= 0;
  const label = positive ? 'POSITIVE' : 'NEGATIVE';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">
        Sentiment
      </span>
      <div className="relative mt-1 h-[5px] w-full bg-white/10">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
        <div
          className="absolute top-0 h-full"
          style={{
            left: positive ? '50%' : `${50 - pct * 50}%`,
            width: `${pct * 50}%`,
            background: positive ? '#34d399' : '#fb7185',
            boxShadow: positive
              ? '0 0 8px rgba(52,211,153,0.6)'
              : '0 0 8px rgba(251,113,133,0.6)',
          }}
        />
      </div>
      <span
        className="text-[9px] tracking-[0.2em]"
        style={{ color: positive ? '#34d399' : '#fb7185' }}
      >
        {label} {Math.round(value * 100)}
      </span>
    </div>
  );
}

function MomentumStat({ value }: { value: number }) {
  const up = value >= 0;
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.3em] text-white/40">
        Momentum
      </span>
      <span
        className="text-base font-semibold tabular-nums"
        style={{ color: up ? '#34d399' : '#fb7185' }}
      >
        {up ? '▲' : '▼'} {Math.abs(pct)}%
      </span>
      <span className="text-[9px] tracking-[0.2em] text-white/40">
        24H trend
      </span>
    </div>
  );
}

function NarrativeRow({ n }: { n: Narrative }) {
  const [expanded, setExpanded] = useState(false);
  const color = COLOR[n.category];
  const up = n.momentum >= 0;
  const sentPos = n.sentiment >= 0;
  return (
    <li
      className="rounded-sm border border-white/8 bg-black/30 px-3 py-2.5 transition-colors hover:border-white/20"
      style={{ boxShadow: `inset 0 0 0 1px ${color}10` }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[10px] tabular-nums text-white/35">
          #{String(n.rank).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-white">
            {n.title}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-white/55">
            {n.summary}
          </p>
        </div>
        <span
          className="mt-1 h-1.5 w-1.5 rounded-full"
          style={{
            background: sentPos ? '#34d399' : '#fb7185',
            boxShadow: sentPos
              ? '0 0 6px rgba(52,211,153,0.7)'
              : '0 0 6px rgba(251,113,133,0.7)',
          }}
          aria-label={
            sentPos ? 'Positive sentiment' : 'Negative sentiment'
          }
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-[3px] flex-1 overflow-hidden bg-white/10">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${n.volume}%`,
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        </div>
        <span
          className="rounded-sm border px-1.5 py-0.5 text-[9px] tabular-nums"
          style={{
            color: up ? '#86efac' : '#fda4af',
            borderColor: up ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)',
          }}
        >
          {up ? '▲' : '▼'} {Math.abs(Math.round(n.momentum * 100))}%
        </span>
        <span className="w-16 text-right text-[9px] tracking-wider text-white/40">
          {timeAgo(n.firstSeen)}
        </span>
      </div>

      {n.sources.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-[9px] uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-white/80"
        >
          {expanded
            ? '— Hide sources'
            : `+ ${Math.min(3, n.sources.length)} sources`}
        </button>
      )}

      {expanded && (
        <div className="mt-2 flex flex-col gap-2">
          {n.sources.slice(0, 3).map((s, i) => (
            <div
              key={i}
              className="rounded-sm border border-white/8 bg-black/40 px-2.5 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider text-neon-cyan/85">
                  {s.author}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] tracking-widest text-white/35 hover:text-white/70"
                >
                  open ↗
                </a>
              </div>
              <p className="mt-1 text-[10.5px] leading-snug text-white/75">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

function SkeletonList() {
  return (
    <ol className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="rounded-sm border border-white/8 bg-black/30 px-3 py-3"
        >
          <div className="h-3 w-3/4 animate-pulse bg-white/8" />
          <div className="mt-2 h-2 w-1/2 animate-pulse bg-white/6" />
          <div className="mt-3 h-[3px] w-full animate-pulse bg-white/8" />
        </li>
      ))}
    </ol>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/35">
      No narratives detected for this country in this window.
    </div>
  );
}
