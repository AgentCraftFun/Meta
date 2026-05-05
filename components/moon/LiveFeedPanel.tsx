'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatPercent, formatUsd } from '@/lib/format';
import { useMetaStore } from '@/lib/store';
import type { LiveEvent, LiveEventType } from '@/lib/types/liveEvent';

const EVENT_LABEL: Record<LiveEventType, string> = {
  'new-pair': 'New Pair',
  'volume-spike': 'Volume Spike',
  'new-high': 'New High',
};

const EVENT_ACCENT: Record<LiveEventType, string> = {
  'new-pair': '#fbbf24',
  'volume-spike': '#22D3EE',
  'new-high': '#34d399',
};

function formatRelative(ms: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - ms) / 1000));
  if (sec < 5) return 'now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

type Props = {
  /** Filter the panel down to only NEW PAIR events (used when the user
   *  has the NEW pill active so the panel becomes a launch ticker). */
  newPairsOnly?: boolean;
  /** Maximum cards to render. Default 12. */
  maxItems?: number;
};

/**
 * LIVE FEED panel. Subscribes to store.liveEvents and renders the most
 * recent N as colour-banded cards. Hovering a card pings the matching
 * crater on the moon (bidirectional with the right list). Clicking
 * opens the existing TokenSidePanel via setSelectedToken.
 */
export default function LiveFeedPanel({
  newPairsOnly = false,
  maxItems = 12,
}: Props) {
  const events = useMetaStore((s) => s.liveEvents);
  const setHoveredToken = useMetaStore((s) => s.setHoveredToken);
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visible = (newPairsOnly
    ? events.filter((e) => e.type === 'new-pair')
    : events
  ).slice(0, maxItems);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"
          style={{ boxShadow: '0 0 8px rgba(34,211,238,0.85)' }}
        />
        <span className="text-[9px] uppercase tracking-[0.42em] text-cyan-300/85">
          Live Feed
        </span>
        <span className="ml-auto text-[9px] uppercase tracking-[0.32em] text-white/30">
          {visible.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 overflow-hidden">
        {visible.length === 0 ? (
          <div className="rounded-sm border border-white/8 bg-[#0B1220] px-3 py-3 text-center text-[10px] uppercase tracking-[0.32em] text-white/35">
            Listening for events…
          </div>
        ) : (
          visible.map((e) => (
            <Card
              key={e.id}
              event={e}
              now={now}
              onHover={(hover) => setHoveredToken(hover ? e.tokenId : null)}
              onClick={() => setSelectedToken(e.tokenId)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Card({
  event,
  now,
  onHover,
  onClick,
}: {
  event: LiveEvent;
  now: number;
  onHover: (hover: boolean) => void;
  onClick: () => void;
}) {
  const accent = EVENT_ACCENT[event.type];
  const up = event.priceChange24h >= 0;
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      className="group flex flex-col gap-1 rounded-sm border-l-[3px] bg-[#0B1220] px-2.5 py-2 text-left transition-colors hover:bg-[#111A2E]"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1 w-1 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
        />
        <span
          className="text-[9px] uppercase tracking-[0.32em]"
          style={{ color: accent }}
        >
          {EVENT_LABEL[event.type]}
        </span>
        <span className="ml-auto text-[9px] tracking-[0.2em] text-white/35 tabular-nums">
          {formatRelative(event.timestamp, now)}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 truncate">
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-white">
          {event.tokenSymbol}
        </span>
        <span className="truncate text-[10px] uppercase tracking-[0.22em] text-white/40">
          {event.tokenName}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1.5 text-[10px] tabular-nums text-white/55">
        <span>{formatUsd(event.marketCap)}</span>
        <span
          className="ml-auto"
          style={{ color: up ? '#86efac' : '#fda4af' }}
        >
          {up ? '▲' : '▼'} {formatPercent(event.priceChange24h, 1)}
        </span>
      </div>
      <div className="mt-0.5">
        <span className="rounded-sm border border-white/15 bg-black/40 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.32em] text-white/55">
          {event.chain}
        </span>
      </div>
    </motion.button>
  );
}
