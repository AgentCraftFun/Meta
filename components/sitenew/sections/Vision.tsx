'use client';

import { useEffect, useState } from 'react';
import Decode from '../Decode';
import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import SectionLabel from '../SectionLabel';
import Shimmer from '../Shimmer';
import TacticalFrame from '../TacticalFrame';
import { useSceneStore } from '../system/useSceneStore';

type Theme = {
  ring: string;
  text: string;
  glow: string;
  pillBg: string;
  ringRgb: string;
};

const THEMES: Record<'cyan' | 'amber' | 'red', Theme> = {
  cyan: {
    ring: 'rgba(34, 211, 238, 0.55)',
    ringRgb: '34, 211, 238',
    text: 'text-cyan-300',
    glow: 'shadow-[0_0_60px_-20px_rgba(34,211,238,0.55)]',
    pillBg: 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300',
  },
  amber: {
    ring: 'rgba(251, 191, 36, 0.55)',
    ringRgb: '251, 191, 36',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_60px_-20px_rgba(251,191,36,0.45)]',
    pillBg: 'bg-amber-400/10 border-amber-400/40 text-amber-300',
  },
  red: {
    ring: 'rgba(239, 68, 68, 0.55)',
    ringRgb: '239, 68, 68',
    text: 'text-red-400',
    glow: 'shadow-[0_0_60px_-20px_rgba(239,68,68,0.45)]',
    pillBg: 'bg-red-500/10 border-red-500/40 text-red-300',
  },
};

const CARDS = [
  {
    key: 'earth',
    theme: 'cyan' as const,
    title: 'Earth',
    subtitle: 'Attention',
    description:
      "See where the world's stories are forming, by country, in real time.",
    status: 'Shipping',
    visual: <EarthVisual />,
  },
  {
    key: 'moon',
    theme: 'amber' as const,
    title: 'Moon',
    subtitle: 'Capital',
    description:
      'See which tokens are launching around those narratives. Galaxy clusters by theme.',
    status: 'Q2 2026',
    visual: <MoonVisual />,
  },
  {
    key: 'bots',
    theme: 'red' as const,
    title: 'Bots',
    subtitle: 'Execution',
    description:
      'Trade through integrated bots without leaving the terminal. One-click signal → trade.',
    status: 'Q3 2026',
    visual: <BotsVisual />,
  },
];

