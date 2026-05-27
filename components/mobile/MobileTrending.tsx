'use client';

import { useState } from 'react';
import MobileTokenCard from '@/components/mobile/MobileTokenCard';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import { useMetaStore } from '@/lib/store';
import type { TokenFilter } from '@/lib/types/token';
import { useTokens } from '@/lib/useTokens';

const TABS: { id: TokenFilter; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'new', label: 'New' },
];

export default function MobileTrending() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const { data, isLoading, isError, refetch } = useTokens(window_);
  const [tab, setTab] = useState<TokenFilter>('trending');

  const tokens = data?.tokens ?? [];
  const filtered = sortFor(tokens, tab);

  return (
    <div className="flex h-full flex-col bg-ds-bg-base">
      <div
        role="tablist"
        aria-label="Token category"
        className="flex shrink-0 gap-ds1 overflow-x-auto border-b border-ds-border-subtle px-ds3 py-ds2 font-ds-mono"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              'flex h-9 shrink-0 items-center rounded-ds-sm px-ds3 text-[10px] uppercase tracking-[0.32em]',
              tab === t.id
                ? 'bg-ds-accent-cyan/15 text-ds-accent-cyan'
                : 'text-ds-text-secondary',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <PullToRefresh onRefresh={() => refetch()}>
          {isError && (
            <div
              role="alert"
              className="border-b border-ds-accent-bear/40 bg-ds-accent-bear/10 px-ds4 py-ds2 text-[11px] uppercase tracking-[0.32em] text-ds-accent-bear"
            >
              Couldn't load tokens — pull down to retry.
            </div>
          )}

          {isLoading && filtered.length === 0 ? (
            <Skeleton />
          ) : filtered.length === 0 ? (
            <Empty />
          ) : (
            <ul role="list">
              {filtered.slice(0, 100).map((t) => (
                <li key={t.id}>
                  <MobileTokenCard token={t} />
                </li>
              ))}
            </ul>
          )}
        </PullToRefresh>
      </div>
    </div>
  );
}

function sortFor(tokens: ReturnType<typeof useTokens>['data'] extends infer D
  ? D extends { tokens: infer T }
    ? T
    : never
  : never, tab: TokenFilter) {
  switch (tab) {
    case 'gainers':
      return [...(tokens ?? [])].sort(
        (a, b) => b.priceChange24h - a.priceChange24h
      );
    case 'losers':
      return [...(tokens ?? [])].sort(
        (a, b) => a.priceChange24h - b.priceChange24h
      );
    case 'new':
      return [...(tokens ?? [])]
        .filter((t) => t.age > 0 && t.age < 24)
        .sort((a, b) => a.age - b.age);
    case 'trending':
    default:
      return tokens ?? [];
  }
}

function Skeleton() {
  return (
    <ul aria-busy aria-label="Loading tokens">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-ds3 border-b border-ds-border-subtle/60 px-ds4 py-ds3"
        >
          <div className="h-11 w-11 animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
          <div className="flex flex-1 flex-col gap-ds2">
            <div className="h-3 w-24 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
            <div className="h-2 w-32 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          </div>
          <div className="flex w-20 flex-col items-end gap-ds2">
            <div className="h-3 w-16 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
            <div className="h-2 w-10 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-ds3 px-ds5 py-ds11 text-center font-ds-mono"
    >
      <p className="text-[11px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        Nothing trending right now
      </p>
      <p className="max-w-[280px] text-[12px] leading-relaxed text-ds-text-secondary">
        Pull down to refresh, or try a different tab.
      </p>
    </div>
  );
}
