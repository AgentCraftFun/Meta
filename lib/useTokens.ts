'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TimeWindow } from './types';
import type { Token, TokenSourceMode } from './types/token';

type TokensResponse = {
  source: TokenSourceMode;
  window: TimeWindow;
  cached: boolean;
  tokens: Token[];
};

async function fetchTokens(window: TimeWindow): Promise<TokensResponse> {
  const res = await fetch(`/api/tokens?window=${window}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Tokens request failed (${res.status})`);
  return (await res.json()) as TokensResponse;
}

export function useTokens(window: TimeWindow) {
  return useQuery({
    queryKey: ['tokens', window],
    queryFn: () => fetchTokens(window),
    refetchInterval: 60_000,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export type { TokensResponse };
