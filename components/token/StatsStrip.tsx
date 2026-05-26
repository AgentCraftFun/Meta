'use client';

import Delta from '@/components/primitives/Delta';
import { formatUsd } from '@/lib/format';
import type { Token } from '@/lib/types/token';

type Props = {
  token: Token;
};

/** 88px strip of 8 stat tiles. Equal width, hairline separators.
 *  Numeric cells respect the global `[data-numeric]` rule for
 *  tabular alignment. */
export default function StatsStrip({ token }: Props) {
  const txns24 = (token.buys24h ?? 0) + (token.sells24h ?? 0);
  const priceNative = token.priceUsd > 0 ? token.priceUsd / approxNative(token) : null;

  return (
    <section
      aria-label="Token statistics"
      className="grid h-[88px] shrink-0 grid-cols-8 border-b border-ds-border-subtle bg-ds-bg-base font-ds-mono"
    >
      <Tile label="Price USD" value={formatUsd(token.priceUsd)} />
      <Tile
        label={`Price ${token.chain === 'solana' ? 'SOL' : token.chain === 'ethereum' || token.chain === 'base' ? 'ETH' : 'NATIVE'}`}
        value={priceNative !== null ? priceNative.toFixed(8) : '—'}
        muted
      />
      <Tile
        label="Liquidity"
        value={token.liquidityUsd ? formatUsd(token.liquidityUsd) : '—'}
      />
      <Tile label="FDV" value={token.fdv ? formatUsd(token.fdv) : '—'} />
      <Tile label="MCap" value={formatUsd(token.marketCap)} />
      <Tile
        label="24h Volume"
        value={formatUsd(token.volume24h)}
        below={<Delta value={token.priceChange24h} />}
      />
      <Tile
        label="24h Txns"
        value={txns24 > 0 ? formatCount(txns24) : '—'}
        below={
          token.buys24h !== undefined && token.sells24h !== undefined ? (
            <span className="text-[10px] tabular-nums text-ds-text-tertiary">
              <span className="text-ds-accent-bull">{formatCount(token.buys24h)}</span>
              {' / '}
              <span className="text-ds-accent-bear">{formatCount(token.sells24h)}</span>
            </span>
          ) : null
        }
      />
      <Tile label="Holders" value="—" muted />
    </section>
  );
}

function Tile({
  label,
  value,
  below,
  muted,
}: {
  label: string;
  value: string;
  below?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center gap-ds1 border-r border-ds-border-subtle px-ds4 last:border-r-0">
      <span className="text-[10px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        {label}
      </span>
      <span
        data-numeric="true"
        className={[
          'text-[16px] tabular-nums leading-none',
          muted ? 'text-ds-text-secondary' : 'text-ds-text-primary',
        ].join(' ')}
        title={value}
      >
        {value}
      </span>
      {below && <div>{below}</div>}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

/** Rough native-price denominator — DexScreener returns priceUsd /
 *  priceNative separately; we only carry priceUsd in our Token type
 *  so we approximate against the chain's wrapped reference. Good
 *  enough for the muted secondary tile; the chart embed is the source
 *  of truth for actual native quotes. */
function approxNative(token: Token): number {
  switch (token.chain) {
    case 'ethereum':
    case 'base':
      return 3500; // ~ETH USD
    case 'solana':
      return 170; // ~SOL USD
    case 'bsc':
      return 580; // ~BNB USD
    default:
      return 1;
  }
}
