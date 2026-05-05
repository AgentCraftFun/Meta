'use client';

import { useMemo } from 'react';
import type { ChainFilter } from './store';
import { useMetaStore } from './store';
import type { TimeWindow } from './types';
import type { Token } from './types/token';
import { useTokens } from './useTokens';

/**
 * Returns the universe the moon should consider, after merging simulated
 * tokens from the live feed and applying the chain pre-filter. Pill-level
 * filtering (trending / hot / new / gainers / losers) happens further
 * downstream via applyMoonFilter.
 */
export function useEffectiveTokens(window: TimeWindow): Token[] {
  const { data } = useTokens(window);
  const simulated = useMetaStore((s) => s.simulatedTokens);
  const chain = useMetaStore((s) => s.chain);

  return useMemo(() => {
    const apiTokens = data?.tokens ?? [];
    const merged = [...simulated, ...apiTokens];
    return chainFilter(merged, chain);
  }, [data, simulated, chain]);
}

function chainFilter(tokens: Token[], chain: ChainFilter): Token[] {
  if (chain === 'all') return tokens;
  return tokens.filter((t) => t.chain === chain);
}
