import type { Token } from './types/token';

/**
 * Canonical link to a token detail page. Format:
 *
 *   /token/<chain>/<address>
 *
 * Preference order for the second segment:
 *   1. token.contractAddress (the on-chain handle the user expects)
 *   2. token.id              (mock / synthetic tokens that have no
 *                              contract — the API route can still scan
 *                              the universe by id)
 *
 * Chain defaults to 'other' so unmapped chains still produce a valid
 * URL; the API route returns 404 if no token matches.
 */
export function tokenHref(token: Pick<Token, 'chain' | 'contractAddress' | 'id'>): string {
  const chain = token.chain || 'other';
  const handle = token.contractAddress?.trim() || token.id;
  return `/token/${encodeURIComponent(chain)}/${encodeURIComponent(handle)}`;
}

/** Same shape, but for callers that only have the bare chain + address. */
export function tokenHrefRaw(chain: string, address: string): string {
  return `/token/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`;
}
