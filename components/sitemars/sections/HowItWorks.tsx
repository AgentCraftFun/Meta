'use client';

import { motion } from 'framer-motion';
import Decode from '@/components/sitenew/Decode';
import DrawLine from '@/components/sitenew/DrawLine';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';
import TiltCard from '@/components/sitenew/TiltCard';
import { spring } from '@/components/sitenew/system/motion';

const STEPS = [
  {
    n: '01',
    title: 'Tax',
    code: 'SELL.3%',
    desc: 'Every sell on Uniswap is taxed 3%. Split: burn, SPCX, dev.',
  },
  {
    n: '02',
    title: 'Swap',
    code: 'STAR→SPCX',
    desc: 'The SPCX cut swaps on-chain: STAR → WETH → synthetic SPCX.',
  },
  {
    n: '03',
    title: 'Accrue',
    code: 'ACC.18D',
    desc: 'accSpcxPerToken rises for every holder, by how much they hold.',
  },
  {
    n: '04',
    title: 'Claim',
    code: 'CLAIM()',
    desc: 'Call claimRewards() and your synthetic SPCX lands in your wallet.',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="04" label="How It Works" align="center" />
        </FadeUp>

        <Decode className="text-center">
          <h2 className="mt-8 text-center font-display text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-white md:text-[60px]">
            From sell tax to <Shimmer>SPCX in your wallet</Shimmer>.
          </h2>
        </Decode>

        {/* Pipeline */}
        <div className="relative mt-20">
          {/* Horizontal pipeline track behind the cards — draws on (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[80px] hidden h-px md:block"
          >
            <DrawLine orientation="h" length={100} stroke="rgb(var(--accent-400) / 0.7)" />
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
                'Ethereum',
                'ERC-20',
                'Uniswap V2',
                'Synthetix-Style',
                'On-Chain',
                'Non-Custodial',
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

      {/* ---- APPLE GLASS SYSTEM (visionOS-style) ----------------------------
          .sn-glass      the frosted panel: backdrop blur+saturate (the live 3D
                         globe refracts through it), translucent top-lit fill,
                         1px outer edge, top rim catch-light, bottom micro-rim,
                         internal frost, deep float shadow + contact shadow.
            ::before     curved-glass top reflection (radial sheen from above)
            ::after      hairline inner ring — the "double edge" of real glass
          .sn-glass-chip icon well: smaller-radius glass, same lighting model
          .sn-glass-pill capsule for the step number
          Fallback: no backdrop-filter support → near-opaque dark panel. */}
      <style jsx global>{`
        .sn-glass {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(
            150deg,
            rgba(255, 255, 255, 0.13) 0%,
            rgba(255, 255, 255, 0.06) 38%,
            rgba(255, 255, 255, 0.025) 100%
          );
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow:
            0 24px 48px -16px rgba(0, 0, 0, 0.6),
            0 4px 14px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 28px rgba(255, 255, 255, 0.03);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .sn-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            130% 70% at 50% -12%,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.05) 42%,
            rgba(255, 255, 255, 0) 68%
          );
          pointer-events: none;
        }
        .sn-glass::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 23px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          pointer-events: none;
        }
        .sn-glass:hover {
          border-color: rgba(255, 255, 255, 0.26);
          box-shadow:
            0 28px 56px -16px rgba(0, 0, 0, 0.65),
            0 4px 14px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 255, 255, 0.06),
            inset 0 0 32px rgba(255, 255, 255, 0.045);
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .sn-glass {
            background: linear-gradient(150deg, rgba(26, 35, 54, 0.94), rgba(11, 18, 32, 0.94));
          }
        }
        .sn-glass-chip {
          border-radius: 16px;
          background: linear-gradient(
            150deg,
            rgba(255, 255, 255, 0.17) 0%,
            rgba(255, 255, 255, 0.05) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.32),
            0 10px 20px -10px rgba(0, 0, 0, 0.5);
        }
        .sn-glass-pill {
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
      `}</style>
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
        className="pointer-events-none absolute left-1/2 top-[80px] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-300 shadow-[0_0_16px_rgb(var(--accent-400)_/_0.85)] md:block"
      />
      {/* Connector dropping into card top — desktop only */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[80px] hidden h-12 w-px -translate-x-1/2 bg-gradient-to-b from-accent-300/70 to-transparent md:block"
      />

      {/* APPLE-GLASS CARD (visionOS read): frosted backdrop blur — the live
          globe behind this section refracts through the panel — with a layered
          specular system: top rim catch-light, curved-glass top reflection,
          hairline inner ring (double glass edge), internal frost, float shadow.
          Styles live in .sn-glass (global styled-jsx below). */}
      <TiltCard className="h-full rounded-[24px]">
        <div className="sn-glass h-full">
          {/* content sits above the ::before sheen layer */}
          <div className="relative z-[1] flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="sn-glass-pill px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-accent-200">
                {step.n}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400">
                {step.code}
              </span>
            </div>

            {/* Glass icon well */}
            <div className="sn-glass-chip mt-6 flex h-16 w-16 items-center justify-center text-accent-300">
              <span
                className="flex items-center justify-center"
                style={{ filter: 'drop-shadow(0 0 8px rgb(var(--accent-400) / 0.45))' }}
              >
                <StepIcon i={index} />
              </span>
            </div>

            <h3 className="mt-6 font-display text-[24px] font-bold leading-tight tracking-[-0.01em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300/80">
              {step.desc}
            </p>
          </div>
        </div>
      </TiltCard>
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
