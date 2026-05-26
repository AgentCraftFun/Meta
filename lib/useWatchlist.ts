'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * localStorage-backed watchlist. Real watchlist UI ships in a later
 * sprint; for the token detail page we just need a persistent toggle
 * so the star state survives a refresh.
 *
 * Entries are keyed as `<chain>:<address>` (lowercased) so a token
 * starred on /token/solana/... lights up everywhere else without a
 * lookup.
 */

const KEY = 'metamap.watchlist.v1';

function read(): Set<string> {
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

function write(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* full/disabled — silent */
  }
}

function entryKey(chain: string, address: string): string {
  return `${chain.toLowerCase()}:${address.toLowerCase()}`;
}

export function useWatchlist(chain: string, address: string) {
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    const set = read();
    setStarred(set.has(entryKey(chain, address)));
  }, [chain, address]);

  const toggle = useCallback(() => {
    const set = read();
    const key = entryKey(chain, address);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    write(set);
    setStarred(set.has(key));
  }, [chain, address]);

  return { starred, toggle };
}
