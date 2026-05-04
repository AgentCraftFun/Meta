'use client';

import { useQuery } from '@tanstack/react-query';
import type { Narrative, SourceMode, TimeWindow } from './types';

type NarrativesResponse = {
  source: SourceMode;
  window: TimeWindow;
  cached: boolean;
  narratives: Narrative[];
};

async function fetchNarratives(window: TimeWindow): Promise<NarrativesResponse> {
  const res = await fetch(`/api/narratives?window=${window}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Narratives request failed (${res.status})`);
  return (await res.json()) as NarrativesResponse;
}

export function useNarratives(window: TimeWindow) {
  return useQuery({
    queryKey: ['narratives', window],
    queryFn: () => fetchNarratives(window),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export type { NarrativesResponse };
