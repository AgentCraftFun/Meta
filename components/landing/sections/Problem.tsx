'use client';

import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

const TABS = ['Twitter / X', 'Dexscreener', 'Pump.fun', 'Photon', 'Telegram Bots'];

const STATS = [
  {
    value: '5+',
    label: 'Tabs Open / Trade',
    desc: 'Traders juggle a flotilla of half-loaded sites looking for the next move.',
  },
  {
    value: '30s',
    label: 'To Miss A Narrative',
    desc: "Stories pump and fade before most people know they exist.",
  },
  {
    value: '$0',
    label: 'Tools Built For This',
    desc: 'No product on the market connects geographic attention to on-chain capital.',
  },
];

export default function Problem() {
  return (
    <section className="relative w-full bg-[#05080F] px-6 py-[120px] md:px-10">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="01" label="The Problem" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 max-w-[1100px] font-sans text-[40px] font-black leading-[1.05] tracking-[-0.02em] text-white md:text-[56px]">
            Memecoin trading is attention arbitrage.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-5 max-w-[700px] text-[20px] leading-snug text-slate-400 md:text-[24px]">
            And traders are flying blind across five tabs.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-12 flex flex-wrap gap-3">
            {TABS.map((tab) => (
              <span
                key={tab}
                className="border border-[#1E293B] bg-[#0B1220] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.28em] text-slate-400"
              >
                {tab}
              </span>
            ))}
          </div>
        </FadeUp>

        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={0.1 * i}>
              <div className="flex flex-col gap-3">
                <span className="font-sans text-[56px] font-black leading-none tracking-[-0.02em] text-white md:text-[64px]">
                  {stat.value}
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.32em] text-cyan-400">
                  {stat.label}
                </span>
                <span className="max-w-[320px] text-[14px] leading-relaxed text-slate-400">
                  {stat.desc}
                </span>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
