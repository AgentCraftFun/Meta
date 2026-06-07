'use client';

import CountUp from '../CountUp';
import Decode from '../Decode';
import FadeUp from '../FadeUp';
import Scanline from '../Scanline';
import SectionLabel from '../SectionLabel';
import Shimmer from '../Shimmer';

// The five tools, reduced to a single recognizable logo strip (was a 3-row
// cluster of framed boxes that pushed the stats below the fold).
const SOURCES = [
  { name: 'Twitter / X', Icon: XIcon },
  { name: 'Dexscreener', Icon: DexIcon },
  { name: 'Pump.fun', Icon: PumpIcon },
  { name: 'Photon', Icon: PhotonIcon },
  { name: 'Telegram', Icon: TelegramIcon },
];

const STATS = [
  {
    target: 5,
    suffix: '+',
    label: 'Tabs Open / Trade',
    desc: 'Traders juggle a flotilla of half-loaded sites looking for the next move.',
  },
  {
    target: 30,
    suffix: 's',
    label: 'To Miss A Narrative',
    desc: 'Stories pump and fade before most people know they exist.',
  },
  {
    target: 0,
    prefix: '$',
    label: 'Tools Built For This',
    desc: 'No product on the market connects geographic attention to on-chain capital.',
  },
];

export default function Problem() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[120px] md:px-10">
      <Scanline />

      <div className="relative mx-auto max-w-[1240px]">
        {/* Entire section lives in the LEFT column so the travelling globe disc
            (slot ~74% / 47%) owns the right negative space. */}
        <div className="md:max-w-[640px]">
          <FadeUp>
            <SectionLabel index="01" label="The Problem" />
          </FadeUp>

          <Decode>
            <h2 className="mt-7 font-display text-[42px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[58px]">
              Memecoin trading is{' '}
              <span className="relative inline-block">
                <Shimmer>attention arbitrage</Shimmer>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
                  }}
                />
              </span>
              .
            </h2>
          </Decode>

          <FadeUp delay={0.2}>
            <p className="mt-5 text-[19px] leading-snug text-slate-400 md:text-[22px]">
              And traders are flying blind across five tabs.
            </p>
          </FadeUp>

          {/* Source strip — one clean line of logos (replaces the framed boxes). */}
          <FadeUp delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              {SOURCES.map((s) => (
                <span
                  key={s.name}
                  className="flex items-center gap-2.5 text-slate-400 transition-colors duration-200 hover:text-cyan-300"
                >
                  <s.Icon />
                  <span className="font-mono text-[12px] uppercase tracking-[0.16em]">
                    {s.name}
                  </span>
                </span>
              ))}
            </div>
          </FadeUp>

          {/* Stat ledger — number-led list folded into the left column. */}
          <div className="mt-9 border-t border-[#1E293B]/70">
            {STATS.map((stat, i) => (
              <FadeUp key={stat.label} delay={0.4 + i * 0.08}>
                <div className="grid grid-cols-[88px_1fr] items-baseline gap-5 border-b border-[#1E293B]/70 py-5 md:grid-cols-[116px_1fr] md:gap-7">
                  <CountUp
                    value={stat.target}
                    duration={1.0}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-white md:text-[54px]"
                  />
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] uppercase tracking-[0.36em] text-cyan-300">
                        {stat.label}
                      </span>
                      <span
                        aria-hidden
                        className="font-mono text-[10px] tracking-[0.4em] text-cyan-400/40"
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Source logos (monochrome, currentColor) ---- */

function XIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DexIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d="M7 3v3.5M7 15v6" />
      <rect x="5" y="6.5" width="4" height="8.5" rx="0.5" />
      <path d="M17 3v6M17 17.5v3.5" />
      <rect x="15" y="9" width="4" height="8.5" rx="0.5" />
    </svg>
  );
}

function PumpIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <g transform="rotate(45 12 12)">
        <rect x="2.5" y="9" width="19" height="6" rx="3" />
        <line x1="12" y1="9" x2="12" y2="15" />
      </g>
    </svg>
  );
}

function PhotonIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.7 6.6L20 10l-5.5 3.3L12 22l-2.5-8.7L4 10l6.3-1.4z" />
    </svg>
  );
}
