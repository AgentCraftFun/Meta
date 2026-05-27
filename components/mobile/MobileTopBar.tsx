'use client';

import { useEffect, useState } from 'react';
import { formatUtcClock } from '@/lib/time';
import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';
import { useNarratives } from '@/lib/useNarratives';

type Props = {
  onSearch: () => void;
  onMenu: () => void;
};

const STATUS_DOT: Record<'fresh' | 'stale' | 'failed', string> = {
  fresh: 'bg-ds-accent-bull',
  stale: 'bg-ds-accent-warn',
  failed: 'bg-ds-accent-bear',
};

/**
 * Mobile top bar. 56px tall (just over the 44×44 tap-target minimum
 * with breathing room). Wordmark left, search + menu icon buttons
 * right, status dot under the wordmark.
 */
export default function MobileTopBar({ onSearch, onMenu }: Props) {
  const window_ = useMetaStore((s) => s.timeWindow);
  const tokens = useTokens(window_);
  const narratives = useNarratives(window_);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const lastUpdate = Math.max(
    tokens.dataUpdatedAt || 0,
    narratives.dataUpdatedAt || 0
  );
  const hasError = Boolean(tokens.error || narratives.error);
  const age = lastUpdate === 0 ? Infinity : Date.now() - lastUpdate;
  const status: 'fresh' | 'stale' | 'failed' = hasError
    ? 'failed'
    : age < 60_000
      ? 'fresh'
      : age < 5 * 60_000
        ? 'stale'
        : 'failed';

  return (
    <header
      role="banner"
      className="flex h-14 shrink-0 items-center justify-between border-b border-ds-border-subtle bg-ds-bg-base px-ds4 font-ds-mono"
    >
      <div className="flex flex-col gap-[2px]">
        <span className="text-[13px] font-semibold uppercase tracking-[0.42em] text-ds-text-primary">
          MetaMap
        </span>
        <div className="flex items-center gap-ds2">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-ds-full ${STATUS_DOT[status]} ${
              status === 'fresh' ? 'animate-ds-pulse' : ''
            }`}
          />
          <span
            data-numeric="true"
            className="text-[9px] tabular-nums tracking-[0.3em] text-ds-text-tertiary"
          >
            {formatUtcClock()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-ds2">
        <IconButton onClick={onSearch} label="Open search">
          <SearchIcon />
        </IconButton>
        <IconButton onClick={onMenu} label="Open menu">
          <MenuIcon />
        </IconButton>
      </div>
    </header>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  // 44×44 tap target per accessibility floor.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-ds-sm text-ds-text-secondary hover:bg-ds-bg-surface hover:text-ds-text-primary"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
