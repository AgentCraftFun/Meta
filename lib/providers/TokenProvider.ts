import type {
  Token,
  TokenFetchOpts,
  TokenSourceMode,
} from '../types/token';

export interface TokenProvider {
  /** Stable id, e.g. 'mock' / 'dexscreener' / 'birdeye'. Used by the dev badge. */
  readonly id: TokenSourceMode;
  /** Returns the ranked Token[] for the given window / filter / chain. */
  fetch(opts: TokenFetchOpts): Promise<Token[]>;
}
