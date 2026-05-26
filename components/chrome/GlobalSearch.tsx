'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  buildSearchResponse,
  mergeSearchResponses,
  totalCount,
} from '@/lib/search/match';
import {
  getRecentSearches,
  pushRecentSearch,
  type RecentSearch,
} from '@/lib/search/recent';
import type {
  CountryResult,
  NarrativeResult,
  SearchResponse,
  SearchResult,
  TokenResult,
  WalletResult,
} from '@/lib/search/types';
import { flagEmoji } from '@/lib/flags';
import { shortAddress } from '@/lib/format';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

const DEBOUNCE_MS = 120;
const EMPTY_RESPONSE: SearchResponse = {
  q: '',
  tokens: [],
  narratives: [],
  countries: [],
  wallets: [],
};

/**
 * Global search field. Sits in the centre of the TopBar.
 *
 *   ⌘K / Ctrl-K — focus from anywhere
 *   /          — focus when no other field has focus
 *   Esc         — close dropdown
 *   ↑ ↓         — move highlight across the flat result list
 *   Enter       — open highlighted result (or first result if none)
 *
 * Results pipeline:
 *   1. Immediately filter the React Query cache (already in RAM)
 *   2. After DEBOUNCE_MS, hit /api/search for broader matches
 *   3. Merge — client matches first, then unique server matches
 *
 * Recent searches load from localStorage and show when the field is
 * focused but empty. Hitting Enter promotes the activated row's label
 * to the top of the list.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [serverResults, setServerResults] = useState<SearchResponse>(EMPTY_RESPONSE);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  // ── React Query caches ──
  const window = useMetaStore((s) => s.timeWindow);
  const { data: tokensData } = useTokens(window);
  const { data: narrativesData } = useNarratives(window);

  // Synchronous results — derived from the cache.
  const clientResults = useMemo(
    () =>
      buildSearchResponse(
        debouncedQ,
        tokensData?.tokens ?? [],
        narrativesData?.narratives ?? []
      ),
    [debouncedQ, tokensData, narrativesData]
  );

  const merged = useMemo(
    () => mergeSearchResponses(clientResults, serverResults),
    [clientResults, serverResults]
  );

  // Flat list for keyboard nav — order: tokens, narratives, countries, wallets.
  const flatResults = useMemo<SearchResult[]>(
    () => [
      ...merged.tokens,
      ...merged.narratives,
      ...merged.countries,
      ...merged.wallets,
    ],
    [merged]
  );

  // Expose focus hook for KeyboardShortcuts.
  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setOpen(true);
    };
    (window as unknown as { __metamapSearchFocus?: () => void }).__metamapSearchFocus =
      focus;
    return () => {
      (window as unknown as { __metamapSearchFocus?: () => void }).__metamapSearchFocus =
        undefined;
    };
  }, []);

  // Debounce + server fetch.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!debouncedQ) {
      setServerResults(EMPTY_RESPONSE);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((r: SearchResponse) => setServerResults(r))
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.warn('[search] /api/search failed', err);
      });
    return () => ctrl.abort();
  }, [debouncedQ]);

  // Click-outside close.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Recents load + persistence.
  useEffect(() => {
    setRecents(getRecentSearches());
  }, []);

  // Reset active index when result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [flatResults]);

  const activate = useCallback(
    (r: SearchResult) => {
      const label =
        r.kind === 'token'
          ? r.symbol
          : r.kind === 'narrative'
            ? r.label
            : r.kind === 'country'
              ? r.name
              : r.address;
      setRecents(pushRecentSearch(label));
      setOpen(false);
      setQ('');
      router.push(r.href);
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = flatResults[activeIndex];
      if (r) activate(r);
    }
  };

  const showRecents = open && q.trim() === '' && recents.length > 0;
  const showResults = open && q.trim() !== '';
  const empty = showResults && totalCount(merged) === 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[560px]"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-owns="global-search-listbox"
    >
      <input
        ref={inputRef}
        type="search"
        value={q}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search tokens, narratives, countries"
        aria-autocomplete="list"
        aria-controls="global-search-listbox"
        placeholder="Search tokens, narratives, countries… (⌘K)"
        onChange={(e) => {
          setQ(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-8 w-full rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds3 font-ds-mono text-[12px] text-ds-text-primary placeholder:text-ds-text-tertiary focus:border-ds-accent-cyan/60 focus:outline-none focus:ring-1 focus:ring-ds-accent-cyan/40"
      />

      {(showResults || showRecents) && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[71] max-h-[480px] overflow-y-auto rounded-ds-md border border-ds-border-strong bg-ds-bg-surface shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)]"
        >
          {showRecents && (
            <RecentList
              recents={recents}
              onPick={(query) => {
                setQ(query);
                setDebouncedQ(query);
                inputRef.current?.focus();
              }}
            />
          )}

          {showResults && empty && (
            <div className="px-ds5 py-ds6 text-center font-ds-mono text-[11px] uppercase tracking-[0.32em] text-ds-text-secondary">
              No matches. Try a ticker, narrative, or country.
            </div>
          )}

          {showResults && !empty && (
            <ResultGroups
              merged={merged}
              flatResults={flatResults}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onActivate={activate}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────

function RecentList({
  recents,
  onPick,
}: {
  recents: RecentSearch[];
  onPick: (q: string) => void;
}) {
  return (
    <section aria-label="Recent searches">
      <GroupHeader>Recent</GroupHeader>
      <ul>
        {recents.map((r) => (
          <li key={r.query}>
            <button
              type="button"
              onClick={() => onPick(r.query)}
              className="flex w-full items-center gap-ds2 px-ds3 py-ds2 text-left font-ds-mono text-[12px] text-ds-text-secondary hover:bg-ds-bg-surfaceHi hover:text-ds-text-primary"
            >
              <span aria-hidden className="text-ds-text-tertiary">↺</span>
              <span>{r.query}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultGroups({
  merged,
  flatResults,
  activeIndex,
  onHover,
  onActivate,
}: {
  merged: SearchResponse;
  flatResults: SearchResult[];
  activeIndex: number;
  onHover: (i: number) => void;
  onActivate: (r: SearchResult) => void;
}) {
  let cursor = 0;
  const rangeFor = (count: number) => {
    const range: [number, number] = [cursor, cursor + count];
    cursor += count;
    return range;
  };
  const tokenRange = rangeFor(merged.tokens.length);
  const narrativeRange = rangeFor(merged.narratives.length);
  const countryRange = rangeFor(merged.countries.length);
  const walletRange = rangeFor(merged.wallets.length);

  return (
    <div className="flex flex-col">
      {merged.tokens.length > 0 && (
        <ResultGroup label="Tokens">
          {merged.tokens.map((r, i) => (
            <TokenRow
              key={r.id}
              row={r}
              active={activeIndex === tokenRange[0] + i}
              onHover={() => onHover(tokenRange[0] + i)}
              onActivate={() => onActivate(r)}
            />
          ))}
        </ResultGroup>
      )}
      {merged.narratives.length > 0 && (
        <ResultGroup label="Narratives">
          {merged.narratives.map((r, i) => (
            <NarrativeRow
              key={r.id}
              row={r}
              active={activeIndex === narrativeRange[0] + i}
              onHover={() => onHover(narrativeRange[0] + i)}
              onActivate={() => onActivate(r)}
            />
          ))}
        </ResultGroup>
      )}
      {merged.countries.length > 0 && (
        <ResultGroup label="Countries">
          {merged.countries.map((r, i) => (
            <CountryRow
              key={r.iso}
              row={r}
              active={activeIndex === countryRange[0] + i}
              onHover={() => onHover(countryRange[0] + i)}
              onActivate={() => onActivate(r)}
            />
          ))}
        </ResultGroup>
      )}
      {merged.wallets.length > 0 && (
        <ResultGroup label="Wallets">
          {merged.wallets.map((r, i) => (
            <WalletRow
              key={r.address}
              row={r}
              active={activeIndex === walletRange[0] + i}
              onHover={() => onHover(walletRange[0] + i)}
              onActivate={() => onActivate(r)}
            />
          ))}
        </ResultGroup>
      )}
      {/* flatResults length is computed inline for sanity but only used
          to keep the indices honest in the callers; nothing rendered. */}
      <span hidden aria-hidden>{flatResults.length}</span>
    </div>
  );
}

function ResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label} className="border-t border-ds-border-subtle/60 first:border-t-0">
      <GroupHeader>{label}</GroupHeader>
      <ul>{children}</ul>
    </section>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-ds3 pt-ds2 pb-ds1 font-ds-mono text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
      {children}
    </h3>
  );
}

function ResultBase({
  active,
  onHover,
  onActivate,
  children,
  hint,
}: {
  active: boolean;
  onHover: () => void;
  onActivate: () => void;
  children: React.ReactNode;
  hint: string;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={onActivate}
        className={[
          'flex w-full items-center gap-ds3 px-ds3 py-ds2 text-left font-ds-mono transition-colors duration-ds-fast ease-ds-standard',
          active
            ? 'bg-ds-bg-surfaceHi text-ds-text-primary'
            : 'text-ds-text-secondary hover:bg-ds-bg-surfaceHi',
        ].join(' ')}
      >
        {children}
        <span className="ml-auto shrink-0 text-[9px] uppercase tracking-[0.32em] text-ds-text-tertiary">
          {hint}
        </span>
      </button>
    </li>
  );
}

function TokenRow({
  row,
  active,
  onHover,
  onActivate,
}: {
  row: TokenResult;
  active: boolean;
  onHover: () => void;
  onActivate: () => void;
}) {
  return (
    <ResultBase active={active} onHover={onHover} onActivate={onActivate} hint="Token">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-base text-[9px] uppercase text-ds-text-primary"
      >
        {row.symbol.slice(0, 2)}
      </span>
      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-ds-text-primary">
        {row.symbol}
      </span>
      <span className="truncate text-[11px] text-ds-text-secondary">{row.name}</span>
    </ResultBase>
  );
}

