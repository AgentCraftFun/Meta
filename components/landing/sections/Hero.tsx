'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import CTAButton from '../CTAButton';
import CornerBrackets from '../CornerBrackets';

const HeroGlobe = dynamic(() => import('../HeroGlobe'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#05080F]" />,
});

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#05080F]">
      {/* 3D backdrop */}
      <HeroGlobe />

      {/* Tactical frame */}
      <CornerBrackets />

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        {/* Top-left tactical readout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center gap-2 px-10 pt-10 font-mono text-[10px] uppercase tracking-[0.45em] text-cyan-300/80"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          Live · Global Signal
        </motion.div>

        {/* Center-left main content */}
        <div className="flex flex-1 items-center px-10">
          <div className="pointer-events-auto max-w-[640px]">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="font-sans text-[100px] font-black leading-[0.92] tracking-[-0.04em] text-white md:text-[120px]"
            >
              MetaMap
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
              className="mt-6 font-mono text-[13px] uppercase leading-relaxed tracking-[0.32em] text-cyan-300/95"
            >
              The world&apos;s attention,
              <br />
              mapped in real time.
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.55 }}
              className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-slate-300/90"
            >
              A live geopolitical attention dashboard for on-chain traders.
              See where the next narrative is forming, before the token does.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.75 }}
              className="mt-10"
            >
              <CTAButton href="/app">Enter the Terminal</CTAButton>
            </motion.div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between px-10 pb-10 font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            V1.0 · Beta
          </motion.span>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex items-center gap-2 text-slate-400/70"
          >
            <span aria-hidden className="animate-bounce">↓</span>
            <span>Explore</span>
          </motion.div>
          <span className="opacity-0">spacer</span>
        </div>
      </div>
    </section>
  );
}
