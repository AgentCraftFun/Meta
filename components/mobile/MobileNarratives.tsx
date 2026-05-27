'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import Pill from '@/components/primitives/Pill';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import { flagEmoji } from '@/lib/flags';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { tokenHref } from '@/lib/tokenHref';
import type { Narrative } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

export default function MobileNarratives() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const { data, isLoading, isError, refetch } = useNarratives(window_);
  const { data: tokensData } = useTokens(window_);

  const cards = useMemo(() => {
    return (data?.narratives ?? [])
      .slice()
      .sort((a, b) => b.volume - a.volume);
  }, [data]);

  return (
    <div className="flex h-full flex-col bg-ds-bg-base">
      <PullToRefresh onRefresh={() => refetch()}>
        {isError && (
          <div
            role="alert"
            className="border-b border-ds-accent-bear/40 bg-ds-accent-bear/10 px-ds4 py-ds2 text-[11px] uppercase tracking-[0.32em] text-ds-accent-bear"
          >
            Couldn't load narratives — pull down to retry.
          </div>
        )}
        {isLoading && cards.length === 0 ? (
          <Skeleton />
        ) : cards.length === 0 ? (
          <Empty />
        ) : (
          <ol role="list">
            {cards.map((n) => (
              <li key={n.id}>
                <NarrativeCard
                  narrative={n}
                  tokensIndex={tokensData?.tokens ?? []}
                />
              </li>
            ))}
          </ol>
        )}
      </PullToRefresh>
    </div>
  );
}

function NarrativeCard({
  narrative,
  tokensIndex,
}: {
  narrative: Narrative;
  tokensIndex: ReturnType<typeof useTokens>['data'] extends infer D
    ? D extends { tokens: infer T }
      ? T
      : never
    : never;
}) {
  const tag = narrativeToTag(narrative);
  const ageMs = Date.now() - new Date(narrative.firstSeen).getTime();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const related = useMemo(
    () =>
      (tokensIndex ?? [])
        .filter((t) => t.narrativeTags.some((x) => x.id === narrative.id))
        .slice(0, 3),
    [tokensIndex, narrative.id]
  );

  return (
    <article className="border-b border-ds-border-subtle/60 px-ds4 py-ds3 font-ds-mono">
      <header className="flex items-center gap-ds2">
        <Pill size="sm" variant="info">
          {tag.label}
        </Pill>
        {narrative.country && (
          <span aria-label={`country ${narrative.country}`} className="text-[13px]">
            {flagEmoji(narrative.country)}
          </span>
        )}
        <span
          data-numeric="true"
          className="ml-auto text-[10px] tabular-nums text-ds-text-tertiary"
        >
          {formatRelative(ageMs)}
        </span>
      </header>

      <p className="mt-ds2 text-[13px] leading-snug text-ds-text-primary">
        {narrative.title}
      </p>

      <div
        className="mt-ds2 h-[3px] w-full overflow-hidden bg-ds-bg-surfaceHi"
        role="progressbar"
        aria-valuenow={narrative.volume}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Impact"
      >
        <div
          className="h-full bg-ds-accent-cyan"
          style={{ width: `${Math.min(100, narrative.volume)}%` }}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-ds3 flex flex-wrap gap-ds2">
          {related.map((t) => (
            <Link
              key={t.id}
              href={tokenHref(t)}
              className="rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds2 py-[2px] text-[10px] uppercase tracking-[0.22em] text-ds-text-primary active:bg-ds-bg-surfaceHi"
            >
              {t.symbol}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

function Skeleton() {
  return (
    <ul aria-busy aria-label="Loading narratives">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex flex-col gap-ds2 border-b border-ds-border-subtle/60 px-ds4 py-ds3"
        >
          <div className="h-3 w-32 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          <div className="h-2 w-3/4 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          <div className="h-2 w-1/2 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-ds3 px-ds5 py-ds11 text-center font-ds-mono">
      <p className="text-[11px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        No narratives detected
      </p>
      <p className="max-w-[280px] text-[12px] leading-relaxed text-ds-text-secondary">
        Pull down to refresh — the feed is live.
      </p>
    </div>
  );
}

function formatRelative(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h`;
}
