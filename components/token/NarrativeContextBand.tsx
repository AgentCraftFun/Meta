'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Pill from '@/components/primitives/Pill';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import type { Token } from '@/lib/types/token';

const RECENT_PULSE_MS = 5 * 60 * 1000;

type Props = {
  token: Token;
};

/**
 * 72px context band. The MetaMap differentiator surfaced as the
 * first thing under the header: narrative tag pills (clickable, pre-
 * filter the Terminal), trending duration, related token count, and
 * the freshest live event linked to one of the token's narratives.
 */
export default function NarrativeContextBand({ token }: Props) {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window);
  const narrativeEvents = useMetaStore((s) => s.narrativeEvents);

  const narratives = data?.narratives ?? [];

  const linkedSet = useMemo(
    () => new Set(token.narrativeTags.map((t) => t.id)),
    [token.narrativeTags]
  );

  const linkedNarratives = useMemo(
    () => narratives.filter((n) => linkedSet.has(n.id)),
    [narratives, linkedSet]
  );

  const impactScore = useMemo(() => {
    if (linkedNarratives.length === 0) return 0;
    return Math.round(
      linkedNarratives.reduce((acc, n) => Math.max(acc, n.volume), 0)
    );
  }, [linkedNarratives]);

  const trendingHours = useMemo(() => {
    if (linkedNarratives.length === 0) return null;
    const ages = linkedNarratives
      .map((n) => (Date.now() - new Date(n.firstSeen).getTime()) / 3_600_000)
      .filter((h) => Number.isFinite(h) && h >= 0);
    if (ages.length === 0) return null;
    return Math.round(Math.max(...ages));
  }, [linkedNarratives]);

  const relatedCount = useMemo(() => {
    let total = 0;
    for (const n of linkedNarratives) {
      total += n.relatedTokenIds?.length ?? 0;
    }
    // Subtract self when present so the count reads "other tokens".
    if (linkedNarratives.some((n) => n.relatedTokenIds?.includes(token.id))) {
      total -= linkedNarratives.length;
    }
    return Math.max(0, total);
  }, [linkedNarratives, token.id]);

  const latestEvent = useMemo(() => {
    if (linkedSet.size === 0) return null;
    for (const e of narrativeEvents) {
      if (linkedSet.has(e.narrativeId)) return e;
    }
    return null;
  }, [narrativeEvents, linkedSet]);

  const pulsingTags = useMemo(() => {
    const out = new Set<string>();
    const cutoff = Date.now() - RECENT_PULSE_MS;
    for (const e of narrativeEvents) {
      if (e.timestamp >= cutoff) out.add(e.narrativeId);
    }
    return out;
  }, [narrativeEvents]);

  if (token.narrativeTags.length === 0) {
    return (
      <section
        aria-label="Narrative context"
        className="flex h-[72px] shrink-0 items-center gap-ds3 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 font-ds-mono"
      >
        <span className="text-[11px] uppercase tracking-[0.32em] text-ds-text-secondary">
          No narratives currently linked to this token.
        </span>
        <span
          tabIndex={0}
          title="The rules tagger matches narrative keywords against the token's symbol + name. This token didn't match any of the active narratives in the last hour."
          aria-label="Why?"
          className="cursor-help rounded-ds-sm border border-ds-border-strong px-ds2 py-ds1 text-[9px] uppercase tracking-[0.32em] text-ds-text-tertiary hover:text-ds-text-primary"
        >
          Why?
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label="Narrative context"
      className="flex h-[72px] shrink-0 flex-wrap items-center gap-x-ds5 gap-y-ds2 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 font-ds-mono"
    >
      <div className="flex items-center gap-ds2" role="list">
        {token.narrativeTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/terminal?narratives=${encodeURIComponent(tag.id)}`}
            role="listitem"
            className="inline-flex"
          >
            <Pill
              variant="info"
              size="md"
              pulse={pulsingTags.has(tag.id)}
            >
              {tag.label}
            </Pill>
          </Link>
        ))}
      </div>

      <Stat label="Impact" value={String(impactScore)} />
      {trendingHours !== null && (
        <Stat label="Trending" value={`${trendingHours}h`} />
      )}
      <Stat
        label="Related"
        value={`${relatedCount} ${relatedCount === 1 ? 'token' : 'tokens'}`}
      />

      {latestEvent && (
        <Link
          href={`/terminal?narratives=${encodeURIComponent(latestEvent.narrativeId)}`}
          className="ml-auto inline-flex max-w-[480px] items-center gap-ds2 truncate text-[11px] text-ds-text-secondary hover:text-ds-text-primary"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 animate-ds-pulse rounded-ds-full bg-ds-accent-cyan"
            style={{ boxShadow: '0 0 8px rgba(77, 212, 255, 0.85)' }}
          />
          <span className="truncate">{latestEvent.title}</span>
          <span data-numeric="true" className="tabular-nums text-ds-text-tertiary">
            · {formatRelative(Date.now() - latestEvent.timestamp)}
          </span>
        </Link>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-ds1">
      <span className="text-[9px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        {label}
      </span>
      <span
        data-numeric="true"
        className="text-[12px] tabular-nums text-ds-text-primary"
      >
        {value}
      </span>
    </div>
  );
}

function formatRelative(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}
