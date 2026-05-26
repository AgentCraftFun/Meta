import type { Token } from '../types/token';

export type SearchResultGroup = 'tokens' | 'narratives' | 'countries' | 'wallets';

export type TokenResult = {
  kind: 'token';
  id: string;
  symbol: string;
  name: string;
  chain: Token['chain'];
  imageUrl?: string;
  /** Used as the hint and to route on Enter. */
  href: string;
};

export type NarrativeResult = {
  kind: 'narrative';
  id: string;
  label: string;
  /** Original narrative.title — shown as secondary text. */
  title: string;
  countryISO?: string;
  colorHash: number;
  href: string;
};

export type CountryResult = {
  kind: 'country';
  iso: string;
  name: string;
  href: string;
};

export type WalletResult = {
  kind: 'wallet';
  address: string;
  /** Heuristic — EVM hex / Solana base58. */
  chain: 'ethereum' | 'solana' | 'unknown';
  href: string;
};

export type SearchResult =
  | TokenResult
  | NarrativeResult
  | CountryResult
  | WalletResult;

export type SearchResponse = {
  q: string;
  tokens: TokenResult[];
  narratives: NarrativeResult[];
  countries: CountryResult[];
  wallets: WalletResult[];
};
