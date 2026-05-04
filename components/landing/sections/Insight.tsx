'use client';

import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

const STEPS = [
  {
    n: '01',
    title: 'Story Breaks',
    desc: 'News, meme, or event surfaces somewhere on Earth.',
  },
  {
    n: '02',
    title: 'Trends Locally',
    desc: 'Twitter / X spikes hard inside a single country.',
  },
  {
    n: '03',
    title: 'Token Launches',
    desc: 'A memecoin appears on-chain wrapping the story.',
  },
  {
    n: '04',
    title: 'Price Pumps',
    desc: 'Capital flows in from people who saw it first.',
  },
];

export default function Insight() {
  return (
    <section className="relative w-full bg-[#05080F] px-6 py-[120px] md:px-10">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="02" label="The Insight" align="center" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 text-center font-sans text-[44px] font-black leading-[1.04] tracking-[-0.02em] text-white md:text-[64px]">
            Attention precedes capital.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-5 max-w-[720px] text-center text-[18px] leading-snug text-slate-400 md:text-[20px]">
            Every memecoin pump starts as a story going viral somewhere on Earth.
          </p>
        </FadeUp>

        <div className="mt-20 flex flex-col items-stretch gap-4 md:flex-row md:items-stretch md:gap-3">
          {STEPS.map((step, i) => (
            <FadeUp key={step.n} delay={0.1 * i} className="flex-1">
              <div className="flex h-full flex-col gap-3 border border-cyan-500/35 bg-[#0B1220] p-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300/80">
                  {step.n}
                </span>
                <h3 className="font-sans text-[18px] font-bold uppercase tracking-[0.04em] text-white">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-400">
                  {step.desc}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="hidden flex-shrink-0 items-center justify-center px-1 text-cyan-400/70 md:flex"
                  style={{ display: 'none' }}
                >
                  →
                </div>
              )}
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <div className="mx-auto mt-16 max-w-[1100px] border border-cyan-700/50 bg-[#111A2E] px-8 py-6 text-center">
            <span className="font-mono text-[13px] uppercase tracking-[0.36em] text-cyan-300">
              The edge: 30 seconds beats 30 minutes of analysis.
            </span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
