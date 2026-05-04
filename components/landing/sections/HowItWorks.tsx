'use client';

import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

const STEPS = [
  {
    n: '01',
    title: 'Ingest',
    desc: 'X API v2 trends + recent search across 38 priority countries.',
  },
  {
    n: '02',
    title: 'Cluster',
    desc: 'Group tweets by entities. Score by volume, velocity, sentiment.',
  },
  {
    n: '03',
    title: 'Cache',
    desc: 'Top 10 narratives per country, cached in Redis. 5-min refresh.',
  },
  {
    n: '04',
    title: 'Render',
    desc: 'Beacons spawn on the globe. Heat-coded. Always live.',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative w-full bg-[#05080F] px-6 py-[120px] md:px-10">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="04" label="How It Works" align="center" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 text-center font-sans text-[36px] font-black leading-[1.06] tracking-[-0.02em] text-white md:text-[48px]">
            From tweet to beacon in under 5 minutes.
          </h2>
        </FadeUp>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-4 border border-[#1E293B] bg-[#0B1220] p-6">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300">
                  {step.n}
                  <span aria-hidden className="h-px flex-1 bg-cyan-400/30" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-cyan-400/30 bg-cyan-400/5 text-cyan-300">
                  <StepIcon i={i} />
                </div>
                <h3 className="font-sans text-[22px] font-black leading-tight tracking-[-0.01em] text-white">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-400">
                  {step.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4}>
          <div className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.42em] text-slate-500">
            Stack · Next.js / Three.js / X API / Redis / Vercel
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function StepIcon({ i }: { i: number }) {
  const stroke = 'currentColor';
  if (i === 0) {
    // X / Twitter feather
    return (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    );
  }
  if (i === 1) {
    // Cluster / hex
    return (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <circle cx="6" cy="8" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="12" cy="16" r="2" />
        <path d="M8 9l3 6M16 9l-3 6M8 8h8" />
      </svg>
    );
  }
  if (i === 2) {
    // Database
    return (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
      </svg>
    );
  }
  return (
    // Globe
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  );
}
