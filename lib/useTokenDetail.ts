'use client';

import { useQuery } from '@tanstack/react-query';
import type { Token, TokenChain } from './types/token';

/** Single-token detail fetcher. The endpoint server-tags against the
 *  current 1h narrative window before returning, so the response is
 *  already linked when it lands client-side. */
async function fetchTokenDetail(
  chain: TokenChain | string,
  address: string
): Promise<Token | null> {
  const res = await fetch(
    `/api/token/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
    { cache: 'no-store' }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Token detail failed (${res.status})`);
  const json = (await res.json()) as { token: Token | null };
  return json.token;
}

export function useTokenDetail(chain: string, address: string) {
  return useQuery({
    queryKey: ['token-detail', chain.toLowerCase(), address.toLowerCase()],
    queryFn: () => fetchTokenDetail(chain, address),
    refetchInterval: 30_000,
    staleTime: 15_000,
    enabled: Boolean(chain && address),
  });
}

export type ExplanationResponse = {
  explanation: string | null;
  generatedAt: string;
  citations: { id: string; label: string }[];
  reason?: 'no_signal' | 'no_api_key' | 'llm_error' | 'not_found';
  cached?: boolean;
};

async function fetchExplanation(
  chain: string,
  address: string
): Promise<ExplanationResponse> {
  const res = await fetch(
    `/api/token/${encodeURIComponent(chain)}/${encodeURIComponent(address)}/explanation`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Explanation failed (${res.status})`);
  return (await res.json()) as ExplanationResponse;
}

/** Refetches every 5 minutes — matches the server-side TTL. */
export function useTokenExplanation(chain: string, address: string) {
  return useQuery({
    queryKey: ['token-explanation', chain.toLowerCase(), address.toLowerCase()],
    queryFn: () => fetchExplanation(chain, address),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
    enabled: Boolean(chain && address),
  });
}
