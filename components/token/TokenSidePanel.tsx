'use client';

import Delta from '@/components/primitives/Delta';
import { formatUsd } from '@/lib/format';
import type { Token } from '@/lib/types/token';

const PRICE_CHANGE_MAGNITUDE_CAP = 50;

const CHAIN_TRADE: Record<
  Token['chain'],
  { dex: string; href: (t: Token) => string } | null
> = {
  solana: {
    dex: 'Jupiter',
    href: (t) =>
      `https://jup.ag/swap/SOL-${encodeURIComponent(t.contractAddress ?? t.symbol)}`,
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
  other: null,
};

type Props = {
  token: Token;
};

/**
 * 360px right column. Price-change block, buys/sells block, social
 * links, and the primary Trade-on-DEX CTA at the bottom. The CTA
 * targets the canonical DEX for the token's chain and pre-fills the
 * swap with the token's contract.
 */
export default function TokenSidePanel({ token }: Props) {
  const trade = CHAIN_TRADE[token.chain];

  return (
    <aside
      aria-label="Token detail panel"
      className="flex w-[360px] shrink-0 flex-col gap-ds5 rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5 font-ds-mono"
    >
      <PriceChangeBlock token={token} />
      <FlowBlock token={token} />
      <SocialBlock token={token} />

      {trade && token.contractAddress ? (
        <a
          href={trade.href(token)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex h-12 items-center justify-center gap-ds2 rounded-ds-sm bg-ds-accent-cyan/15 text-[12px] uppercase tracking-[0.36em] text-ds-accent-cyan transition-colors duration-ds-fast ease-ds-standard hover:bg-ds-accent-cyan/25"
        >
          <span>Trade on {trade.dex}</span>
          <ArrowIcon />
        </a>
      ) : (
        <span className="mt-auto inline-flex h-12 items-center justify-center rounded-ds-sm border border-ds-border-strong text-[11px] uppercase tracking-[0.32em] text-ds-text-tertiary">
          DEX not available
        </span>
      )}
    </aside>
  );
}

// ─── Sub-blocks ───────────────────────────────────────────────────────

function PriceChangeBlock({ token }: { token: Token }) {
  const rows: { label: string; value: number | undefined }[] = [
    { label: '5m', value: token.priceChange5m },
    { label: '1h', value: token.priceChange1h },
    { label: '6h', value: token.priceChange6h },
    { label: '24h', value: token.priceChange24h },
  ];

  return (
    <section aria-label="Price changes">
      <BlockHeader>Price Change</BlockHeader>
      <ul className="mt-ds2 flex flex-col gap-ds2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center gap-ds3"
          >
            <span className="w-8 text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary">
              {r.label}
            </span>
            <div
              className="relative h-[6px] flex-1 overflow-hidden rounded-ds-sm bg-ds-bg-surfaceHi"
              role="img"
              aria-label={`${r.label} change ${
                r.value === undefined ? 'unknown' : `${r.value.toFixed(2)}%`
              }`}
            >
              <ChangeBar value={r.value} />
            </div>
            <span className="w-[88px] text-right">
              {r.value === undefined ? (
                <span
                  data-numeric="true"
                  className="text-[11px] tabular-nums text-ds-text-tertiary"
                >
                  —
                </span>
              ) : (
                <Delta value={r.value} />
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChangeBar({ value }: { value: number | undefined }) {
  if (value === undefined) return null;
  const magnitude = Math.min(
    Math.abs(value) / PRICE_CHANGE_MAGNITUDE_CAP,
    1
  );
  const width = `${(magnitude * 50).toFixed(1)}%`; // half-bar from centre
  const tone = value >= 0 ? 'bg-ds-accent-bull' : 'bg-ds-accent-bear';
  // Centred bar — grows right for gains, left for losses.
  return (
    <span
      aria-hidden
      className={`absolute top-0 h-full ${tone}`}
      style={{
        width,
        left: value >= 0 ? '50%' : 'auto',
        right: value < 0 ? '50%' : 'auto',
      }}
    />
  );
}

function FlowBlock({ token }: { token: Token }) {
  const buys = token.buys24h ?? 0;
  const sells = token.sells24h ?? 0;
  const total = buys + sells;
  const buyPct = total > 0 ? (buys / total) * 100 : 50;

  return (
    <section aria-label="Order flow (24h)">
      <BlockHeader>Flow · 24h</BlockHeader>
      <div className="mt-ds2 flex items-center gap-ds3">
        <FlowSide label="Buys" count={buys} tone="bull" />
        <FlowSide label="Sells" count={sells} tone="bear" align="right" />
      </div>
      <div
        className="mt-ds3 h-[6px] overflow-hidden rounded-ds-sm bg-ds-bg-surfaceHi"
        role="img"
        aria-label={`${buyPct.toFixed(0)}% buys`}
      >
        <div
          className="h-full bg-ds-accent-bull"
          style={{ width: `${buyPct}%` }}
        />
      </div>
      <div className="mt-ds2 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-ds-text-tertiary">
        <span>Volume</span>
        <span
          data-numeric="true"
          className="tabular-nums text-ds-text-primary"
        >
          {formatUsd(token.volume24h)}
        </span>
      </div>
    </section>
  );
}

function FlowSide({
  label,
  count,
  tone,
  align = 'left',
}: {
  label: string;
  count: number;
  tone: 'bull' | 'bear';
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={[
        'flex flex-1 flex-col gap-ds1',
        align === 'right' ? 'items-end' : 'items-start',
      ].join(' ')}
    >
      <span className="text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary">
        {label}
      </span>
      <span
        data-numeric="true"
        className={[
          'text-[16px] tabular-nums leading-none',
          tone === 'bull' ? 'text-ds-accent-bull' : 'text-ds-accent-bear',
        ].join(' ')}
      >
        {count > 0 ? formatCount(count) : '—'}
      </span>
    </div>
  );
}

function SocialBlock({ token }: { token: Token }) {
  // DexScreener returns websites/socials inside pair.info, but our
  // Token type only carries imageUrl + pairUrl today. Surface the
  // pair-page link as the primary "official source" until we ingest
  // the social fields.
  const links = [
    token.pairUrl ? { label: 'DexScreener', href: token.pairUrl } : null,
    token.contractAddress && token.chain === 'solana'
      ? {
          label: 'Solscan',
          href: `https://solscan.io/token/${encodeURIComponent(token.contractAddress)}`,
        }
      : null,
    token.contractAddress && token.chain === 'ethereum'
      ? {
          label: 'Etherscan',
          href: `https://etherscan.io/token/${encodeURIComponent(token.contractAddress)}`,
        }
      : null,
    token.contractAddress && token.chain === 'base'
      ? {
          label: 'BaseScan',
          href: `https://basescan.org/token/${encodeURIComponent(token.contractAddress)}`,
        }
      : null,
    token.contractAddress && token.chain === 'bsc'
      ? {
          label: 'BscScan',
          href: `https://bscscan.com/token/${encodeURIComponent(token.contractAddress)}`,
        }
      : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <section aria-label="External links">
      <BlockHeader>Links</BlockHeader>
      {links.length === 0 ? (
        <p className="mt-ds2 text-[11px] text-ds-text-tertiary">
          No external links available.
        </p>
      ) : (
        <ul className="mt-ds2 flex flex-wrap gap-ds2">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-ds1 rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi px-ds3 text-[10px] uppercase tracking-[0.32em] text-ds-text-secondary hover:border-ds-accent-cyan/40 hover:text-ds-text-primary"
              >
                {l.label}
                <ArrowIcon small />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BlockHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
      {children}
    </h3>
  );
}

function ArrowIcon({ small }: { small?: boolean }) {
  const size = small ? 9 : 11;
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
