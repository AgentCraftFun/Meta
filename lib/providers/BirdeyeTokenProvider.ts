import type { TimeWindow } from '../types';
import type { Token } from '../types/token';
import type { TokenProvider } from './TokenProvider';

/**
 * Real Birdeye integration lands later. Stub returns [] so a misconfigured
 * TOKEN_SOURCE=birdeye doesn't blank the moon.
 */
export class BirdeyeTokenProvider implements TokenProvider {
  readonly id = 'birdeye' as const;

  async fetch(_window: TimeWindow): Promise<Token[]> {
    // Future: hit https://public-api.birdeye.so/defi/tokenlist with
    // sort_by=volume24hUSD and shape into Token[].
    return [];
  }
}
