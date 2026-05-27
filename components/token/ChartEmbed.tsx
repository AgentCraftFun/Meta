'use client';

import { useEffect, useRef, useState } from 'react';
import Delta from '@/components/primitives/Delta';
import { formatUsd } from '@/lib/format';
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

  return <ChartFrame token={token} slug={slug} pair={pair} />;
}

/** Iframe wrapper that swaps to the API-data fallback panel if the
 *  embed never reports load (e.g. ad-blocker, CSP, DexScreener down).
 *  We give the embed 6 seconds; that's well above the usual 1–2s
 *  warm-CDN handshake. */
function ChartFrame({
  token,
  slug,
  pair,
}: {
  token: Token;
  slug: string;
  pair: string;
}) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      if (!loaded) setErrored(true);
    }, 6_000);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [loaded]);

  if (errored) return <FallbackPanel token={token} />;

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
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
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

/** Direct-data fallback shown when the DexScreener iframe doesn't
 *  paint. Renders the same price + change KPIs the chart's header
 *  bar normally shows, plus a deep link to the DexScreener pair
 *  page so the user can open it in a new tab as a manual fallback. */
function FallbackPanel({ token }: { token: Token }) {
  return (
    <div
      role="figure"
      aria-label={`Price summary for ${token.symbol} — chart unavailable`}
      className="flex h-[560px] flex-col gap-ds5 rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds6 font-ds-mono"
    >
      <div className="flex items-center gap-ds3">
        <span className="text-[11px] uppercase tracking-[0.4em] text-ds-accent-warn">
          Chart unavailable
        </span>
        <span className="text-[11px] text-ds-text-secondary">
          DexScreener embed didn't load. Showing direct snapshot.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-ds5">
        <Stat label="Price" value={formatUsd(token.priceUsd)} />
        <Stat label="24h Volume" value={formatUsd(token.volume24h)} />
        <Stat
          label="Market Cap"
          value={formatUsd(token.marketCap)}
        />
        <Stat
          label="Liquidity"
          value={token.liquidityUsd ? formatUsd(token.liquidityUsd) : '—'}
        />
      </div>
      <div className="grid grid-cols-4 gap-ds3">
        <DeltaStat label="5m" value={token.priceChange5m} />
        <DeltaStat label="1h" value={token.priceChange1h} />
        <DeltaStat label="6h" value={token.priceChange6h} />
        <DeltaStat label="24h" value={token.priceChange24h} />
      </div>
      {token.pairUrl && (
        <a
          href={token.pairUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex h-10 items-center justify-center rounded-ds-sm border border-ds-border-strong text-[11px] uppercase tracking-[0.32em] text-ds-text-primary hover:border-ds-accent-cyan/60 hover:text-ds-accent-cyan"
        >
          Open on DexScreener ↗
        </a>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-ds2">
      <span className="text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
        {label}
      </span>
      <span
        data-numeric="true"
        className="text-[20px] tabular-nums text-ds-text-primary"
      >
        {value}
      </span>
    </div>
  );
}

function DeltaStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col gap-ds1 rounded-ds-sm border border-ds-border-subtle bg-ds-bg-surfaceHi px-ds3 py-ds2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary">
        {label}
      </span>
      {value === undefined ? (
        <span
          data-numeric="true"
          className="text-[12px] tabular-nums text-ds-text-tertiary"
        >
          —
        </span>
      ) : (
        <Delta value={value} />
      )}
    </div>
  );
}
