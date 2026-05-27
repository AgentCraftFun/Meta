'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Delta from '@/components/primitives/Delta';
import Pill from '@/components/primitives/Pill';
import Sparkline from '@/components/primitives/Sparkline';
import { formatUsd } from '@/lib/format';
import { tokenHref } from '@/lib/tokenHref';
import type { Token } from '@/lib/types/token';

const CHAIN_BADGE: Record<Token['chain'], string> = {
  solana: 'SOL',
  ethereum: 'ETH',
  base: 'BASE',
  bsc: 'BSC',
  other: '—',
};

type Props = {
  token: Token;
};

/**
 * One row of the mobile Trending screen. Whole card is the tap
 * target (well over 44×44). Lays out as:
 *
 *   icon  symbol · chain                       price
 *         name (truncated)                     ▲/▼ delta
 *         [tag] [tag] +N                       sparkline
 */
export default function MobileTokenCard({ token }: Props) {
  // Synthetic sparkline from the four priceChange* fields. A real
  // intraday series ships when the indexer lands.
  const sparkData = useMemo(() => {
    const last = token.priceUsd;
    if (last <= 0) return [];
    const pts = [
      token.priceChange24h,
      token.priceChange6h ?? token.priceChange24h,
      token.priceChange1h ?? 0,
      token.priceChange5m ?? 0,
      0,
    ];
    // Reconstruct relative levels back from "now" by walking
    // backwards through the percent changes.
    let level = last;
    const series = [last];
    for (const pct of pts) {
      level = level / (1 + pct / 100);
      series.unshift(level);
    }
    return series;
  }, [token]);

  const tagSlice = token.narrativeTags.slice(0, 2);
  const extra = token.narrativeTags.length - tagSlice.length;
  const sparkColor =
    token.priceChange24h >= 0 ? '#00D982' : '#FF7088';

  return (
    <Link
      href={tokenHref(token)}
      className="flex items-center gap-ds3 border-b border-ds-border-subtle/60 bg-ds-bg-base px-ds4 py-ds3 active:bg-ds-bg-surface"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-md border border-ds-border-strong bg-ds-bg-surfaceHi text-[11px] uppercase tracking-[0.16em] text-ds-text-primary"
      >
        {token.symbol.slice(0, 3)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <div className="flex items-baseline gap-ds2">
          <span className="text-[14px] font-bold uppercase tracking-[0.14em] text-ds-text-primary">
            {token.symbol}
          </span>
          <span className="text-[9px] uppercase tracking-[0.28em] text-ds-text-tertiary">
            {CHAIN_BADGE[token.chain]}
          </span>
          <span className="truncate text-[11px] text-ds-text-secondary">
            {token.name}
          </span>
        </div>

        {tagSlice.length > 0 && (
          <div className="flex items-center gap-[6px]">
            {tagSlice.map((tag) => (
              <Pill key={tag.id} size="sm" variant="info">
                {tag.label}
              </Pill>
            ))}
            {extra > 0 && (
              <span
                data-numeric="true"
                className="text-[10px] tabular-nums text-ds-text-tertiary"
              >
                +{extra}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-[2px]">
        <span
          data-numeric="true"
          className="text-[13px] tabular-nums text-ds-text-primary"
        >
          {formatUsd(token.priceUsd)}
        </span>
        <Delta value={token.priceChange24h} />
        <Sparkline data={sparkData} width={72} height={18} color={sparkColor} />
      </div>
    </Link>
  );
}
