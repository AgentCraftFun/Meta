import type { Token, TokenFilter } from '../types/token';
import type { ChainFilter } from '../store';
import type { SortColumn, SortDirection, Timeframe } from './state';

/** Map the timeframe picker to the corresponding priceChange field. */
export function priceChangeFor(t: Token, tf: Timeframe): number {
  switch (tf) {
    case '5m':
      return t.priceChange5m ?? 0;
    case '1h':
      return t.priceChange1h ?? 0;
    case '6h':
      return t.priceChange6h ?? 0;
    case '24h':
      return t.priceChange24h;
  }
}

function txnsSum(t: Token): number {
  return (t.buys24h ?? 0) + (t.sells24h ?? 0);
}

function valueFor(t: Token, col: SortColumn, tf: Timeframe): number {
  switch (col) {
    case 'rank':
      return 0;
    case 'symbol':
      return 0; // sort by string handled separately
    case 'age':
      return t.age;
    case 'mcap':
      return t.marketCap;
    case 'price':
      return t.priceUsd;
    case 'change5m':
      return t.priceChange5m ?? 0;
    case 'change1h':
      return t.priceChange1h ?? 0;
    case 'change6h':
      return t.priceChange6h ?? 0;
    case 'change24h':
      return t.priceChange24h;
    case 'volume':
      return t.volume24h;
    case 'txns':
      return txnsSum(t);
    case 'liquidity':
      return t.liquidityUsd ?? 0;
    default:
      return priceChangeFor(t, tf);
  }
}

/** Apply chain pre-filter then narrative-tag multi-filter. AND across
 *  the two filter groups, OR within narrative ids. */
export function applyFilters(
  tokens: Token[],
  chain: ChainFilter,
  narrativeIds: string[]
): Token[] {
  let out = tokens;
  if (chain !== 'all') out = out.filter((t) => t.chain === chain);
  if (narrativeIds.length > 0) {
    const set = new Set(narrativeIds);
    out = out.filter((t) =>
      t.narrativeTags.some((tag) => set.has(tag.id))
    );
  }
  return out;
}

/**
 * Sort an already-filtered set per the active tab + timeframe + explicit
 * column override. Pure / deterministic.
 *
 *   tab=trending → "no opinion, server already returned activity-ranked"
 *   tab=gainers  → priceChange for timeframe desc
 *   tab=losers   → priceChange for timeframe asc
 *   tab=new      → age asc (newest first), drop tokens with no age
 *
 * When `sortColumn` is set the user has clicked a header — that wins
 * over the tab default.
 */
export function sortTokens(
  tokens: Token[],
  tab: TokenFilter,
  timeframe: Timeframe,
  sortColumn: SortColumn | null,
  sortDirection: SortDirection
): Token[] {
  if (sortColumn) {
    const out = tokens.slice();
    if (sortColumn === 'symbol') {
      out.sort((a, b) =>
        a.symbol.localeCompare(b.symbol, undefined, { sensitivity: 'base' })
      );
      return sortDirection === 'desc' ? out.reverse() : out;
    }
    out.sort((a, b) => valueFor(a, sortColumn, timeframe) - valueFor(b, sortColumn, timeframe));
    return sortDirection === 'desc' ? out.reverse() : out;
  }

  switch (tab) {
    case 'gainers':
      return tokens
        .slice()
        .sort((a, b) => priceChangeFor(b, timeframe) - priceChangeFor(a, timeframe));
    case 'losers':
      return tokens
        .slice()
        .sort((a, b) => priceChangeFor(a, timeframe) - priceChangeFor(b, timeframe));
    case 'new':
      return tokens
        .filter((t) => t.age > 0 && t.age < 24)
        .sort((a, b) => a.age - b.age);
    case 'trending':
    default:
      // Provider returned activity-ranked already.
      return tokens;
  }
}
