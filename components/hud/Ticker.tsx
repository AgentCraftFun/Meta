'use client';

import { useMemo } from 'react';
import { flagEmoji } from '@/lib/flags';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import type { Narrative } from '@/lib/types';

const CATEGORY_COLOR: Record<Narrative['category'], string> = {
  breaking: '#ffb547',
  trending: '#5ef0ff',
  emerging: '#b48bff',
};

function SentimentBar({ value }: { value: number }) {
  // -1..1 → bar centered at 50%, fills toward right (positive) or left (negative).
  const pct = Math.max(0, Math.min(1, Math.abs(value)));
  const positive = value >= 0;
  return (
    <div className="relative h-[3px] w-12 bg-white/10">
      <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
      <div
        className="absolute top-0 h-full"
        style={{
          left: positive ? '50%' : `${50 - pct * 50}%`,
          width: `${pct * 50}%`,
          background: positive ? '#34d399' : '#fb7185',
        }}
      />
    </div>
  );
}

function TickerChip({ n }: { n: Narrative }) {
  const color = CATEGORY_COLOR[n.category];
  return (
    <div className="flex items-center gap-3 border-r border-white/8 px-5 text-[11px] text-white/85">
      <span className="text-base leading-none">{flagEmoji(n.country)}</span>
      <span className="max-w-[280px] truncate font-medium">{n.title}</span>
      <span
        className="flex items-center gap-1 text-[10px] tabular-nums"
        style={{ color }}
      >
        ▲ {n.volume}
      </span>
      <SentimentBar value={n.sentiment} />
    </div>
  );
}

export default function Ticker() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window);

  const top = useMemo(() => {
    const ns = data?.narratives ?? [];
    return [...ns].sort((a, b) => b.volume - a.volume).slice(0, 10);
  }, [data?.narratives]);

  if (!top.length) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/55 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 backdrop-blur-xl">
        Scanning global signal…
      </div>
    );
  }

  return (
    <div className="group pointer-events-auto fixed inset-x-0 bottom-0 z-20 overflow-hidden border-t border-white/10 bg-black/55 font-mono backdrop-blur-xl">
      {/* Soft edge fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0))',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{
          background:
            'linear-gradient(to left, rgba(0,0,0,0.9), rgba(0,0,0,0))',
        }}
      />

      <div
        className="flex w-max py-3 ticker-track"
        style={{ animationDuration: `${Math.max(40, top.length * 6)}s` }}
      >
        {/* Render the chip list twice so the loop is seamless. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {top.map((n) => (
              <TickerChip key={`${copy}-${n.id}`} n={n} />
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .ticker-track {
          animation-name: ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .group:hover .ticker-track {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
