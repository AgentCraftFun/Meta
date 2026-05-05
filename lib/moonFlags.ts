import type { Token } from './types/token';

export type MoonFilter =
  | 'trending'
  | 'hot'
  | 'new'
  | 'gainers'
  | 'losers';

export const MOON_FILTERS: { id: MoonFilter; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'hot', label: 'Hot' },
  { id: 'new', label: 'New' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
];

/** Cap colour at the top of the flag pole. Indicates the active filter. */
export const FILTER_ACCENT: Record<MoonFilter, string> = {
  trending: '#22D3EE', // cyan
  hot: '#ef4444', // red-orange
  new: '#fbbf24', // amber/yellow
  gainers: '#34d399', // green
  losers: '#94a3b8', // muted blue / slate
};

const MAX_FLAGS = 30;

/**
 * Apply the moon-specific filter on top of the API's window-filtered set.
 * Returns at most MAX_FLAGS tokens, ordered most → least relevant for the
 * filter so flag rank reflects ranking. THREE-free so the page bundle
 * doesn't drag three.js into the static chunk for this helper.
 */
export function applyMoonFilter(tokens: Token[], filter: MoonFilter): Token[] {
  switch (filter) {
    case 'trending':
      return [...tokens]
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, MAX_FLAGS);
    case 'hot':
      return [...tokens]
        .filter((t) => t.momentum > 0.5 || t.category === 'hot')
        .sort((a, b) => b.momentum - a.momentum)
        .slice(0, MAX_FLAGS);
    case 'new':
      return [...tokens]
        .filter((t) => t.age < 24)
        .sort((a, b) => a.age - b.age)
        .slice(0, MAX_FLAGS);
    case 'gainers':
      return [...tokens]
        .sort((a, b) => b.priceChange24h - a.priceChange24h)
        .slice(0, MAX_FLAGS);
    case 'losers':
      return [...tokens]
        .sort((a, b) => a.priceChange24h - b.priceChange24h)
        .slice(0, MAX_FLAGS);
  }
}
