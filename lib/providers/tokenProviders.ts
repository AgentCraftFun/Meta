import type { TokenSourceMode } from '../types/token';
import { BirdeyeTokenProvider } from './BirdeyeTokenProvider';
import { MockTokenProvider } from './MockTokenProvider';
import { DexscreenerTokenProvider } from './tokens/dexscreener';
import type { TokenProvider } from './TokenProvider';

const VALID_SOURCES: readonly TokenSourceMode[] = [
  'mock',
  'dexscreener',
  'birdeye',
] as const;

let warnedUnknownSource = false;

export function getActiveTokenSource(): TokenSourceMode {
  const raw = (process.env.TOKEN_SOURCE ?? 'mock').trim().toLowerCase();
  if ((VALID_SOURCES as readonly string[]).includes(raw)) {
    return raw as TokenSourceMode;
  }
  if (raw && !warnedUnknownSource) {
    warnedUnknownSource = true;
    console.warn(
      `[providers] Unknown TOKEN_SOURCE="${raw}"; falling back to mock. Valid: ${VALID_SOURCES.join(', ')}`
    );
  }
  return 'mock';
}

/** Single shared provider instance so the in-memory universe cache is
 *  reused across API requests inside the same serverless instance. */
const dexscreenerSingleton = new DexscreenerTokenProvider();

export function getTokenProvider(): TokenProvider {
  switch (getActiveTokenSource()) {
    case 'dexscreener':
      return dexscreenerSingleton;
    case 'birdeye':
      return new BirdeyeTokenProvider();
    case 'mock':
    default:
      return new MockTokenProvider();
  }
}

export type { TokenProvider };
