'use client';

import Decode from '@/components/sitenew/Decode';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';
import TacticalFrame from '@/components/sitenew/TacticalFrame';
import TiltCard from '@/components/sitenew/TiltCard';

const STEPS = [
  {
    n: '01',
    title: 'Someone Sells',
    desc: 'Any sell through the Uniswap pool triggers a 3% protocol tax.',
    glyph: <BreakingGlyph />,
  },
  {
    n: '02',
    title: 'Tax Splits',
    desc: 'Three equal cuts — 1% burn, 1% SpaceX, 1% development.',
    glyph: <TrendsGlyph />,
  },
  {
    n: '03',
    title: 'SpaceX Bought',
    desc: '1% is swapped on-chain into real SpaceX stock tokens.',
    glyph: <TokenGlyph />,
  },
  {
    n: '04',
    title: 'Holders Paid',
    desc: 'Distributed to every holder, in proportion to their stake.',
    glyph: <PumpGlyph />,
  },
];

export default function Insight() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">
      <div className="relative mx-auto max-w-[1240px]">
        {/* Globe owns the LEFT (~36%); all content sits in the RIGHT column and
            is laid out to fit one screen — no scroll to reveal the rest. */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[36%_1fr] md:items-center md:gap-16">
          {/* left — globe slot (Insight: disc, left). Empty on mobile. */}
          <div aria-hidden className="hidden md:block" />

          {/* right — content */}
          <div>
            <FadeUp>
              <SectionLabel index="02" label="The Insight" />
            </FadeUp>

            <Decode>
              <h2 className="mt-6 font-display text-[40px] font-bold leading-[1.04] tracking-[-0.03em] text-white md:text-[54px]">
                Every sell buys you <Shimmer>SpaceX</Shimmer>.
              </h2>
            </Decode>

            <FadeUp delay={0.2}>
              <p className="mt-5 max-w-[560px] text-[18px] leading-snug text-slate-400 md:text-[20px]">
                A 3% tax on every sale quietly routes real SpaceX stock to everyone holding $STAR.
              </p>
            </FadeUp>

            {/* The 4-step chain as a compact 2×2 grid (was a tall vertical flow).
                Numbers carry the sequence; the connecting arrow in the centre
                hints the flow without adding height. */}
            <div className="relative mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <FadeUp key={step.n} delay={0.15 + i * 0.08}>
                  <TacticalFrame color="rgb(var(--accent-400) / 0.55)" size={12}>
                    <TiltCard>
                      <div className="relative h-full bg-[#0B1220] p-4 mars-glass">
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-[11px] uppercase tracking-[0.36em] text-accent-300/85">
                            {step.n}
                          </span>
                          <div className="flex-shrink-0 text-accent-300/80">{step.glyph}</div>
                          <span
                            aria-hidden
                            className="ml-auto h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-accent-300/85 shadow-[0_0_8px_rgb(var(--accent-400)_/_0.85)]"
                          />
                        </div>
                        <h3 className="mt-3 font-display text-[16px] font-bold uppercase leading-tight tracking-[0.02em] text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                          {step.desc}
                        </p>
                      </div>
                    </TiltCard>
                  </TacticalFrame>
                </FadeUp>
              ))}
            </div>

            {/* Banner callout — the payoff line, kept on-screen with the chain. */}
            <FadeUp delay={0.5}>
              <TacticalFrame
                color="rgb(var(--accent-400) / 0.5)"
                size={16}
                thickness={1.5}
                className="mt-6"
              >
                <div className="relative overflow-hidden bg-[#111A2E] px-8 py-5 text-center mars-glass">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-accent-400/70 to-transparent"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-accent-400/70 to-transparent"
                  />
                  <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-400/65">
                    The Edge
                  </div>
                  <div className="mt-2.5 font-display text-[20px] font-bold tracking-[0.04em] text-white md:text-[24px]">
                    The more $STAR trades, the more SpaceX you own.
                  </div>
                </div>
              </TacticalFrame>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

function BreakingGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function TrendsGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function TokenGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h5a2 2 0 0 1 0 4H9M9 10v8" />
    </svg>
  );
}

function PumpGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 19h18M6 16l4-6 3 3 5-7" />
      <path d="M14 5h4v4" />
    </svg>
  );
}
