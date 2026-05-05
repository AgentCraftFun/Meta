import type { TokenSourceMode } from '../types/token';
import { BirdeyeTokenProvider } from './BirdeyeTokenProvider';
import { DexscreenerTokenProvider } from './DexscreenerTokenProvider';
import { MockTokenProvider } from './MockTokenProvider';
import type { TokenProvider } from './TokenProvider';

const VALID_SOURCES: readonly TokenSourceMode[] = [
  'mock',
  'dexscreener',
  'birdeye',
] as const;

export function getActiveTokenSource(): TokenSourceMode {
  const raw = (process.env.TOKEN_SOURCE ?? 'mock').toLowerCase();
  return (VALID_SOURCES as readonly string[]).includes(raw)
    ? (raw as TokenSourceMode)
    : 'mock';
}

export function getTokenProvider(): TokenProvider {
  switch (getActiveTokenSource()) {
    case 'dexscreener':
      return new DexscreenerTokenProvider();
    case 'birdeye':
      return new BirdeyeTokenProvider();
    case 'mock':
    default:
      return new MockTokenProvider();
  }
}

export type { TokenProvider };
