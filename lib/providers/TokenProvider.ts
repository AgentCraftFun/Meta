import type { TimeWindow } from '../types';
import type { Token, TokenSourceMode } from '../types/token';

export interface TokenProvider {
  /** Stable id, e.g. 'mock' / 'dexscreener' / 'birdeye'. Used by the dev badge. */
  readonly id: TokenSourceMode;
  fetch(window: TimeWindow): Promise<Token[]>;
}
