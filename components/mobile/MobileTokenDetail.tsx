'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import ChartEmbed from '@/components/token/ChartEmbed';
import NarrativeContextBand from '@/components/token/NarrativeContextBand';
import TransactionsPanel from '@/components/token/TransactionsPanel';
import WhyMoving from '@/components/token/WhyMoving';
import Delta from '@/components/primitives/Delta';
import PriceFlash from '@/components/primitives/PriceFlash';
import { formatUsd, shortAddress } from '@/lib/format';
import { useToastStore } from '@/lib/useToast';
import { useTokenDetail } from '@/lib/useTokenDetail';
import { useWatchlist } from '@/lib/useWatchlist';
import type { Token } from '@/lib/types/token';

const CHAIN_LABEL: Record<Token['chain'], string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  base: 'Base',
  bsc: 'BSC',
  other: 'Other',
};

const CHAIN_TRADE: Partial<Record<Token['chain'], { dex: string; href: (t: Token) => string }>> = {
  solana: {
    dex: 'Jupiter',
    href: (t) =>
      `https://jup.ag/swap/SOL-${encodeURIComponent(t.contractAddress ?? '')}`,
  },
  ethereum: {
    dex: 'Uniswap',
    href: (t) =>
      `https://app.uniswap.org/swap?outputCurrency=${encodeURIComponent(t.contractAddress ?? '')}`,
  },
  base: {
    dex: 'Aerodrome',
    href: (t) =>
      `https://aerodrome.finance/swap?outputCurrency=${encodeURIComponent(t.contractAddress ?? '')}`,
  },
  bsc: {
    dex: 'PancakeSwap',
    href: (t) =>
      `https://pancakeswap.finance/swap?outputCurrency=${encodeURIComponent(t.contractAddress ?? '')}`,
  },
};

/**
 * Stacked mobile token detail. Same components as desktop where they
 * reflow naturally (NarrativeContextBand, ChartEmbed, WhyMoving,
 * TransactionsPanel); a mobile-shaped header + 2×4 stats grid; CTA
 * pinned to the bottom safe area.
 */
