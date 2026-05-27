'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { flagEmoji } from '@/lib/flags';
import {
  buildSearchResponse,
  mergeSearchResponses,
} from '@/lib/search/match';
import type { SearchResponse } from '@/lib/search/types';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

const EMPTY: SearchResponse = {
  q: '',
  tokens: [],
  narratives: [],
  countries: [],
  wallets: [],
};
const DEBOUNCE_MS = 120;

type Props = {
  onClose: () => void;
};

/**
 * Fullscreen search overlay for mobile. Reuses the same client
 * matchers as the desktop GlobalSearch, then merges in /api/search
 * results after a 120ms debounce.
 */
export default function MobileSearch({ onClose }: Props) {
  const window_ = useMetaStore((s) => s.timeWindow);
  const { data: tokens } = useTokens(window_);
  const { data: narratives } = useNarratives(window_);

  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [server, setServer] = useState<SearchResponse>(EMPTY);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!debounced) {
      setServer(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((r: SearchResponse) => setServer(r))
      .catch((err) => {
        if (err?.name !== 'AbortError') console.warn('[mobile-search]', err);
      });
    return () => ctrl.abort();
  }, [debounced]);

  const client = buildSearchResponse(
    debounced,
    tokens?.tokens ?? [],
    narratives?.narratives ?? []
  );
  const merged = mergeSearchResponses(client, server);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[80] flex flex-col bg-ds-bg-base"
    >
      <header className="flex items-center gap-ds2 border-b border-ds-border-subtle px-ds3 py-ds2 font-ds-mono">
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tokens, narratives, countries…"
          aria-label="Search"
          className="h-11 flex-1 rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds3 text-[14px] text-ds-text-primary placeholder:text-ds-text-tertiary focus:border-ds-accent-cyan/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="flex h-11 items-center justify-center rounded-ds-sm px-ds3 text-[11px] uppercase tracking-[0.32em] text-ds-text-secondary active:text-ds-text-primary"
        >
          Cancel
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {debounced === '' ? (
          <Hint />
        ) : merged.tokens.length === 0 &&
          merged.narratives.length === 0 &&
          merged.countries.length === 0 &&
          merged.wallets.length === 0 ? (
          <NoResults />
        ) : (
          <Results merged={merged} onPick={onClose} />
        )}
      </div>
    </div>
  );
}

function Results({
  merged,
  onPick,
}: {
  merged: SearchResponse;
  onPick: () => void;
}) {
  return (
    <div className="flex flex-col">
      {merged.tokens.length > 0 && (
        <Group label="Tokens">
          {merged.tokens.map((r) => (
            <Row
              key={r.id}
              href={r.href}
              onPick={onPick}
              primary={r.symbol}
              secondary={r.name}
              hint="Token"
              icon={
                <span className="flex h-8 w-8 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi text-[10px] uppercase text-ds-text-primary">
                  {r.symbol.slice(0, 2)}
                </span>
              }
            />
          ))}
        </Group>
      )}
      {merged.narratives.length > 0 && (
        <Group label="Narratives">
          {merged.narratives.map((r) => (
            <Row
              key={r.id}
              href={r.href}
              onPick={onPick}
              primary={r.label}
              secondary={r.title}
              hint="Narrative"
              icon={
                <span className="inline-flex h-6 items-center rounded-ds-sm border border-ds-accent-cyan/40 bg-ds-accent-cyan/10 px-ds2 text-[10px] uppercase tracking-[0.28em] text-ds-accent-cyan">
                  Tag
                </span>
              }
            />
          ))}
        </Group>
      )}
      {merged.countries.length > 0 && (
        <Group label="Countries">
          {merged.countries.map((r) => (
            <Row
              key={r.iso}
              href={r.href}
              onPick={onPick}
              primary={r.name}
              secondary={r.iso}
              hint="Country"
              icon={
                <span aria-hidden className="text-[18px]">
                  {flagEmoji(r.iso)}
                </span>
              }
            />
          ))}
        </Group>
      )}
      {merged.wallets.length > 0 && (
        <Group label="Wallets">
          {merged.wallets.map((r) => (
            <Row
              key={r.address}
              href={r.href}
              onPick={onPick}
              primary={`${r.address.slice(0, 8)}…${r.address.slice(-6)}`}
              secondary={r.chain}
              hint="Wallet"
              icon={
                <span className="flex h-8 w-8 items-center justify-center rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi text-[10px] uppercase text-ds-text-tertiary">
                  {r.chain === 'solana' ? 'S' : '⬢'}
                </span>
              }
            />
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={label}>
      <h3 className="px-ds4 pt-ds3 pb-ds2 font-ds-mono text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
        {label}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

function Row({
  href,
  onPick,
  primary,
  secondary,
  hint,
  icon,
}: {
  href: string;
  onPick: () => void;
  primary: string;
  secondary: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onPick}
        className="flex min-h-11 items-center gap-ds3 px-ds4 py-ds2 font-ds-mono active:bg-ds-bg-surface"
      >
        {icon}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] text-ds-text-primary">
            {primary}
          </span>
          <span className="truncate text-[11px] text-ds-text-secondary">
            {secondary}
          </span>
        </div>
        <span className="shrink-0 text-[9px] uppercase tracking-[0.32em] text-ds-text-tertiary">
          {hint}
        </span>
      </Link>
    </li>
  );
}

function Hint() {
  return (
    <div className="px-ds5 py-ds6 font-ds-mono text-[12px] leading-relaxed text-ds-text-secondary">
      Try a ticker (<span className="text-ds-text-primary">PEPE</span>), a
      narrative (<span className="text-ds-text-primary">Frog memes</span>),
      a country code (<span className="text-ds-text-primary">JP</span>), or
      paste an address.
    </div>
  );
}

function NoResults() {
  return (
    <div className="px-ds5 py-ds11 text-center font-ds-mono text-[12px] uppercase tracking-[0.32em] text-ds-text-secondary">
      No matches. Try a ticker, narrative, or country.
    </div>
  );
}