export default function Vision() {
  return (
    <section className="relative w-full overflow-hidden bg-[#05080F]/75 px-6 py-[140px] md:px-10">
      <GridBackdrop step={72} color="rgba(34, 211, 238, 0.04)" />

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="05" label="Vision" align="center" />
        </FadeUp>

        <Decode className="text-center">
          <h2 className="mt-8 text-center font-display text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-white md:text-[60px]">
            The all-in-one terminal for <Shimmer>on-chain traders</Shimmer>.
          </h2>
        </Decode>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-6 max-w-[720px] text-center text-[16px] leading-snug text-slate-400 md:text-[18px]">
            Three products. One immersive command center.
          </p>
        </FadeUp>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => {
            const theme = THEMES[card.theme];
            return (
              <FadeUp key={card.key} delay={i * 0.12}>
                <TacticalFrame color={theme.ring} size={16} thickness={1.5}>
                  <article
                    className={`group relative flex h-full flex-col overflow-hidden bg-[#0B1220] transition-shadow duration-500 ${theme.glow}`}
                  >
                    {/* Status pill */}
                    <span
                      className={`absolute right-5 top-5 z-10 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.4em] ${theme.pillBg}`}
                    >
                      {card.status}
                    </span>

                    {/* Themed visual area */}
                    <div className="relative aspect-[5/3] w-full overflow-hidden border-b border-white/5 bg-[#06090F]">
                      {card.visual}
                    </div>

                    {/* Body */}
                    <div className="relative flex flex-1 flex-col p-7">
                      <span
                        className={`font-mono text-[11px] uppercase tracking-[0.4em] ${theme.text}`}
                      >
                        {card.subtitle}
                      </span>
                      <h3 className="mt-3 font-display text-[40px] font-bold leading-none tracking-[-0.025em] text-white">
                        {card.title}
                      </h3>
                      <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
                        {card.description}
                      </p>
                    </div>
                  </article>
                </TacticalFrame>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- per-card visuals ---------- */

function EarthVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Orbital rings */}
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full border border-cyan-400/15"
          style={{
            width: `${30 + i * 20}%`,
            height: `${30 + i * 20}%`,
            animation: `spin ${20 + i * 6}s linear infinite ${i % 2 ? 'reverse' : ''}`,
          }}
        />
      ))}
      {/* Planet */}
      <div className="relative h-[55%] w-[55%] rounded-full bg-gradient-to-br from-[#0a3b78] via-[#072546] to-[#02101f] shadow-[inset_-20px_-25px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(34,211,238,0.25)]">
        <div className="absolute left-[24%] top-[28%] h-[20%] w-[24%] rounded-full bg-[#244d2c]/85 blur-[2px]" />
        <div className="absolute left-[55%] top-[44%] h-[24%] w-[28%] rounded-full bg-[#28552f]/75 blur-[2px]" />
        <span
          className="absolute left-[45%] top-[36%] block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300"
          style={{ boxShadow: '0 0 14px rgba(34, 211, 238, 0.85)' }}
        />
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function MoonVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Constellation dots — fake token clusters */}
      <svg
        viewBox="0 0 240 144"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="moonGrad">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.25)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="72" r="60" fill="url(#moonGrad)" />
        {/* Cluster 1 */}
        <g stroke="rgba(251, 191, 36, 0.45)" strokeWidth={0.5}>
          <line x1="80" y1="50" x2="100" y2="60" />
          <line x1="100" y1="60" x2="115" y2="48" />
          <line x1="100" y1="60" x2="92" y2="78" />
          <line x1="115" y1="48" x2="135" y2="55" />
        </g>
        {/* Cluster 2 */}
        <g stroke="rgba(251, 191, 36, 0.35)" strokeWidth={0.5}>
          <line x1="155" y1="78" x2="170" y2="92" />
          <line x1="170" y1="92" x2="180" y2="78" />
          <line x1="155" y1="78" x2="140" y2="92" />
        </g>
        {/* Stars / nodes */}
        {[
          [80, 50, 2.5],
          [100, 60, 3.5],
          [115, 48, 2],
          [92, 78, 1.8],
          [135, 55, 2.2],
          [155, 78, 3],
          [170, 92, 2.5],
          [180, 78, 2],
          [140, 92, 1.8],
          [60, 90, 1.5],
          [200, 60, 1.8],
        ].map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="#fbbf24"
            opacity={0.85}
            style={{
              filter: `drop-shadow(0 0 4px rgba(251, 191, 36, 0.85))`,
              animation: `sn-twinkle ${2.4 + (i % 4) * 0.6}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </svg>
      <style jsx>{`
        @keyframes sn-twinkle {
          0%,
          100% {
            opacity: 0.85;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
      <span className="absolute right-6 top-5 font-mono text-[8px] uppercase tracking-[0.4em] text-amber-400/60">
        Galaxy / Tokens
      </span>
    </div>
  );
}

type Line = { tone: 'cyan' | 'red' | 'green' | 'muted'; label?: string; text: string };

const BASE_LINES: Line[] = [
  { label: '$', tone: 'muted', text: 'metamap signal --watch breaking' },
  { tone: 'muted', text: '>  Listening on 38 countries…' },
  { tone: 'cyan', text: '⚑  US · Spot ETH ETF inflows · vol 94' },
  { tone: 'red', text: '⚑  CN · PBOC RRR cut · vol 91 · ▲ +81%' },
  { tone: 'muted', text: '$  trade --token $RRR --size 0.5e' },
  { tone: 'green', text: '✓  Filled · 0.5 ETH @ 0.000142 · slippage 0.4%' },
];

// Pool the feed cycles through — a new line types in every 4s.
const FEED_LINES: Line[] = [
  { tone: 'red', text: '⚑  TR · CBRT 250bps hike · vol 76' },
  { tone: 'cyan', text: '⚑  IN · RBI digital rupee pilot · vol 70' },
  { tone: 'green', text: '✓  Filled · 0.3 ETH @ 0.000088 · slippage 0.6%' },
  { tone: 'red', text: '⚑  JP · BoJ YCC tweak leaked · vol 68 · ▲ +54%' },
  { tone: 'muted', text: '>  Re-ranking narratives…' },
];

function BotsVisual() {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const [lines, setLines] = useState<Line[]>(BASE_LINES);

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      const next = FEED_LINES[i % FEED_LINES.length];
      i++;
      setLines((prev) => [...prev.slice(-5), next]);
    }, 4000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end overflow-hidden bg-[#06090F] p-4 font-mono text-[10px] leading-snug">
      <div className="flex flex-col gap-1.5 opacity-90">
        {lines.map((l, idx) => (
          <TerminalLine key={`${idx}-${l.text}`} label={l.label} tone={l.tone}>
            {l.text}
          </TerminalLine>
        ))}
      </div>
      <span
        aria-hidden
        className="absolute right-5 top-4 h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]"
      />
    </div>
  );
}

function TerminalLine({
  children,
  label,
  tone,
}: {
  children: React.ReactNode;
  label?: string;
  tone: 'cyan' | 'red' | 'green' | 'muted';
}) {
  const color = {
    cyan: 'text-cyan-300',
    red: 'text-red-300',
    green: 'text-emerald-300',
    muted: 'text-slate-400',
  }[tone];
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-slate-500">{label}</span>}
      <span className={color}>{children}</span>
    </div>
  );
}
