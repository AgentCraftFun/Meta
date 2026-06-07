'use client';

import CountUp from '../CountUp';
import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import Scanline from '../Scanline';
import SectionLabel from '../SectionLabel';
import TacticalFrame from '../TacticalFrame';

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
    <section className="relative w-full overflow-hidden bg-[#05080F]/75 px-6 py-[140px] md:px-10">
      <GridBackdrop step={72} color="rgba(34, 211, 238, 0.05)" />
      <Scanline />

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="01" label="The Problem" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 max-w-[1100px] font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[68px]">
            Memecoin trading is{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                attention arbitrage
              </span>
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
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-6 max-w-[700px] text-[20px] leading-snug text-slate-400 md:text-[24px]">
            And traders are flying blind across five tabs.
          </p>
        </FadeUp>

        {/* Tab cluster — each in a tactical frame */}
        <FadeUp delay={0.3}>
          <div className="mt-14 flex flex-wrap gap-3">
            {TABS.map((tab) => (
              <TacticalFrame
                key={tab.name}
                color="rgba(148, 163, 184, 0.35)"
                size={8}
              >
                <div className="flex items-center gap-3 bg-[#0B1220]/80 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.28em] text-slate-300 backdrop-blur-sm">
                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                  {tab.name}
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">{tab.status}</span>
                </div>
              </TacticalFrame>
            ))}
          </div>
        </FadeUp>

        {/* Stat trio — animated count-ups inside framed cells */}
        <div className="mt-24 grid grid-cols-1 gap-px bg-[#1E293B]/70 md:grid-cols-3">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={0.1 * i}>
              <div className="relative h-full overflow-hidden bg-[#05080F] p-10">
                {/* Grid corner decoration */}
                <span
                  aria-hidden
                  className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-400/40"
                >
                  0{i + 1}
                </span>
                <span
                  aria-hidden
                  className="absolute right-6 top-12 h-3 w-3 border-r border-t border-cyan-400/40"
                />

                <CountUp
                  value={stat.target}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className="font-display text-[64px] font-bold leading-none tracking-[-0.03em] text-white md:text-[88px]"
                />
                <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300">
                  {stat.label}
                </div>
                <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-slate-400">
                  {stat.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
