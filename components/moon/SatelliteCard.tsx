'use client';

import { formatPercent, formatUsd } from '@/lib/format';
import type { HeatLevel, Token } from '@/lib/types/token';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

/**
 * Compact floating chip rendered in screen space at the satellite's
 * projected position. Symbol + price + 24h change. The change colour
 * is the heat tier, not the +/- direction, so it visually echoes the
 * satellite's glow.
 */
export default function SatelliteCard({ token }: { token: Token }) {
  const color = HEAT_HEX[token.category];
  const up = token.priceChange24h >= 0;
  return (
    <div
      className="pointer-events-none flex w-[160px] flex-col gap-1 rounded-sm border bg-black/65 px-3 py-2 font-mono backdrop-blur-md"
      style={{
        borderColor: `${color}66`,
        boxShadow: `0 0 14px ${color}33`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-white">
          {token.symbol}
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <span className="truncate text-[9px] uppercase tracking-[0.25em] text-white/45">
        {token.name}
      </span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-[12px] tabular-nums text-white/95">
          {formatUsd(token.priceUsd)}
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
