'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { flagEmoji } from '@/lib/flags';
import { useMetaStore } from '@/lib/store';
import type {
  NarrativeEvent,
  NarrativeEventType,
} from '@/lib/types/narrativeEvent';

const EVENT_LABEL: Record<NarrativeEventType, string> = {
  'new-story': 'New Story',
  'momentum-shift': 'Momentum Shift',
  'cross-country': 'Cross-Country',
};

const EVENT_ACCENT: Record<NarrativeEventType, string> = {
  'new-story': '#fbbf24',
  'momentum-shift': '#22D3EE',
  'cross-country': '#34d399',
};

const HEAT_LABEL: Record<NarrativeEvent['category'], string> = {
  breaking: 'Hot',
  trending: 'Trending',
  emerging: 'Emerging',
};

const HEAT_HEX: Record<NarrativeEvent['category'], string> = {
  breaking: '#ef4444',
  trending: '#22D3EE',
  emerging: '#e5e7eb',
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
  /** Maximum cards to render. Default 12. */
  maxItems?: number;
};

/**
 * Live breaking-news feed for Earth's left HUD. Subscribes to
 * store.narrativeEvents and renders the most recent N as colour-banded
 * cards. Hovering a card pings the matching beacon on the globe;
 * clicking opens the country narrative panel and tweens the camera.
 */
export default function NarrativeLiveFeed({ maxItems = 12 }: Props) {
  const events = useMetaStore((s) => s.narrativeEvents);
  const setHoveredCountry = useMetaStore((s) => s.setHoveredCountry);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visible = events.slice(0, maxItems);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"
          style={{ boxShadow: '0 0 8px rgba(34,211,238,0.85)' }}
        />
        <span className="text-[9px] uppercase tracking-[0.42em] text-cyan-300/85">
          Breaking Feed
        </span>
        <span className="ml-auto text-[9px] uppercase tracking-[0.32em] text-white/30">
          {visible.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 overflow-hidden">
        {visible.length === 0 ? (
          <div className="rounded-sm border border-white/8 bg-[#0B1220] px-3 py-3 text-center text-[10px] uppercase tracking-[0.32em] text-white/35">
            Listening for stories…
          </div>
        ) : (
          visible.map((e) => (
            <Card
              key={e.id}
              event={e}
              now={now}
              onHover={(hover) =>
                setHoveredCountry(hover ? e.country : null)
              }
              onClick={() => setSelectedCountry(e.country)}
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
  event: NarrativeEvent;
  now: number;
  onHover: (hover: boolean) => void;
  onClick: () => void;
}) {
  const accent = EVENT_ACCENT[event.type];
  const heat = HEAT_HEX[event.category];

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
      <div className="flex items-baseline gap-2">
        <span className="text-base leading-none">
          {flagEmoji(event.country)}
        </span>
        <span className="line-clamp-2 text-[11.5px] font-medium leading-snug text-white">
          {event.title}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-white/60">
        <span className="tabular-nums">Impact {event.impact}</span>
        <span
          className="ml-auto inline-flex items-center gap-1"
          style={{ color: heat }}
        >
          <span
            className="h-1 w-1 rounded-full"
            style={{ background: heat, boxShadow: `0 0 5px ${heat}` }}
          />
          {HEAT_LABEL[event.category]}
        </span>
      </div>
      {event.relatedCountries && event.relatedCountries.length > 0 && (
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.28em] text-white/40">
          <span>also</span>
          {event.relatedCountries.slice(0, 3).map((iso) => (
            <span key={iso} className="text-base leading-none">
              {flagEmoji(iso)}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}
