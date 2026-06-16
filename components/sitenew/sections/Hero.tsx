'use client';

import { motion } from 'framer-motion';
import CTAButton from '../CTAButton';
import CornerBrackets from '../CornerBrackets';
import Decode from '../Decode';
import { ease } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';

/**
 * siteNEW hero. The 3D globe is the page-wide persistent <SceneCanvas> (z-0);
 * this section is transparent content floating over it.
 *
 * POWER-ON: the entrance sequence waits for boot to complete (store.booted),
 * then plays strictly in order — never simultaneous:
 *   live readout → headline (Decode mask-reveal) → tagline → body → CTA arms.
 *
 * REDUCED-MOTION: booted flips immediately; each line is opacity-only 0.3s with
 * no transform (Decode handles the headline's RM path).
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
          Live · Global Signal
        </motion.div>

        {/* Center-left main content */}
        <div className="flex flex-1 items-center px-10">
          <div className="pointer-events-auto max-w-[640px]">
            <Decode
              play={booted}
              delay={0.35}
              className="font-display text-[100px] font-bold leading-[0.92] tracking-[-0.05em] text-white md:text-[124px]"
            >
              MetaMap
            </Decode>

            <motion.div
              {...line(0.85)}
              className="mt-6 font-mono text-[13px] uppercase leading-relaxed tracking-[0.32em] text-accent-300/95"
            >
              The world&apos;s attention,
              <br />
              mapped in real time.
            </motion.div>

            <motion.p
              {...line(1.05)}
              className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-slate-300/90"
            >
              A live geopolitical attention dashboard for on-chain traders.
              See where the next narrative is forming, before the token does.
            </motion.p>

            <motion.div {...line(1.3)} className="mt-10">
              <CTAButton href="/terminal">Enter the Terminal</CTAButton>
            </motion.div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between px-10 pb-10 font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">
          <motion.span {...line(1.5)}>V1.0 · Beta</motion.span>
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
