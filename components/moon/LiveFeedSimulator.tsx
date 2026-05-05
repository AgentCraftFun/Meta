'use client';

import { useEffect, useRef } from 'react';
import { useMetaStore } from '@/lib/store';
import type { LiveEvent, LiveEventType } from '@/lib/types/liveEvent';
import type { Token, TokenChain } from '@/lib/types/token';
import { useTokens } from '@/lib/useTokens';

const MIN_INTERVAL_MS = 4000;
const MAX_INTERVAL_MS = 8000;
const MIN_GAP_MS = 2000;

const FAKE_NAMES = [
  'Lazerdog',
  'Pixelmonk',
  'Dustmew',
  'Vaporcat',
  'Brokerat',
  'Cosmocoin',
  'Nukerizen',
  'Wormhat',
  'Pumpwarden',
  'Crypterix',
  'Slugfren',
  'Memerack',
  'Drakefren',
  'Gigafloofy',
  'Houndchad',
  'Volthunter',
  'Skyfish',
  'Glitchgoat',
  'Foxhowl',
  'Halocoin',
];

const SIM_CHAINS: TokenChain[] = ['solana', 'ethereum', 'base'];

const HEAT_BY_ACTIVITY = (priceChange: number, momentum: number): Token['category'] => {
  if (priceChange > 200 || momentum > 0.7) return 'hot';
  if (priceChange > 50 || momentum > 0.3) return 'warm';
  return 'emerging';
};

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function pickFromArr<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fabricate a brand-new mock token. Always young (age < 2h), high
 * momentum, low cap — feels like a fresh pump.fun launch.
 */
function fabricateNewPair(): Token {
  const name = pickFromArr(FAKE_NAMES);
  const symbol = `${name.slice(0, 4).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const priceChange = 30 + Math.random() * 600;
  const momentum = Math.min(1, 0.4 + Math.random() * 0.6);
  const marketCap = 50_000 + Math.random() * 4_000_000;
  const volume24h = marketCap * (0.4 + Math.random() * 0.8);
  const priceUsd = marketCap / (1_000_000_000 + Math.random() * 1e10);
  const chain = pickFromArr(SIM_CHAINS);
  return {
    id: uid('sim'),
    symbol,
    name,
    marketCap,
    volume24h,
    priceUsd,
    priceChange24h: Number(priceChange.toFixed(1)),
    momentum: Number(momentum.toFixed(2)),
    category: HEAT_BY_ACTIVITY(priceChange, momentum),
    narrativeTags: ['meme', 'live'],
    chain,
    age: Math.random() * 0.5,
    contractAddress: undefined,
    source: 'mock',
  };
}

function tokenToEvent(token: Token, type: LiveEventType): LiveEvent {
  return {
    id: uid('ev'),
    type,
    timestamp: Date.now(),
    tokenId: token.id,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    marketCap: token.marketCap,
    volume24h: token.volume24h,
    priceChange24h: token.priceChange24h,
    chain: token.chain,
  };
}

/**
 * Headless component (renders nothing) that injects synthetic events into
 * the store on a random interval, the way a real DEX feed would. Pauses
 * when the tab is hidden so we don't burn CPU in the background.
 */
export default function LiveFeedSimulator() {
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const { data } = useTokens(timeWindow);
  const apiTokensRef = useRef<Token[]>([]);
  apiTokensRef.current = data?.tokens ?? [];

  const lastEmitRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const hiddenRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      hiddenRef.current = document.visibilityState === 'hidden';
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay =
        MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      timerRef.current = window.setTimeout(emit, delay);
    };

    const emit = () => {
      // Don't burn cycles in background tabs.
      if (hiddenRef.current) {
        schedule();
        return;
      }
      // Throttle: never emit more than once per MIN_GAP_MS, even if the
      // timer fires faster (defensive — the timer interval is well above
      // this ceiling, so this only matters if upstream logic invalidates).
      const now = Date.now();
      if (now - lastEmitRef.current < MIN_GAP_MS) {
        schedule();
        return;
      }

      const roll = Math.random();
      const apiTokens = apiTokensRef.current;
      const store = useMetaStore.getState();

      if (roll < 0.6 || apiTokens.length === 0) {
        const fresh = fabricateNewPair();
        store.pushSimulatedToken(fresh);
        store.pushLiveEvent(tokenToEvent(fresh, 'new-pair'));
      } else if (roll < 0.85) {
        const t = pickFromArr(apiTokens);
        store.pushLiveEvent(tokenToEvent(t, 'volume-spike'));
      } else {
        // Pick a top mover by 24h change.
        const top = [...apiTokens]
          .sort((a, b) => b.priceChange24h - a.priceChange24h)
          .slice(0, 8);
        if (top.length > 0) {
          store.pushLiveEvent(tokenToEvent(pickFromArr(top), 'new-high'));
        }
      }
      lastEmitRef.current = now;
      schedule();
    };

    schedule();
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
