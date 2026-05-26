import centroidsRaw from '@/public/data/country-centroids.json';
import { narrativeToTag } from '../narrativeTagger';
import type { Narrative } from '../types';
import type { Token } from '../types/token';
import type {
  CountryResult,
  NarrativeResult,
  SearchResponse,
  TokenResult,
  WalletResult,
} from './types';

type Centroid = { name: string; lat: number; lng: number };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const TOKEN_LIMIT = 5;
const NARRATIVE_LIMIT = 5;
const COUNTRY_LIMIT = 3;

/**
 * Pure ranking + grouping. Same engine runs client-side (against the
 * React Query cache) and server-side (against any extra data the
 * /api/search route pulls in). Tokens prefer startsWith over contains
 * so a "PEPE" query lands the literal PEPE row before anything else.
 */
export function matchTokens(q: string, tokens: Token[]): TokenResult[] {
  if (!q) return [];
  const needle = q.toLowerCase();
  const starts: Token[] = [];
  const contains: Token[] = [];
  for (const t of tokens) {
    const sym = t.symbol.toLowerCase();
    const name = t.name.toLowerCase();
    if (sym.startsWith(needle) || name.startsWith(needle)) {
      starts.push(t);
    } else if (sym.includes(needle) || name.includes(needle)) {
      contains.push(t);
    }
  }
  const merged = [...starts, ...contains].slice(0, TOKEN_LIMIT);
  return merged.map((t) => ({
    kind: 'token',
    id: t.id,
    symbol: t.symbol,
    name: t.name,
    chain: t.chain,
    imageUrl: t.imageUrl,
    href: `/token/${encodeURIComponent(t.id)}`,
  }));
}

export function matchNarratives(q: string, narratives: Narrative[]): NarrativeResult[] {
  if (!q) return [];
  const needle = q.toLowerCase();
  const hits: Narrative[] = [];
  for (const n of narratives) {
    const label = (n.tagLabel || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    if (label.includes(needle) || title.includes(needle)) hits.push(n);
  }
  return hits.slice(0, NARRATIVE_LIMIT).map((n) => {
    const tag = narrativeToTag(n);
    return {
      kind: 'narrative',
      id: n.id,
      label: tag.label,
      title: n.title,
      countryISO: tag.countryISO,
      colorHash: tag.colorHash,
      // Currently a stub — when the Narrative explorer ships this is the
      // canonical deep link. For now /narratives surfaces the rail.
      href: `/narratives#${encodeURIComponent(n.id)}`,
    };
  });
}

export function matchCountries(q: string): CountryResult[] {
  if (!q) return [];
  const needle = q.toLowerCase();
  const hits: CountryResult[] = [];
  for (const [iso, c] of Object.entries(CENTROIDS)) {
    if (iso.toLowerCase() === needle || iso.toLowerCase().startsWith(needle)) {
      hits.unshift({ kind: 'country', iso, name: c.name, href: `/map?country=${iso}` });
      continue;
    }
    if (c.name.toLowerCase().includes(needle)) {
      hits.push({ kind: 'country', iso, name: c.name, href: `/map?country=${iso}` });
    }
  }
  return hits.slice(0, COUNTRY_LIMIT);
}

/** Wallets are special — at most one result, only when the query
 *  looks like an address. We don't search wallets, we recognise them. */
export function matchWallets(q: string): WalletResult[] {
  const trimmed = q.trim();
  if (EVM_ADDRESS.test(trimmed)) {
    return [
      {
        kind: 'wallet',
        address: trimmed,
        chain: 'ethereum',
        href: `/token/${encodeURIComponent(trimmed)}`,
      },
    ];
  }
  if (SOLANA_ADDRESS.test(trimmed) && trimmed.length >= 32) {
    return [
      {
        kind: 'wallet',
        address: trimmed,
        chain: 'solana',
        href: `/token/${encodeURIComponent(trimmed)}`,
      },
    ];
  }
  return [];
}

/** Flatten + run all four matchers. Caller decides what to merge. */
export function buildSearchResponse(
  q: string,
  tokens: Token[],
  narratives: Narrative[]
): SearchResponse {
  return {
    q,
    tokens: matchTokens(q, tokens),
    narratives: matchNarratives(q, narratives),
    countries: matchCountries(q),
    wallets: matchWallets(q),
  };
}

/** Merge a client-side response with an /api/search response, dropping
 *  duplicate tokens by id. Server adds breadth; client gives instant. */
export function mergeSearchResponses(
  client: SearchResponse,
  server: SearchResponse
): SearchResponse {
  const seenTokens = new Set(client.tokens.map((t) => t.id));
  const extraTokens = server.tokens.filter((t) => !seenTokens.has(t.id));

  const seenNarratives = new Set(client.narratives.map((n) => n.id));
  const extraNarratives = server.narratives.filter((n) => !seenNarratives.has(n.id));

  return {
    q: client.q,
    tokens: [...client.tokens, ...extraTokens].slice(0, TOKEN_LIMIT),
    narratives: [...client.narratives, ...extraNarratives].slice(0, NARRATIVE_LIMIT),
    countries: client.countries.length > 0 ? client.countries : server.countries,
    wallets: client.wallets.length > 0 ? client.wallets : server.wallets,
  };
}

export function totalCount(r: SearchResponse): number {
  return (
    r.tokens.length + r.narratives.length + r.countries.length + r.wallets.length
  );
}
