'use client';

import { useMemo } from 'react';
import type { ChainFilter } from './store';
import { useMetaStore } from './store';
import type { TimeWindow } from './types';
import type { Token } from './types/token';
import { useTokens } from './useTokens';

/**
 * Returns the universe the moon should consider, after merging simulated
 * tokens from the live feed and applying the chain pre-filter AND the
 * shared narrative-tag filter from useMetaStore. Pill-level filtering
 * (trending / hot / new / gainers / losers) happens further downstream
 * via applyMoonFilter.
 */
export function useEffectiveTokens(window: TimeWindow): Token[] {
  const { data } = useTokens(window);
  const simulated = useMetaStore((s) => s.simulatedTokens);
  const chain = useMetaStore((s) => s.chain);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);

  return useMemo(() => {
    const apiTokens = data?.tokens ?? [];
    const merged = [...simulated, ...apiTokens];
    return narrativeFilter(chainFilter(merged, chain), narrativeIds);
  }, [data, simulated, chain, narrativeIds]);
}

function chainFilter(tokens: Token[], chain: ChainFilter): Token[] {
  if (chain === 'all') return tokens;
  return tokens.filter((t) => t.chain === chain);
}

function narrativeFilter(tokens: Token[], ids: string[]): Token[] {
  if (ids.length === 0) return tokens;
  const set = new Set(ids);
  return tokens.filter((t) => t.narrativeTags.some((tag) => set.has(tag.id)));
}
