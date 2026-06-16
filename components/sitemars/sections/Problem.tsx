'use client';

import CountUp from '@/components/sitenew/CountUp';
import Decode from '@/components/sitenew/Decode';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';

// The walls that have kept SpaceX off-limits to ordinary investors.
const GATEKEEPERS = [
  'Institutional Rounds',
  'Accredited Only',
  'Private Secondaries',
  '$0 Retail Access',
];

const STATS = [
  {
    target: 350,
    prefix: '$',
    suffix: 'B+',
    label: 'SpaceX Valuation',
    desc: 'One of the most valuable private companies on Earth — and still climbing.',
  },
  {
    target: 0,
    label: 'Shares For Retail',
    desc: 'Ordinary investors have never been able to buy SpaceX equity directly.',
  },
  {
    target: 100,
    suffix: '%',
    label: 'Locked To Insiders',
    desc: 'Access reserved for institutions, funds, and accredited private rounds.',
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
              SpaceX is the trade{' '}
              <span className="relative inline-block">
                <Shimmer>retail can&apos;t make</Shimmer>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgb(var(--accent-400) / 0.6), transparent)',
                  }}
                />
              </span>
              .
            </h2>
          </Decode>

          <FadeUp delay={0.2}>
            <p className="mt-5 text-[19px] leading-snug text-slate-400 md:text-[22px]">
              The most valuable rocket company on Earth — and you can&apos;t own a single share.
            </p>
          </FadeUp>

          {/* Gatekeeper strip — the walls keeping SpaceX private. */}
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

          {/* Stat ledger — the access gap, number-led. */}
          <div className="mt-8 border-t border-[#1E293B]/70">
            {STATS.map((stat, i) => (
              <FadeUp key={stat.label} delay={0.4 + i * 0.08}>
                <div className="grid grid-cols-[116px_1fr] items-baseline gap-4 border-b border-[#1E293B]/70 py-4 md:grid-cols-[172px_1fr] md:gap-6">
                  <CountUp
                    value={stat.target}
                    duration={1.0}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
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
