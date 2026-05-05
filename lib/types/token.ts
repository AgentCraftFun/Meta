import type { TimeWindow } from '../types';

export type HeatLevel = 'hot' | 'warm' | 'emerging';

export type TokenChain = 'solana' | 'ethereum' | 'base' | 'other';

export type TokenSource = 'pumpfun' | 'dexscreener' | 'birdeye' | 'mock';

export type Token = {
  /** Canonical id, stable across refetches. */
  id: string;
  symbol: string;
  name: string;
  /** USD market cap. */
  marketCap: number;
  /** USD volume in the active window. */
  volume24h: number;
  priceUsd: number;
  /** -100 .. +∞ percent. */
  priceChange24h: number;
  /** -1 .. 1, derived from priceChange + volume velocity. */
  momentum: number;
  category: HeatLevel;
  /** Theme tags used later for Moon→Earth narrative connections. */
  narrativeTags: string[];
  chain: TokenChain;
  /** Hours since launch. */
  age: number;
  contractAddress?: string;
  source: TokenSource;
};

export type TokenSourceMode = 'mock' | 'dexscreener' | 'birdeye';

export type TokenQuery = {
  window: TimeWindow;
};

export type TokensResponse = {
  source: TokenSourceMode;
  window: TimeWindow;
  cached: boolean;
  tokens: Token[];
};
