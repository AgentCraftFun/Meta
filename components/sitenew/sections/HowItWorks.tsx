'use client';

import { motion } from 'framer-motion';
import Decode from '../Decode';
import DrawLine from '../DrawLine';
import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import SectionLabel from '../SectionLabel';
import Shimmer from '../Shimmer';
import TacticalFrame from '../TacticalFrame';
import TiltCard from '../TiltCard';
import { spring } from '../system/motion';

const STEPS = [
  {
    n: '01',
    title: 'Ingest',
    code: 'X.API.V2',
    desc: 'Trends + recent search across 38 priority countries.',
  },
  {
    n: '02',
    title: 'Cluster',
    code: 'NLP.GROUP',
    desc: 'Group tweets by entities. Score by volume, velocity, sentiment.',
  },
  {
    n: '03',
    title: 'Cache',
    code: 'REDIS.5M',
    desc: 'Top 10 narratives per country, cached in Redis. 5-min refresh.',
  },
  {
    n: '04',
    title: 'Render',
    code: 'GPU.HDR',
    desc: 'Beacons spawn on the globe. Heat-coded. Always live.',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">
      <GridBackdrop step={72} color="rgba(34, 211, 238, 0.04)" />

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="04" label="How It Works" align="center" />
        </FadeUp>

        <Decode className="text-center">
          <h2 className="mt-8 text-center font-display text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-white md:text-[60px]">
            From tweet to beacon in <Shimmer>under 5 minutes</Shimmer>.
          </h2>
        </Decode>

        {/* Pipeline */}
        <div className="relative mt-20">
          {/* Horizontal pipeline track behind the cards — draws on (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[80px] hidden h-px md:block"
          >
            <DrawLine orientation="h" length={100} stroke="rgba(34,211,238,0.7)" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.1}>
                <StepCard step={step} index={i} />
              </FadeUp>
            ))}
          </div>
        </div>

        <FadeUp delay={0.4}>
          <div className="mt-16 text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.5em] text-slate-500">
              Stack
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                'Next.js',
                'Three.js',
                'X API v2',
                'Redis',
                'Vercel',
                'Tailwind',
              ].map((s) => (
                <span
                  key={s}
                  className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <div className="relative">
      {/* Pipeline node — sits on top of the horizontal track */}
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ ...spring.snappy, delay: 0.5 + index * 0.12 }}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[80px] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.85)] md:block"
      />
      {/* Connector dropping into card top — desktop only */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[80px] hidden h-12 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300/70 to-transparent md:block"
      />

      <TacticalFrame color="rgba(34, 211, 238, 0.4)" size={12}>
       <TiltCard className="h-full">
        <div className="relative h-full bg-[#0B1220] p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300">
              {step.n}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
              {step.code}
            </span>
          </div>

          <div className="mt-6 flex h-16 w-16 items-center justify-center border border-cyan-400/35 bg-cyan-400/8 text-cyan-300">
            <StepIcon i={index} />
          </div>

          <h3 className="mt-6 font-display text-[24px] font-bold leading-tight tracking-[-0.01em] text-white">
            {step.title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            {step.desc}
          </p>
        </div>
       </TiltCard>
      </TacticalFrame>
    </div>
  );
}

function StepIcon({ i }: { i: number }) {
  const stroke = 'currentColor';
  if (i === 0) {
    return (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    );
  }
  if (i === 1) {
    return (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="12" cy="16" r="2" />
        <path d="M8 9l3 6M16 9l-3 6M8 8h8" />
      </svg>
    );
  }
  if (i === 2) {
    return (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
      </svg>
    );
  }
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  );
}
