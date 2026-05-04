'use client';

import { flagEmoji } from '@/lib/flags';
import type { Narrative } from '@/lib/types';

type Props = {
  iso: string;
  name: string;
  narrative: Narrative;
  colorHex: string;
  totalForCountry: number;
};

export default function MarkerCard({
  iso,
  name,
  narrative,
  colorHex,
  totalForCountry,
}: Props) {
  const flag = flagEmoji(iso);
  const sentimentPct = Math.round(((narrative.sentiment + 1) / 2) * 100);
  const momentumPct = Math.round(narrative.momentum * 100);
  const momentumUp = narrative.momentum >= 0;

  return (
    <div
      className="pointer-events-none relative font-mono text-white"
      style={{
        // Tether origin at the pin head.
        transform: 'translate(0, -50%)',
        // Card lives to the right of the pin.
        marginLeft: 4,
      }}
    >
      {/* Tether line */}
      <svg
        width={36}
        height={2}
        className="absolute left-0 top-1/2 -translate-y-1/2"
        style={{ overflow: 'visible' }}
      >
        <line
          x1={0}
          y1={1}
          x2={36}
          y2={1}
          stroke={colorHex}
          strokeOpacity={0.85}
          strokeWidth={1}
        />
      </svg>

      {/* Card body */}
      <div
        className="ml-10 w-[260px] rounded-sm border bg-black/65 px-3 py-2 backdrop-blur-md"
        style={{
          borderColor: `${colorHex}66`,
          boxShadow: `0 0 12px ${colorHex}33`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] leading-none">{flag}</span>
          <span className="truncate text-[10px] uppercase tracking-[0.25em] text-white/55">
            {name}
          </span>
          <span className="ml-auto text-[9px] tracking-widest text-white/40">
            #{narrative.rank} · {totalForCountry}
          </span>
        </div>

        <p
          className="mt-1.5 text-[12px] leading-snug text-white/95"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {narrative.title}
        </p>

        {/* Volume bar */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[8px] tracking-widest text-white/40">VOL</span>
          <div className="h-[3px] flex-1 overflow-hidden bg-white/10">
            <div
              className="h-full"
              style={{
                width: `${narrative.volume}%`,
                background: colorHex,
                boxShadow: `0 0 6px ${colorHex}`,
              }}
            />
          </div>
          <span className="w-6 text-right text-[9px] tabular-nums text-white/70">
            {narrative.volume}
          </span>
        </div>

        {/* Bottom row: sentiment + momentum */}
        <div className="mt-1.5 flex items-center justify-between text-[9px] tracking-wider">
          <span className="text-white/45">
            SENT{' '}
            <span
              className={
                narrative.sentiment > 0.05
                  ? 'text-emerald-300/90'
                  : narrative.sentiment < -0.05
                    ? 'text-rose-300/90'
                    : 'text-white/70'
              }
            >
              {sentimentPct}
            </span>
          </span>
          <span
            className={`rounded-sm border px-1.5 py-0.5 ${
              momentumUp
                ? 'border-emerald-400/30 text-emerald-300/90'
                : 'border-rose-400/30 text-rose-300/90'
            }`}
          >
            {momentumUp ? '▲' : '▼'} {Math.abs(momentumPct)}%
          </span>
        </div>
      </div>
    </div>
  );
}
