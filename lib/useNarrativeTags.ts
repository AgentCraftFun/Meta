'use client';

import { useMemo } from 'react';
import { narrativeToTag } from './narrativeTagger';
import { useMetaStore } from './store';
import type { NarrativeTag } from './types';
import { useNarratives } from './useNarratives';
import { useTokens } from './useTokens';

/**
 * All unique narrative tags currently active. Derived from the
 * narratives in the active time window — no extra network roundtrip.
 *
 * Order matches narrative ranking (rank asc), so the first tag returned
 * is from the highest-ranked narrative.
 */
export function useNarrativeTags(): NarrativeTag[] {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window);

  return useMemo(() => {
    const tags = new Map<string, NarrativeTag>();
    const sorted = (data?.narratives ?? [])
      .slice()
      .sort((a, b) => a.rank - b.rank);
    for (const n of sorted) {
      if (tags.has(n.id)) continue;
      tags.set(n.id, narrativeToTag(n));
    }
    return Array.from(tags.values());
  }, [data]);
}

/**
 * Tokens whose narrativeTags include the given narrative id. Uses the
 * already-tagged token universe from /api/tokens — no client-side
 * tagging needed.
 *
 * Pass `null` to skip the filter and get the empty array — useful for
 * conditional rendering when there's no selected narrative.
 */
export function useTokensForNarrative(narrativeId: string | null) {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useTokens(window);

  return useMemo(() => {
    if (!narrativeId) return [];
    return (data?.tokens ?? []).filter((t) =>
      t.narrativeTags.some((tag) => tag.id === narrativeId)
    );
  }, [data, narrativeId]);
}
