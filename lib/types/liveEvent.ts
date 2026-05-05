export type LiveEventType = 'new-pair' | 'volume-spike' | 'new-high';

export type LiveEvent = {
  id: string;
  type: LiveEventType;
  /** Wall-clock ms when this event was generated. */
  timestamp: number;
  tokenId: string;
  tokenSymbol: string;
  tokenName: string;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  chain: string;
};