function NarrativeRow({
  row,
  active,
  onHover,
  onActivate,
}: {
  row: NarrativeResult;
  active: boolean;
  onHover: () => void;
  onActivate: () => void;
}) {
  return (
    <ResultBase active={active} onHover={onHover} onActivate={onActivate} hint="Narrative">
      <span
        aria-hidden
        className="inline-flex h-5 items-center rounded-ds-sm border border-ds-accent-cyan/40 bg-ds-accent-cyan/10 px-ds2 text-[9px] uppercase tracking-[0.32em] text-ds-accent-cyan"
      >
        {row.label}
      </span>
      <span className="truncate text-[11px] text-ds-text-secondary">{row.title}</span>
    </ResultBase>
  );
}

function CountryRow({
  row,
  active,
  onHover,
  onActivate,
}: {
  row: CountryResult;
  active: boolean;
  onHover: () => void;
  onActivate: () => void;
}) {
  return (
    <ResultBase active={active} onHover={onHover} onActivate={onActivate} hint="Country">
      <span aria-hidden className="text-[14px]">
        {flagEmoji(row.iso)}
      </span>
      <span className="text-[12px] text-ds-text-primary">{row.name}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-ds-text-tertiary">
        {row.iso}
      </span>
    </ResultBase>
  );
}

function WalletRow({
  row,
  active,
  onHover,
  onActivate,
}: {
  row: WalletResult;
  active: boolean;
  onHover: () => void;
  onActivate: () => void;
}) {
  return (
    <ResultBase active={active} onHover={onHover} onActivate={onActivate} hint="Wallet">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-base text-[9px] uppercase text-ds-text-tertiary"
      >
        {row.chain === 'solana' ? 'S' : '⬢'}
      </span>
      <span data-numeric="true" className="text-[12px] text-ds-text-primary">
        {shortAddress(row.address, 6, 6)}
      </span>
      <span className="text-[10px] uppercase tracking-[0.22em] text-ds-text-tertiary">
        {row.chain}
      </span>
    </ResultBase>
  );
}
