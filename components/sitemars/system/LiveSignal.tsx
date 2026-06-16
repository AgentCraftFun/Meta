'use client';

import { useEffect, useRef, useState } from 'react';
import { color, z } from '@/components/sitenew/system/motion';
import { useSceneStore } from '@/components/sitenew/system/useSceneStore';

const TONE: Record<string, string> = {
  burn: 'text-red-300',
  spx: 'text-accent-300',
  dev: 'text-amber-300',
};

/** Live protocol log — a seeded stream of sell-tax events (1% burn / 1% SpaceX
 *  / 1% dev) so the strip reinforces the core loop: every sell feeds holders. */
type Tick = { tag: string; text: string; val: string; tone: keyof typeof TONE };
const FEED: Tick[] = [
  { tag: 'SELL', text: '18,240 STAR sold · 3% tax routed on-chain', val: '🔥 182 burned', tone: 'burn' },
  { tag: 'SPX', text: 'SpaceX stock distributed to all holders', val: '+ $61', tone: 'spx' },
  { tag: 'BURN', text: 'Supply removed from circulation forever', val: '− 94 STAR', tone: 'burn' },
  { tag: 'DEV', text: 'Routed to Starship development wallet', val: '+ 0.04 ETH', tone: 'dev' },
  { tag: 'SELL', text: '7,410 STAR sold · burn + reward + dev', val: '🔥 74 burned', tone: 'burn' },
  { tag: 'SPX', text: 'accSpxPerToken accumulator advanced', val: '+ $27', tone: 'spx' },
  { tag: 'HOLD', text: 'Holders accruing SpaceX exposure', val: '1,204 wallets', tone: 'spx' },
  { tag: 'SUPPLY', text: 'Circulating STAR, shrinking with volume', val: '24,288,104', tone: 'dev' },
  { tag: 'SELL', text: '31,900 STAR sold · 1% → SpaceX stock', val: '+ $104', tone: 'spx' },
  { tag: 'CLAIM', text: 'Holder withdrew SpaceX rewards', val: '$418 SPX', tone: 'spx' },
];

const REFRESH_SECONDS = 300;

/**
 * Ambient live protocol strip (z-20). A seeded marquee of tax-event lines
 * scrolling 40s linear + a "NEXT SWAP m:ss" countdown. Fades in past the hero
 * (scrollProgress > 0.04). Loops pause on tab-hidden.
 *
 * REDUCED-MOTION: no marquee scroll (static), clock static at the seed value.
 */
export default function LiveSignal() {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const [secs, setSecs] = useState(REFRESH_SECONDS - 1);
  const [hidden, setHidden] = useState(false);
  const visible = scrollProgress > 0.04;

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (reduced || hidden) return;
    const id = setInterval(() => {
      setSecs((s) => (s <= 0 ? REFRESH_SECONDS - 1 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [reduced, hidden]);

  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, '0');

  // Duplicate the feed so the marquee wraps seamlessly.
  const items = reduced ? FEED : [...FEED, ...FEED];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 flex h-7 items-center border-t border-[#1E293B] bg-[#05080F]/80 backdrop-blur-sm transition-opacity duration-500"
      style={{ zIndex: z.hud, opacity: visible ? 1 : 0 }}
    >
      {/* next-swap clock */}
      <div className="flex h-full flex-shrink-0 items-center gap-2 border-r border-[#1E293B] px-4 font-mono text-[9px] uppercase tracking-[0.32em] text-slate-400">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: color.cyan, boxShadow: `0 0 8px ${color.cyan}` }}
        />
        Next swap {mm}:{ss}
      </div>

      {/* marquee */}
      <div className="relative h-full flex-1 overflow-hidden">
        <Marquee paused={hidden} reduced={reduced}>
          {items.map((e, i) => (
            <span
              key={i}
              className="mx-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em]"
            >
              <span className="text-slate-500">{e.tag}</span>
              <span className="text-slate-400">· {e.text} ·</span>
              <span className={TONE[e.tone] ?? 'text-slate-300'}>{e.val}</span>
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

function Marquee({
  children,
  paused,
  reduced,
}: {
  children: React.ReactNode;
  paused: boolean;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (reduced) {
    return (
      <div className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap">
        {children}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap"
      style={{
        animation: 'sn-marquee 40s linear infinite',
        animationPlayState: paused ? 'paused' : 'running',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes sn-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
