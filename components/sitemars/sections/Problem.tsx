'use client';

import CountUp from '@/components/sitenew/CountUp';
import Decode from '@/components/sitenew/Decode';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';

// SPCX is public now, but it sits in a brokerage doing nothing on-chain.
const GATEKEEPERS = ['Brokerage Only', 'KYC Required', 'Off-Chain', 'Static Position'];

type Stat = {
  target: number;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
  label: string;
  desc: string;
};

const STATS: Stat[] = [
  {
    target: 2.6,
    prefix: '$',
    suffix: 'T',
    formatter: (n) => n.toFixed(1),
    label: 'SPCX Market Cap',
    desc: 'Fifth-largest public company in the world, days after listing.',
  },
  {
    target: 135,
    prefix: '$',
    label: 'IPO Price',
    desc: 'Listed June 12, 2026. It has not traded sideways since.',
  },
  {
    target: 0,
    label: 'On-Chain SPCX',
    desc: 'No native, self-custodial way to hold SPCX exposure on-chain. Until $STAR.',
  },
];

export default function Problem() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[120px] md:px-10">
      <div className="relative mx-auto max-w-[1240px]">
        {/* Entire section lives in the LEFT column so the travelling Mars disc
            (slot ~74% / 47%) owns the right negative space. */}
        <div className="md:max-w-[640px]">
          <FadeUp>
            <SectionLabel index="01" label="The Problem" />
          </FadeUp>

          <Decode>
            <h2 className="mt-7 font-display text-[42px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[58px]">
              SpaceX went public.
              <br />
              <Shimmer>Your bags still sit in a brokerage.</Shimmer>
            </h2>
          </Decode>

          <FadeUp delay={0.2}>
            <p className="mt-5 text-[19px] leading-snug text-slate-400 md:text-[22px]">
              Anyone can buy SPCX now. But it lives in a brokerage, off-chain,
              KYC&apos;d to your name, doing nothing while volume rips.
            </p>
          </FadeUp>

          {/* Where SPCX still lives today: off-chain and static. */}
          <FadeUp delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
              {GATEKEEPERS.map((g) => (
                <span
                  key={g}
                  className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.18em] text-slate-400"
                >
                  <span aria-hidden className="h-1 w-1 rounded-full bg-accent-400/60" />
                  {g}
                </span>
              ))}
            </div>
          </FadeUp>

          {/* Stat ledger — the on-chain gap, number-led. */}
          <div className="mt-8 border-t border-[#1E293B]/70">
            {STATS.map((stat, i) => (
              <FadeUp key={stat.label} delay={0.4 + i * 0.08}>
                <div className="grid grid-cols-[116px_1fr] items-baseline gap-4 border-b border-[#1E293B]/70 py-4 md:grid-cols-[172px_1fr] md:gap-6">
                  <CountUp
                    value={stat.target}
                    duration={1.0}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    formatter={stat.formatter}
                    className="font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-white md:text-[40px]"
                  />
                  <div className="max-w-[420px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-300">
                        {stat.label}
                      </span>
                      <span
                        aria-hidden
                        className="font-mono text-[9px] tracking-[0.35em] text-accent-400/40"
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
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
