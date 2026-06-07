'use client';

import { motion } from 'framer-motion';
import CountUp from '../CountUp';
import Decode from '../Decode';
import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import Scanline from '../Scanline';
import SectionLabel from '../SectionLabel';
import Shimmer from '../Shimmer';
import { ease } from '../system/motion';

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

        <Decode>
          <h2 className="mt-8 max-w-[1100px] font-display text-[44px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[68px]">
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
          <p className="mt-6 max-w-[700px] text-[20px] leading-snug text-slate-400 md:text-[24px]">
            And traders are flying blind across five tabs.
          </p>
        </FadeUp>

        {/* Tab cluster — each in a tactical frame */}
        <FadeUp delay={0.3}>
          <div className="mt-14 flex flex-wrap gap-3">
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

        {/* Stat trio — animated count-ups inside framed cells */}
        <div className="mt-24 grid grid-cols-1 gap-px bg-[#1E293B]/70 md:grid-cols-3">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={0.12 * i}>
              <div className="relative h-full overflow-hidden bg-[#05080F] p-10">
                {/* Hairline divider — draws in via scaleY (desktop, cells 2+). */}
                {i > 0 && (
                  <motion.span
                    aria-hidden
                    className="absolute left-0 top-0 hidden h-full w-px origin-top bg-cyan-400/30 md:block"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.6, ease: ease.expoOut, delay: 0.12 * i }}
                  />
                )}
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
                  duration={1.0}
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
