'use client';

import { useEffect, useRef, useState } from 'react';
import { color, z } from './motion';
import { FEED } from './seededFeed';
import { useSceneStore } from './useSceneStore';

const TONE: Record<string, string> = {
  cyan: 'text-accent-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
};

const REFRESH_SECONDS = 300; // mirrors the 5-min refresh claim

/**
 * Ambient live-signal strip (z-20). A seeded marquee of country-code events
 * scrolling 40s linear + a "REFRESH IN m:ss" clock counting 4:59 → 0:00 and
 * resetting. Fades in past the hero (scrollProgress > 0.04). All loops pause on
 * tab-hidden.
 *
 * REDUCED-MOTION: no marquee scroll (static latest values), clock static at the
 * seed value.
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
      {/* refresh clock */}
      <div className="flex h-full flex-shrink-0 items-center gap-2 border-r border-[#1E293B] px-4 font-mono text-[9px] uppercase tracking-[0.32em] text-slate-400">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: color.cyan, boxShadow: `0 0 8px ${color.cyan}` }}
        />
        Refresh in {mm}:{ss}
      </div>

      {/* marquee */}
      <div className="relative h-full flex-1 overflow-hidden">
        <Marquee paused={hidden} reduced={reduced}>
          {items.map((e, i) => (
            <span
              key={i}
              className="mx-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em]"
            >
              <span className="text-slate-500">{e.cc}</span>
              <span className={TONE[e.tone] ?? 'text-slate-300'}>· {e.text} ·</span>
              <span className="text-slate-400">vol {e.vol}</span>
              {e.mom != null && (
                <span className="text-emerald-300/85">▲ +{e.mom}%</span>
              )}
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
