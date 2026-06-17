'use client';

import { motion } from 'framer-motion';
import CTAButton from '@/components/sitenew/CTAButton';
import CornerBrackets from '@/components/sitenew/CornerBrackets';
import Decode from '@/components/sitenew/Decode';
import { ease } from '@/components/sitenew/system/motion';
import { useSceneStore } from '@/components/sitenew/system/useSceneStore';

/**
 * /siteMARS hero — Starship Protocol. The 3D Mars body is the page-wide
 * persistent <SceneCanvasMars> (z-0); this section is transparent content
 * floating over it.
 *
 * POWER-ON: the entrance sequence waits for boot (store.booted), then plays
 * strictly in order: live readout → emblem → wordmark → promise → body → CTA.
 */
export default function Hero() {
  const booted = useSceneStore((s) => s.booted);
  const reduced = useSceneStore((s) => s.reducedMotion);

  // Sequenced line props. Under RM: opacity-only, 0.3s, no y-transform.
  const line = (delay: number) =>
    reduced
      ? {
          initial: { opacity: 0 },
          animate: booted ? { opacity: 1 } : { opacity: 0 },
          transition: { duration: 0.3, delay: 0, ease: ease.expoOut },
        }
      : {
          initial: { opacity: 0, y: 12 },
          animate: booted ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
          transition: { duration: 0.6, delay, ease: ease.expoOut },
        };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Tactical frame */}
      <CornerBrackets />

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        {/* Top-left tactical readout */}
        <motion.div
          {...line(0.1)}
          className="flex items-center gap-2 px-10 pt-10 font-mono text-[10px] uppercase tracking-[0.45em] text-accent-300/80"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-300 shadow-[0_0_10px_rgb(var(--accent-400)_/_0.85)]" />
          Live · Ethereum Mainnet
        </motion.div>

        {/* Center-left main content */}
        <div className="flex flex-1 items-center px-10">
          <div className="pointer-events-auto max-w-[660px]">
            {/* Emblem */}
            <motion.img
              {...line(0.25)}
              src="/Starship_Protocol_Logo.png"
              alt="Starship Protocol"
              className="mb-5 h-[92px] w-[92px] object-contain drop-shadow-[0_0_34px_rgb(var(--accent-400)_/_0.4)]"
            />

            <Decode
              play={booted}
              delay={0.35}
              className="font-display text-[52px] font-bold leading-[0.95] tracking-[-0.04em] text-white md:text-[78px]"
            >
              Starship Protocol
            </Decode>

            <motion.div
              {...line(0.85)}
              className="mt-6 font-mono text-[13px] uppercase leading-relaxed tracking-[0.32em] text-accent-300/95"
            >
              On-chain SPCX exposure.
              <br />
              It grows on every buy and every sell.
            </motion.div>

            <motion.p
              {...line(1.05)}
              className="mt-6 max-w-[500px] text-[16px] leading-relaxed text-slate-300/90"
            >
              $STAR is a deflationary ERC-20 on Ethereum. Every buy and sell
              pushes SPCX straight to holder wallets, by how much you hold.
              Just hold $STAR and it stacks on its own. No staking, no claims,
              no dashboards.
            </motion.p>

            <motion.div {...line(1.3)} className="mt-10">
              <CTAButton href="/MarsTracker">Open Tracker</CTAButton>
            </motion.div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between px-10 pb-10 font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">
          <motion.span {...line(1.5)}>$STAR · ERC-20</motion.span>
          <motion.div {...line(1.5)} className="flex items-center gap-2 text-slate-400/70">
            <span aria-hidden className="animate-bounce">↓</span>
            <span>Explore</span>
          </motion.div>
          <span className="opacity-0">spacer</span>
        </div>
      </div>
    </section>
  );
}
