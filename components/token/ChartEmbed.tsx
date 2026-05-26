'use client';

import type { Token } from '@/lib/types/token';

/** DexScreener iframe-embed slugs per chain. Anything outside this
 *  map falls back to "no chart" empty state. */
const CHAIN_SLUG: Partial<Record<Token['chain'], string>> = {
  solana: 'solana',
  ethereum: 'ethereum',
  base: 'base',
  bsc: 'bsc',
};

type Props = {
  token: Token;
};

/**
 * Embeds the official DexScreener pair chart via the documented
 * iframe URL: https://dexscreener.com/<chain>/<pair>?embed=1&theme=dark&info=0&trades=0
 *
 * Their chrome (nav, info side panel, trades feed) is stripped via
 * the supported query flags so the iframe shows just the candlestick
 * chart on our dark surface.
 *
 * Fixed 560px height. Pair address comes from the token's canonical
 * pair (max-liquidity DEX) selected during ingest; if the token has
 * no pair (e.g. mock seed) we show the empty state.
 */
export default function ChartEmbed({ token }: Props) {
  const slug = CHAIN_SLUG[token.chain];
  const pair = token.pairAddress;

  if (!slug || !pair) {
    return (
      <div
        role="figure"
        aria-label="Price chart"
        className="flex h-[560px] items-center justify-center rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface font-ds-mono"
      >
        <div className="flex flex-col items-center gap-ds3 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ds-text-tertiary">
            Chart unavailable
          </p>
          <p className="max-w-[320px] text-[12px] text-ds-text-secondary">
            DexScreener has no embeddable pair for this token on{' '}
            <span className="text-ds-text-primary">{token.chain}</span>.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://dexscreener.com/${slug}/${pair}?embed=1&theme=dark&info=0&trades=0`;

  return (
    <div
      role="figure"
      aria-label={`Price chart for ${token.symbol}`}
      className="overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface"
    >
      <iframe
        src={src}
        title={`${token.symbol} chart`}
        loading="lazy"
        style={{
          width: '100%',
          height: 560,
          border: 0,
          display: 'block',
          colorScheme: 'dark',
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}
