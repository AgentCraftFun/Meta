import type { Token, TokenFetchOpts } from '../types/token';
import type { TokenProvider } from './TokenProvider';

/**
 * NOT IMPLEMENTED — Birdeye is the planned Solana-deep source. Adding it
 * cleanly requires:
 *   1. A BIRDEYE_API_KEY in the env (Standard tier is enough for the
 *      Moon's volume).
 *   2. Mapping `/defi/tokenlist?sort_by=v24hUSD` into Token[], with the
 *      same chain/category derivation the DexScreener provider uses.
 *   3. A separate rate-limit bucket (Birdeye is 1 rps free / 100 rpm paid).
 *
 * Until then this stub returns [] so a misconfigured TOKEN_SOURCE=birdeye
 * doesn't blank the moon. The DexScreener provider is the production
 * source for now.
 */
export class BirdeyeTokenProvider implements TokenProvider {
  readonly id = 'birdeye' as const;

  async fetch(_opts: TokenFetchOpts): Promise<Token[]> {
    return [];
  }
}
