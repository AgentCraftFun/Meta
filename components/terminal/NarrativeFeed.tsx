'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import Pill from '@/components/primitives/Pill';
import { flagEmoji } from '@/lib/flags';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { tokenHref } from '@/lib/tokenHref';
import type { Narrative } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

const MAX_CARDS = 30;
const RECENT_PULSE_MS = 5 * 60 * 1000;

/**
 * Right rail. Top: "Live Narratives" + live indicator. Cards stack
 * top-down, slide in from the top when new narrative events arrive,
 * fall off the bottom past MAX_CARDS. Each card surfaces the narrative
 * tag, country flag, age, impact bar, and clickable related-token
 * tickers — clicking a ticker filters the table to that token; clicking
 * the tag toggles the narrative filter.
 */
export default function NarrativeFeed() {
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const events = useMetaStore((s) => s.narrativeEvents);
  const { data: narrativesData } = useNarratives(timeWindow);
  const { data: tokensData } = useTokens(timeWindow);
  const toggleNarrative = useMetaStore((s) => s.toggleNarrativeId);

  // Tick once per second so age strings stay live without forcing a
  // full event re-pump.
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const narrativesById = useMemo(() => {
    const m = new Map<string, Narrative>();
    for (const n of narrativesData?.narratives ?? []) m.set(n.id, n);
    return m;
  }, [narrativesData]);

  // Cards = the most recent N events that have a known narrative,
  // newest first. If we have no events yet (cold start), fall back
  // to the top narratives so the rail isn't empty.
  const cards = useMemo(() => {
    if (events.length === 0) {
      return (narrativesData?.narratives ?? [])
        .slice()
        .sort((a, b) => b.volume - a.volume)
        .slice(0, MAX_CARDS)
        .map((n) => ({
          key: `seed-${n.id}`,
          narrative: n,
          timestamp: Date.now() - 60_000,
          impact: n.volume,
        }));
    }
    const out: {
      key: string;
      narrative: Narrative;
      timestamp: number;
      impact: number;
    }[] = [];
    for (const e of events) {
      const narrative = narrativesById.get(e.narrativeId);
      if (!narrative) continue;
      out.push({
        key: e.id,
        narrative,
        timestamp: e.timestamp,
        impact: e.impact,
      });
      if (out.length >= MAX_CARDS) break;
    }
    return out;
  }, [events, narrativesData, narrativesById]);

  return (
    <aside
      aria-label="Live narratives"
      className="flex h-full flex-col bg-ds-bg-base font-ds-mono"
    >
      <header className="flex items-center justify-between border-b border-ds-border-subtle px-ds5 py-ds4">
        <div className="flex items-center gap-ds2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 animate-ds-pulse rounded-ds-full bg-ds-accent-cyan"
            style={{ boxShadow: '0 0 10px rgba(77, 212, 255, 0.85)' }}
          />
          <span className="text-[11px] uppercase tracking-[0.4em] text-ds-text-primary">
            Live Narratives
          </span>
        </div>
        <span
          data-numeric="true"
          className="text-[10px] tabular-nums text-ds-text-tertiary"
          aria-live="polite"
        >
          {cards.length}
        </span>
      </header>

      <ol className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {cards.map((c) => (
            <motion.li
              key={c.key}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              <Card
                narrative={c.narrative}
                timestamp={c.timestamp}
                impact={c.impact}
                tokensIndex={tokensData?.tokens ?? []}
                onTagClick={() => toggleNarrative(c.narrative.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      <Link
        href="/narratives"
        className="border-t border-ds-border-subtle px-ds5 py-ds3 text-center text-[10px] uppercase tracking-[0.4em] text-ds-text-secondary hover:text-ds-accent-cyan"
      >
        View all →
      </Link>
    </aside>
  );
}

function Card({
  narrative,
  timestamp,
  impact,
  tokensIndex,
  onTagClick,
}: {
  narrative: Narrative;
  timestamp: number;
  impact: number;
  tokensIndex: ReturnType<typeof useTokens>['data'] extends infer D
    ? D extends { tokens: infer T }
      ? T
      : never
    : never;
  onTagClick: () => void;
}) {
  const tag = narrativeToTag(narrative);
  const ageMs = Date.now() - timestamp;
  const pulse = ageMs < RECENT_PULSE_MS;
  const ageLabel = formatRelative(ageMs);

  // Related tickers — first 3 tokens from the active universe that
  // carry this narrative's tag. We resolve here (not at fetch time) so
  // ticker clicks can call the right filter action.
  const related = useMemo(() => {
    const arr = (tokensIndex ?? []).filter((t) =>
      t.narrativeTags.some((x) => x.id === narrative.id)
    );
    return arr.slice(0, 3);
  }, [tokensIndex, narrative.id]);

  return (
    <article className="border-b border-ds-border-subtle/60 px-ds5 py-ds3">
      <header className="flex items-center gap-ds2">
        <button
          type="button"
          onClick={onTagClick}
          aria-label={`Filter table by ${tag.label}`}
          className="inline-flex"
        >
          <Pill size="sm" variant="info" pulse={pulse}>
            {tag.label}
          </Pill>
        </button>
        {narrative.country && (
          <span aria-label={`country ${narrative.country}`} className="text-[11px]">
            {flagEmoji(narrative.country)}
          </span>
        )}
        <span
          data-numeric="true"
          className="ml-auto text-[10px] tabular-nums text-ds-text-tertiary"
        >
          {ageLabel}
        </span>
      </header>

      <p className="mt-ds2 line-clamp-2 text-[12px] leading-snug text-ds-text-primary">
        {narrative.title}
      </p>

      <ImpactBar value={impact} />

      {related.length > 0 && (
        <div className="mt-ds2 flex flex-wrap gap-ds1">
          {related.map((t) => (
            <SetTickerFilter
              key={t.id}
              symbol={t.symbol}
              href={tokenHref(t)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function ImpactBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="mt-ds2 h-[3px] w-full overflow-hidden bg-ds-bg-surfaceHi"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Impact score"
    >
      <div
        className="h-full bg-ds-accent-cyan transition-[width] duration-ds-base ease-ds-standard"
        style={{
          width: `${pct}%`,
          boxShadow: '0 0 8px rgba(77, 212, 255, 0.45)',
        }}
      />
    </div>
  );
}

function SetTickerFilter({
  symbol,
  href,
}: {
  symbol: string;
  href: string;
}) {
  // Clicking a ticker chip in the feed jumps into the detail page —
  // same as a table row click.
  return (
    <Link
      href={href}
      className="rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds2 py-[1px] text-[10px] uppercase tracking-[0.22em] text-ds-text-primary hover:border-ds-accent-cyan/60 hover:text-ds-accent-cyan"
    >
      {symbol}
    </Link>
  );
}

function formatRelative(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 5) return 'now';
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h`;
}
