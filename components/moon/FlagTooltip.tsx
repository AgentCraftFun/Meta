'use client';

import { formatPercent, formatUsd } from '@/lib/format';
import type { HeatLevel, Token } from '@/lib/types/token';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

/**
 * Tiny floating chip rendered above the active flag. Heat dot + symbol +
 * name + market cap + 24h change. Stays dark glass with a 1px cyan border
 * so it reads as a tactical readout, not a marketing card.
 */
export default function FlagTooltip({ token }: { token: Token }) {
  const dot = HEAT_HEX[token.category];
  const up = token.priceChange24h >= 0;
  return (
    <div
      className="pointer-events-none flex w-[180px] -translate-y-2 flex-col gap-1 rounded-sm border border-cyan-400/40 bg-black/80 px-3 py-2 font-mono backdrop-blur-md"
      style={{ boxShadow: '0 0 14px rgba(34,211,238,0.25)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot, boxShadow: `0 0 8px ${dot}` }}
        />
        <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white">
          {token.symbol}
        </span>
        <span className="ml-auto truncate text-[9px] uppercase tracking-[0.25em] text-white/45">
          {token.name}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] tabular-nums text-white/85">
          {formatUsd(token.marketCap)}
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: up ? '#86efac' : '#fda4af' }}
        >
          {up ? '▲' : '▼'} {formatPercent(token.priceChange24h, 1)}
        </span>
      </div>
    </div>
  );
}
