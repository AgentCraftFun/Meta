'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MobileTokenCard from '@/components/mobile/MobileTokenCard';
import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';

const KEY = 'metamap.watchlist.v1';

/** Read the same localStorage shape useWatchlist writes to. */
function readWatchlist(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export default function MobileWatchlist() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const { data } = useTokens(window_);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setKeys(readWatchlist());
    // Refresh when this tab regains focus (user starred from elsewhere)
    const onFocus = () => setKeys(readWatchlist());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const tokens = (data?.tokens ?? []).filter((t) => {
    const handle = (t.contractAddress ?? t.id).toLowerCase();
    return keys.has(`${t.chain}:${handle}`);
  });

  if (keys.size === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-ds4 bg-ds-bg-base px-ds5 text-center font-ds-mono">
        <span className="text-[11px] uppercase tracking-[0.36em] text-ds-text-tertiary">
          Watchlist
        </span>
        <p className="max-w-[300px] text-[14px] leading-relaxed text-ds-text-secondary">
          Tap the star on any token to keep an eye on it. Your list syncs across
          screens on this device.
        </p>
        <Link
          href="/terminal"
          className="inline-flex h-11 items-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds4 text-[11px] uppercase tracking-[0.32em] text-ds-text-primary active:bg-ds-bg-surfaceHi"
        >
          Find tokens to watch
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-ds-bg-base">
      <ul role="list">
        {tokens.map((t) => (
          <li key={t.id}>
            <MobileTokenCard token={t} />
          </li>
        ))}
        {tokens.length === 0 && (
          <li className="px-ds5 py-ds11 text-center font-ds-mono text-[12px] text-ds-text-secondary">
            Your starred tokens aren't in this hour's universe yet. They'll
            appear once they trade.
          </li>
        )}
      </ul>
    </div>
  );
}
