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

const STEPS = [
  {
    n: '01',
    title: 'Story Breaks',
    desc: 'News, meme, or event surfaces somewhere on Earth.',
    glyph: <BreakingGlyph />,
  },
  {
    n: '02',
    title: 'Trends Locally',
    desc: 'Twitter / X spikes hard inside a single country.',
    glyph: <TrendsGlyph />,
  },
  {
    n: '03',
    title: 'Token Launches',
    desc: 'A memecoin appears on-chain wrapping the story.',
    glyph: <TokenGlyph />,
  },
  {
    n: '04',
    title: 'Price Pumps',
    desc: 'Capital flows in from people who saw it first.',
    glyph: <PumpGlyph />,
  },
];

export default function Insight() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">
      <GridBackdrop step={72} color="rgba(34, 211, 238, 0.04)" />

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="02" label="The Insight" align="center" />
        </FadeUp>

        <Decode className="text-center">
          <h2 className="mt-8 text-center font-display text-[48px] font-bold leading-[1.02] tracking-[-0.03em] text-white md:text-[80px]">
            Attention precedes <Shimmer>capital</Shimmer>.
          </h2>
        </Decode>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-6 max-w-[760px] text-center text-[18px] leading-snug text-slate-400 md:text-[20px]">
            Every memecoin pump starts as a story going viral somewhere on Earth.
          </p>
        </FadeUp>

        {/* Flow — 4 framed cards with animated cyan connector lines */}
        <div className="relative mt-24 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {STEPS.map((step, i) => (
            <Cell key={step.n} step={step} index={i} isLast={i === STEPS.length - 1} />
          ))}
        </div>

        {/* Banner callout */}
        <FadeUp delay={0.3}>
          <TacticalFrame
            color="rgba(34, 211, 238, 0.5)"
            size={18}
            thickness={1.5}
            className="mx-auto mt-20 max-w-[1100px]"
          >
            <div className="relative overflow-hidden bg-[#111A2E] px-10 py-7 text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent"
              />
              <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan-400/65">
                The Edge
              </div>
              <div className="mt-3 font-display text-[20px] font-bold tracking-[0.04em] text-white md:text-[26px]">
                30 seconds beats 30 minutes of analysis.
              </div>
            </div>
          </TacticalFrame>
        </FadeUp>
      </div>
    </section>
  );
}

function Cell({
  step,
  index,
  isLast,
}: {
  step: (typeof STEPS)[number];
  index: number;
  isLast: boolean;
}) {
  return (
    <>
      <FadeUp delay={index * 0.12}>
        <TacticalFrame color="rgba(34, 211, 238, 0.55)" size={12}>
         <TiltCard className="h-full">
          <div className="relative h-full bg-[#0B1220] p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300/85">
                {step.n}
              </span>
              <span
                aria-hidden
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300/85 shadow-[0_0_8px_rgba(34,211,238,0.85)]"
              />
            </div>
            <div className="mt-6 text-cyan-300/80">{step.glyph}</div>
            <h3 className="mt-6 font-display text-[20px] font-bold uppercase leading-tight tracking-[0.02em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              {step.desc}
            </p>
          </div>
         </TiltCard>
        </TacticalFrame>
      </FadeUp>
      {!isLast && (
        <div className="relative hidden items-center justify-center md:flex">
          {/* connector draws on as you arrive */}
          <div className="h-px w-full">
            <DrawLine orientation="h" length={100} delay={index * 0.12 + 0.2} />
          </div>
          {/* chevron pops in after the line completes (0.4s snappy) */}
          <motion.span
            aria-hidden
            className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-300"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8, delay: index * 0.12 + 0.7 }}
          >
            ▶
          </motion.span>
        </div>
      )}
    </>
  );
}

function BreakingGlyph() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function TrendsGlyph() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M14 8h6v6" />
    </svg>
  );
}

function TokenGlyph() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h5a2 2 0 0 1 0 4H9M9 10v8" />
    </svg>
  );
}

function PumpGlyph() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 19h18M6 16l4-6 3 3 5-7" />
      <path d="M14 5h4v4" />
    </svg>
  );
}
