'use client';

import { useState } from 'react';
import Delta from '@/components/primitives/Delta';
import { formatUsd } from '@/lib/format';
import type { Token } from '@/lib/types/token';

type TabId = 'transactions' | 'traders' | 'holders' | 'lps';

const TABS: { id: TabId; label: string; live: boolean }[] = [
  { id: 'transactions', label: 'Transactions', live: true },
  { id: 'traders', label: 'Top Traders', live: false },
  { id: 'holders', label: 'Holders', live: false },
  { id: 'lps', label: 'LPs', live: false },
];

type Props = {
  token: Token;
};

/**
 * Tabbed panel below the chart. Transactions tab ships first — built
 * from the aggregated DexScreener counts we already have (buys / sells
 * per 5m / 1h / 6h / 24h bucket). Per-transaction rows arrive when we
 * ingest the WebSocket feed.
 *
 * Other tabs (Top Traders / Holders / LPs) are stubbed so the
 * navigation is real but the surface is honest about what's not built.
 */
export default function TransactionsPanel({ token }: Props) {
  const [active, setActive] = useState<TabId>('transactions');

  return (
    <section
      aria-label="Trade activity"
      className="rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface font-ds-mono"
    >
      <div
        role="tablist"
        aria-label="Activity panels"
        className="flex items-center gap-ds1 border-b border-ds-border-subtle px-ds4"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={[
              'flex h-10 items-center gap-ds2 px-ds3 text-[11px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
              active === t.id
                ? 'border-b-2 border-ds-accent-cyan text-ds-accent-cyan -mb-px'
                : 'border-b-2 border-transparent text-ds-text-secondary hover:text-ds-text-primary',
            ].join(' ')}
          >
            {t.label}
            {!t.live && (
              <span className="rounded-ds-sm border border-ds-border-strong px-ds1 text-[8px] tracking-[0.32em] text-ds-text-tertiary">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-ds5">
        {active === 'transactions' && <TransactionsTab token={token} />}
        {active !== 'transactions' && (
          <ComingSoon label={TABS.find((t) => t.id === active)?.label ?? ''} />
        )}
      </div>
    </section>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────

function TransactionsTab({ token }: { token: Token }) {
  const rows: { window: string; buys: number; sells: number; pct: number }[] = [
    {
      window: '5m',
      buys: 0,
      sells: 0,
      pct: token.priceChange5m ?? 0,
    },
    {
      window: '1h',
      buys: token.buys1h ?? 0,
      sells: token.sells1h ?? 0,
      pct: token.priceChange1h ?? 0,
    },
    {
      window: '6h',
      buys: 0,
      sells: 0,
      pct: token.priceChange6h ?? 0,
    },
    {
      window: '24h',
      buys: token.buys24h ?? 0,
      sells: token.sells24h ?? 0,
      pct: token.priceChange24h,
    },
  ];

  return (
    <div role="grid" aria-label="Aggregated transaction counts" className="flex flex-col gap-ds2">
      <Header />
      {rows.map((r) => {
        const total = r.buys + r.sells;
        const buyPct = total > 0 ? (r.buys / total) * 100 : 50;
        return (
          <div
            key={r.window}
            role="row"
            className="grid grid-cols-[64px_repeat(4,1fr)_140px] items-center gap-ds3 border-b border-ds-border-subtle/40 py-ds2 last:border-b-0"
          >
            <span className="text-[11px] uppercase tracking-[0.32em] text-ds-text-tertiary">
              {r.window}
            </span>
            <span data-numeric="true" className="text-[12px] tabular-nums text-ds-accent-bull">
              {r.buys > 0 ? formatCount(r.buys) : '—'}
            </span>
            <span data-numeric="true" className="text-[12px] tabular-nums text-ds-accent-bear">
              {r.sells > 0 ? formatCount(r.sells) : '—'}
            </span>
            <span data-numeric="true" className="text-[12px] tabular-nums text-ds-text-primary">
              {total > 0 ? formatCount(total) : '—'}
            </span>
            <div
              className="h-[6px] overflow-hidden rounded-ds-sm bg-ds-bg-base"
              role="img"
              aria-label={`${buyPct.toFixed(0)}% buys`}
            >
              <div
                className="h-full bg-ds-accent-bull"
                style={{ width: `${buyPct}%` }}
              />
            </div>
            <div className="text-right">
              <Delta value={r.pct} />
            </div>
          </div>
        );
      })}
      <p className="mt-ds3 text-[10px] uppercase tracking-[0.28em] text-ds-text-tertiary">
        Per-transaction stream lands in the next sprint. Aggregates above are sourced from
        DexScreener’s pair snapshot ({formatUsd(token.volume24h)} 24h vol).
      </p>
    </div>
  );
}

function Header() {
  const cols = ['Window', 'Buys', 'Sells', 'Total', 'Flow', 'Change'];
  return (
    <div
      role="row"
      className="grid grid-cols-[64px_repeat(4,1fr)_140px] gap-ds3 border-b border-ds-border-strong pb-ds2 text-[9px] uppercase tracking-[0.36em] text-ds-text-tertiary"
    >
      {cols.map((c, i) => (
        <span
          key={c}
          className={i >= 1 && i <= 3 ? 'text-left' : i === 4 ? '' : i === 5 ? 'text-right' : ''}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-ds2 text-center">
      <p className="text-[11px] uppercase tracking-[0.32em] text-ds-text-secondary">
        {label}
      </p>
      <p className="max-w-[420px] text-[12px] text-ds-text-tertiary">
        Surface ships once the on-chain indexer lands. Tab kept routable so deep
        links survive the rollout.
      </p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
