/**
 * Persistent recent-searches list. Stores up to 5 entries in
 * localStorage so the dropdown can prime suggestions when the user
 * focuses an empty input.
 *
 * Versioned key — bumping the suffix invalidates older shapes without
 * a runtime migration.
 */

const KEY = 'metamap.recentSearches.v1';
const MAX = 5;

export type RecentSearch = {
  /** Either a literal query string the user typed, or a result-row
   *  label they activated. */
  query: string;
  /** Wall-clock ms when added/promoted — newest first ordering. */
  at: number;
};

function read(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.query === 'string' &&
        r.query.length > 0 &&
        typeof r.at === 'number'
    );
  } catch {
    return [];
  }
}

function write(rows: RecentSearch[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    // localStorage full or disabled — silent fail is fine.
  }
}

export function getRecentSearches(): RecentSearch[] {
  return read().slice(0, MAX);
}

export function pushRecentSearch(query: string): RecentSearch[] {
  const q = query.trim();
  if (!q) return read();
  const rows = read().filter((r) => r.query !== q);
  rows.unshift({ query: q, at: Date.now() });
  const capped = rows.slice(0, MAX);
  write(capped);
  return capped;
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
