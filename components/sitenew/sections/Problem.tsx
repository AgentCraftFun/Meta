'use client';

import CountUp from '../CountUp';
import Decode from '../Decode';
import FadeUp from '../FadeUp';
import Scanline from '../Scanline';
import SectionLabel from '../SectionLabel';
import Shimmer from '../Shimmer';

const TABS = [
  { name: 'Twitter / X', status: 'narrative' },
  { name: 'Dexscreener', status: 'liquidity' },
  { name: 'Pump.fun', status: 'launches' },
  { name: 'Photon', status: 'execution' },
  { name: 'Telegram Bots', status: 'signals' },
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
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">
      <Scanline />

      <div className="relative mx-auto max-w-[1240px]">
        {/* Entire section lives in the LEFT column so the travelling globe disc
            (slot ~74% / 47%) owns the right negative space. The stats are folded
            into this column as a vertical ledger — no standalone box row. */}
        <div className="md:max-w-[620px]">
          <FadeUp>
            <SectionLabel index="01" label="The Problem" />
          </FadeUp>

          <Decode>
            <h2 className="mt-8 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[64px]">
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
            <p className="mt-6 text-[20px] leading-snug text-slate-400 md:text-[22px]">
              And traders are flying blind across five tabs.
            </p>
          </FadeUp>

          {/* Tab cluster — each in a tactical frame */}
          <FadeUp delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-3">
              {TABS.map((tab) => (
                <div key={tab.name} className="group relative">
                  {/* corner brackets snap inward on hover (0.2s powerOut) */}
                  {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                    <span
                      key={corner}
                      aria-hidden
                      className={[
                        'pointer-events-none absolute z-10 h-2 w-2 border-cyan-300/70 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
                        corner === 'tl' && '-left-1 -top-1 border-l border-t group-hover:translate-x-1 group-hover:translate-y-1',
                        corner === 'tr' && '-right-1 -top-1 border-r border-t group-hover:-translate-x-1 group-hover:translate-y-1',
                        corner === 'bl' && '-bottom-1 -left-1 border-b border-l group-hover:translate-x-1 group-hover:-translate-y-1',
                        corner === 'br' && '-bottom-1 -right-1 border-b border-r group-hover:-translate-x-1 group-hover:-translate-y-1',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                  <div className="flex items-center gap-3 bg-[#0B1220]/80 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.28em] text-slate-300 backdrop-blur-sm transition-colors duration-200 group-hover:text-slate-100">
                    <span className="h-1 w-1 rounded-full bg-slate-500 transition-colors group-hover:bg-cyan-300" />
                    {tab.name}
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{tab.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Stat ledger — the old 5+/30s/$0 trio, folded into the left column as
              a tight number-led list. Top hairline ties it to the section. */}
          <div className="mt-12 border-t border-[#1E293B]/70">
            {STATS.map((stat, i) => (
              <FadeUp key={stat.label} delay={0.4 + i * 0.1}>
                <div className="grid grid-cols-[96px_1fr] items-baseline gap-5 border-b border-[#1E293B]/70 py-6 md:grid-cols-[124px_1fr] md:gap-7">
                  <CountUp
                    value={stat.target}
                    duration={1.0}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="font-display text-[48px] font-bold leading-none tracking-[-0.03em] text-white md:text-[60px]"
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
