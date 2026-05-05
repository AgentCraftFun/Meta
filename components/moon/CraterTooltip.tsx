'use client';

import { formatPercent, formatUsd } from '@/lib/format';
import type { HeatLevel, Token } from '@/lib/types/token';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

type Props = {
  token: Token;
  /** 0..1, driven by computeActivity(). Renders the activity bar. */
  activity: number;
};

/**
 * Hover chip rendered above the active crater. Shows symbol, activity
 * bar (so the visual size of the crater has a numeric counterpart in
 * the tooltip), and 24h change.
 */
export default function CraterTooltip({ token, activity }: Props) {
  const dot = HEAT_HEX[token.category];
  const up = token.priceChange24h >= 0;
  const pct = Math.round(activity * 100);
  return (
    <div
      className="pointer-events-none flex w-[200px] -translate-y-2 flex-col gap-1.5 rounded-sm border border-cyan-400/40 bg-black/80 px-3 py-2 font-mono backdrop-blur-md"
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

      <div>
        <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.32em] text-white/35">
          <span>Activity</span>
          <span className="tabular-nums" style={{ color: dot }}>
            {pct}
          </span>
        </div>
        <div className="mt-0.5 h-[3px] w-full overflow-hidden bg-white/10">
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${pct}%`,
              background: dot,
              boxShadow: `0 0 6px ${dot}`,
            }}
          />
        </div>
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
