import type { TimeWindow } from '../types';
import type { Token } from '../types/token';
import type { TokenProvider } from './TokenProvider';

/**
 * Real DexScreener integration lands later. Stub returns [] so a misconfigured
 * TOKEN_SOURCE=dexscreener doesn't blank the moon.
 */
export class DexscreenerTokenProvider implements TokenProvider {
  readonly id = 'dexscreener' as const;

  async fetch(_window: TimeWindow): Promise<Token[]> {
    // Future: hit https://api.dexscreener.com/latest/dex/tokens/{addresses}
    // and shape into Token[] with proper category + momentum derivation.
    return [];
  }
}