export default function MobileTokenDetail() {
  const params = useParams<{ chain: string; address: string }>();
  const router = useRouter();
  const chain = decodeURIComponent(params?.chain ?? '');
  const address = decodeURIComponent(params?.address ?? '');
  const { data: token, isLoading, isError } = useTokenDetail(chain, address);
  const { starred, toggle } = useWatchlist(chain, address);
  const showToast = useToastStore((s) => s.show);

  const txns24 = token ? (token.buys24h ?? 0) + (token.sells24h ?? 0) : 0;
  const trade = token ? CHAIN_TRADE[token.chain] : undefined;

  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} copied`, { tone: 'success' }))
      .catch(() => showToast('Copy failed', { tone: 'error' }));
  };

  if (isLoading && !token) {
    return <Skeleton />;
  }
  if (isError || !token) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-ds3 px-ds5 text-center font-ds-mono">
        <p className="text-[11px] uppercase tracking-[0.36em] text-ds-text-tertiary">
          Couldn't load token
        </p>
        <p className="text-[12px] text-ds-text-secondary">
          {chain} · {shortAddress(address, 6, 6)}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-ds3 inline-flex h-11 items-center rounded-ds-sm border border-ds-border-strong px-ds4 text-[11px] uppercase tracking-[0.32em] text-ds-text-primary"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-ds-bg-base">
      <div className="flex-1 overflow-y-auto pb-[88px]">
        {/* Header row */}
        <header className="flex items-center gap-ds3 border-b border-ds-border-subtle px-ds4 py-ds3 font-ds-mono">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-11 w-11 items-center justify-center rounded-ds-sm text-ds-text-secondary active:text-ds-text-primary"
          >
            <BackIcon />
          </button>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md border border-ds-border-strong bg-ds-bg-surfaceHi text-[10px] uppercase tracking-[0.16em] text-ds-text-primary"
          >
            {token.symbol.slice(0, 3)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-baseline gap-ds2">
              <h1 className="truncate text-[16px] font-bold uppercase tracking-[0.14em] text-ds-text-primary">
                {token.symbol}
              </h1>
              <span className="text-[10px] uppercase tracking-[0.28em] text-ds-text-tertiary">
                {CHAIN_LABEL[token.chain]}
              </span>
            </div>
            {token.contractAddress && (
              <button
                type="button"
                onClick={() => copy(token.contractAddress!, 'Address')}
                className="self-start text-[10px] uppercase tracking-[0.24em] text-ds-text-tertiary active:text-ds-text-primary"
              >
                <span data-numeric="true" className="tabular-nums">
                  {shortAddress(token.contractAddress, 6, 6)}
                </span>{' '}
                · copy
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={starred}
            aria-label={starred ? 'Remove from watchlist' : 'Add to watchlist'}
            className={[
              'flex h-11 w-11 items-center justify-center rounded-ds-sm',
              starred ? 'text-ds-accent-warn' : 'text-ds-text-secondary',
            ].join(' ')}
          >
            <StarIcon filled={starred} />
          </button>
        </header>

        <NarrativeContextBand token={token} />

        {/* 2×4 stats grid */}
        <section
          aria-label="Key statistics"
          className="grid grid-cols-2 gap-px border-b border-ds-border-subtle bg-ds-border-subtle font-ds-mono"
        >
          <StatTile label="Price" value={formatUsd(token.priceUsd)} live={token.priceUsd} />
          <StatTile label="24h" value={token.priceChange24h !== undefined ? `${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%` : '—'} delta={token.priceChange24h} />
          <StatTile label="MCap" value={formatUsd(token.marketCap)} />
          <StatTile
            label="Liquidity"
            value={token.liquidityUsd ? formatUsd(token.liquidityUsd) : '—'}
          />
          <StatTile label="24h Volume" value={formatUsd(token.volume24h)} />
          <StatTile label="FDV" value={token.fdv ? formatUsd(token.fdv) : '—'} />
          <StatTile label="24h Txns" value={txns24 > 0 ? formatCount(txns24) : '—'} />
          <StatTile label="Age" value={token.age ? formatHrs(token.age) : '—'} />
        </section>

        {/* Chart */}
        <section
          aria-label="Price chart"
          className="border-b border-ds-border-subtle bg-ds-bg-surface"
        >
          <ChartEmbed token={token} />
        </section>

        {/* AI explanation */}
        <section className="px-ds4 py-ds4">
          <WhyMoving token={token} chain={chain} address={address} />
        </section>

        {/* Transactions only — top traders / holders / LPs hide on mobile */}
        <section className="px-ds4 pb-ds5">
          <TransactionsPanel token={token} />
        </section>
      </div>

      {/* Pinned bottom CTA */}
      {trade && token.contractAddress ? (
        <a
          href={trade.href(token)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-16 left-0 right-0 z-30 mx-ds4 flex h-12 items-center justify-center gap-ds2 rounded-ds-md bg-ds-accent-cyan/20 font-ds-mono text-[12px] uppercase tracking-[0.36em] text-ds-accent-cyan shadow-[0_-12px_30px_-10px_rgba(0,0,0,0.7)] active:bg-ds-accent-cyan/30"
        >
          Trade on {trade.dex} ↗
        </a>
      ) : (
        <span className="fixed bottom-16 left-0 right-0 z-30 mx-ds4 flex h-12 items-center justify-center rounded-ds-md border border-ds-border-strong bg-ds-bg-surface font-ds-mono text-[11px] uppercase tracking-[0.32em] text-ds-text-tertiary">
          Trading not supported for this chain yet
        </span>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
  live,
}: {
  label: string;
  value: string;
  delta?: number;
  live?: number;
}) {
  return (
    <div className="flex flex-col gap-[2px] bg-ds-bg-base px-ds3 py-ds3">
      <span className="text-[9px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        {label}
      </span>
      {delta !== undefined ? (
        <Delta value={delta} />
      ) : live !== undefined ? (
        <PriceFlash value={live}>
          <span
            data-numeric="true"
            className="text-[15px] tabular-nums text-ds-text-primary"
          >
            {value}
          </span>
        </PriceFlash>
      ) : (
        <span
          data-numeric="true"
          className="text-[15px] tabular-nums text-ds-text-primary"
        >
          {value}
        </span>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div aria-busy className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-ds3 border-b border-ds-border-subtle px-ds4">
        <div className="h-9 w-9 animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
        <div className="flex flex-1 flex-col gap-ds2">
          <div className="h-3 w-24 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          <div className="h-2 w-32 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
        </div>
      </div>
      <div className="h-[72px] border-b border-ds-border-subtle bg-ds-bg-surface/40" />
      <div className="grid grid-cols-2 gap-px border-b border-ds-border-subtle bg-ds-border-subtle">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-16 flex-col gap-ds2 bg-ds-bg-base px-ds3 py-ds3">
            <div className="h-2 w-12 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
            <div className="h-3 w-16 animate-ds-pulse rounded-ds-sm bg-ds-bg-surfaceHi" />
          </div>
        ))}
      </div>
      <div className="m-ds4 h-[300px] animate-ds-pulse rounded-ds-md bg-ds-bg-surfaceHi" />
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function formatHrs(h: number): string {
  if (h < 1) return `${(h * 60).toFixed(0)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(0)}d`;
}
