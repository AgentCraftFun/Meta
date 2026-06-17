'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Decode from '@/components/sitenew/Decode';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';
import TacticalFrame from '@/components/sitenew/TacticalFrame';
import TiltCard from '@/components/sitenew/TiltCard';
import { useSceneStore } from '@/components/sitenew/system/useSceneStore';

type Theme = {
  ring: string;
  text: string;
  glow: string;
  pillBg: string;
  ringRgb: string;
};

const THEMES: Record<'cyan' | 'amber' | 'red', Theme> = {
  cyan: {
    ring: 'rgb(var(--accent-400) / 0.55)',
    ringRgb: 'var(--accent-400)',
    text: 'text-accent-300',
    glow: 'shadow-[0_0_60px_-20px_rgb(var(--accent-400)_/_0.55)]',
    pillBg: 'bg-accent-400/10 border-accent-400/40 text-accent-300',
  },
  amber: {
    ring: 'rgba(251, 191, 36, 0.55)',
    ringRgb: '251 191 36',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_60px_-20px_rgba(251,191,36,0.45)]',
    pillBg: 'bg-amber-400/10 border-amber-400/40 text-amber-300',
  },
  red: {
    ring: 'rgba(239, 68, 68, 0.55)',
    ringRgb: '239 68 68',
    text: 'text-red-400',
    glow: 'shadow-[0_0_60px_-20px_rgba(239,68,68,0.45)]',
    pillBg: 'bg-red-500/10 border-red-500/40 text-red-300',
  },
};

const CARDS = [
  {
    key: 'earth',
    theme: 'cyan' as const,
    title: 'SPCX',
    subtitle: 'Rewards',
    description:
      '2% of every buy and sell buys SPCX exposure on-chain and pays it to every holder, by how much they hold.',
    status: '2% · Live',
    visual: <EarthVisual />,
    // Desktop-live: the real travelling Mars body docks here (slot §5); the
    // visual area becomes a transparent cutout so it shows through.
    cutout: true,
  },
  {
    key: 'moon',
    theme: 'amber' as const,
    title: 'Passive',
    subtitle: 'Holders',
    description:
      'Hold $STAR and do nothing. $SPCX lands in your wallet on its own. No staking, no lockups, no claims.',
    status: '100% · Live',
    visual: <MoonVisual />,
    // Desktop-live: the real 3D moon (MoonCanvas) shows through this cutout.
    cutout: true,
  },
  {
    key: 'bots',
    theme: 'red' as const,
    title: 'Buy Backs',
    subtitle: 'Support',
    description:
      '1% buys $STAR back off the open market and burns it. Fixed 25M supply, so it only ever shrinks.',
    status: '1% · Live',
    visual: <BotsVisual />,
    // Desktop-live: the real 3D Jupiter (JupiterCanvas) shows through this cutout.
    cutout: true,
  },
];

export default function Vision() {
  // Desktop-live → the three cards become transparent cutouts and the real 3D
  // Mars + Moon + Jupiter (fixed z-0 canvases) show through. RM / mobile / SSR
  // keep the 2D fallback visuals in solid cards. (Matches ProductMock's gate.)
  const [cutoutMode, setCutoutMode] = useState(false);
  useEffect(() => {
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const m = window.matchMedia('(max-width: 768px)').matches;
    setCutoutMode(!r && !m);
  }, []);

  return (
    <section className="relative w-full overflow-hidden px-6 py-[140px] md:px-10">

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="05" label="Tokenomics" align="center" />
        </FadeUp>

        <Decode className="text-center">
          <h2 className="mt-8 text-center font-display text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-white md:text-[60px]">
            Every trade splits <Shimmer>two ways</Shimmer>.
          </h2>
        </Decode>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-6 max-w-[720px] text-center text-[16px] leading-snug text-slate-400 md:text-[18px]">
            One 3% tax on every buy and sell. Two jobs: pay holders in $SPCX, buy back and burn $STAR.
          </p>
        </FadeUp>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => {
            const theme = THEMES[card.theme];
            // When the real 3D body docks here, the card is a transparent
            // cutout: no opaque bg behind the visual area, and no tilt (the
            // fixed globe/moon wouldn't tilt with it). The body keeps its bg.
            const isCutout = Boolean(card.cutout) && cutoutMode;
            const article = (
              <article
                // Cutout cards get a real card SHAPE: a solid fill
                // (VisionCardBackdrops paints it BEHIND the globe so the model
                // sits in the card) + a crisp themed frame. The frame is
                // OPEN-TOP — left/right/bottom only — so the oversized model
                // emerges from the top with no border across the sphere (the
                // TacticalFrame corner brackets still mark the top corners). We
                // use a sharp border, never the old 60px-blur glow, whose bleed
                // (z-10 content over the z-0 globe) hazed the sphere into the
                // "see-through" band. Solid (RM/mobile) cards keep the glow.
                data-vision-card={isCutout ? card.theme : undefined}
                className={`group relative flex h-full flex-col overflow-hidden transition-shadow duration-500 ${
                  isCutout ? '' : `border ${theme.glow} bg-[#0B1220]`
                }`}
                style={
                  isCutout
                    ? {
                        borderLeft: `1px solid rgb(${theme.ringRgb} / 0.3)`,
                        borderRight: `1px solid rgb(${theme.ringRgb} / 0.3)`,
                        borderBottom: `1px solid rgb(${theme.ringRgb} / 0.3)`,
                      }
                    : { borderColor: `rgb(${theme.ringRgb} / 0.3)` }
                }
              >
                {/* Status pill — solid HUD chip (readable over the bright
                    bodies), themed glow + a periodic light sweep. */}
                <StatusPill status={card.status} theme={theme} />

                {/* Themed visual area — transparent cutout in live mode (the
                    fixed globe/moon shows through), else the 2D fallback. The
                    big body overflows this box, so cutout cards drop the bottom
                    border (it drew a line ACROSS the sphere). */}
                <div
                  id={`vision-globe-${card.key}`}
                  className={`relative aspect-[5/3] w-full overflow-hidden ${
                    isCutout ? '' : 'border-b border-white/5 bg-[#06090F]'
                  }`}
                >
                  {isCutout ? null : card.visual}
                </div>

                {/* Body. Cutout cards crop the model's lower half. The fill is
                    DARK (#05080F space) right at the crop edge so the sphere cuts
                    cleanly into a dark lip, then eases back to the #0B1220 card
                    fill for the text (matching the VisionCardBackdrops panel
                    behind the model, so visual area + body read as one card). */}
                <div
                  className="relative flex flex-1 flex-col p-7"
                  style={
                    isCutout
                      ? { background: 'linear-gradient(to bottom, #05080F 0%, #0B1220 52px)' }
                      : undefined
                  }
                >
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
            );
            return (
              <FadeUp key={card.key} delay={i * 0.12} className="h-full">
                <TacticalFrame color={theme.ring} size={16} thickness={1.5} className="h-full">
                  {isCutout ? (
                    article
                  ) : (
                    <TiltCard className="h-full">{article}</TiltCard>
                  )}
                </TacticalFrame>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- status pill ---------- */

/**
 * Solid HUD status chip (SHIPPING / Q2 2026 / …). The old chip used a 10%-opacity
 * fill, so it washed out and went unreadable over the bright bodies. This is a
 * near-opaque dark chip with a themed border + outer glow (so it reads as a lit
 * tactical readout) and a periodic diagonal light sweep across the face.
 * REDUCED-MOTION: solid chip, no sweep.
 */
function StatusPill({ status, theme }: { status: string; theme: Theme }) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const rgb = theme.ringRgb;
  return (
    <span
      className={`absolute right-5 top-5 z-10 inline-flex items-center overflow-hidden border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.4em] ${theme.text}`}
      style={{
        background: 'rgba(6, 9, 16, 0.92)',
        borderColor: `rgb(${rgb} / 0.55)`,
        boxShadow: `0 0 16px -4px rgb(${rgb} / 0.6), inset 0 0 12px -7px rgb(${rgb} / 0.9)`,
        textShadow: `0 0 8px rgb(${rgb} / 0.45)`,
      }}
    >
      <span className="relative z-10">{status}</span>
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{
            background: `linear-gradient(100deg, transparent 0%, rgb(${rgb} / 0.5) 50%, transparent 100%)`,
          }}
          initial={{ x: '-160%' }}
          animate={{ x: '320%' }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.4 }}
        />
      )}
    </span>
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
          className="absolute rounded-full border border-accent-400/15"
          style={{
            width: `${30 + i * 20}%`,
            height: `${30 + i * 20}%`,
            animation: `spin ${20 + i * 6}s linear infinite ${i % 2 ? 'reverse' : ''}`,
          }}
        />
      ))}
      {/* Planet */}
      <div className="relative h-[55%] w-[55%] rounded-full bg-gradient-to-br from-[var(--globe-1)] via-[var(--globe-2)] to-[var(--globe-3)] shadow-[inset_-20px_-25px_50px_rgba(0,0,0,0.7),0_0_30px_rgb(var(--accent-400)_/_0.25)]">
        <div className="absolute left-[24%] top-[28%] h-[20%] w-[24%] rounded-full bg-[#244d2c]/85 blur-[2px]" />
        <div className="absolute left-[55%] top-[44%] h-[24%] w-[28%] rounded-full bg-[#28552f]/75 blur-[2px]" />
        <span
          className="absolute left-[45%] top-[36%] block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-300"
          style={{ boxShadow: '0 0 14px rgb(var(--accent-400) / 0.85)' }}
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
        $SPCX / Passive
      </span>
    </div>
  );
}

type Line = { tone: 'cyan' | 'red' | 'green' | 'muted'; label?: string; text: string };

const BASE_LINES: Line[] = [
  { label: '$', tone: 'muted', text: 'starship deploy --network mainnet' },
  { tone: 'muted', text: '>  Liquidity locked · pair STAR/WETH' },
  { tone: 'cyan', text: '✶  Trade taxed 3% · 2/1 split' },
  { tone: 'green', text: '✓  SPCX distributed · +$61 to holders' },
  { tone: 'red', text: '↺  Bought back + burned · 0.05 ETH' },
  { tone: 'muted', text: '$  router fund --buyback 0.04 ETH' },
];

// Pool the feed cycles through — a new line types in every 4s.
const FEED_LINES: Line[] = [
  { tone: 'cyan', text: '✶  Trade taxed 3% · routed on-chain' },
  { tone: 'green', text: '✓  SPCX reflected · $418 to wallet' },
  { tone: 'red', text: '↺  Buyback filled · 0.06 ETH of $STAR' },
  { tone: 'green', text: '✓  Reflection pushed · +$27 avg' },
  { tone: 'muted', text: '>  Reflecting SPCX to 1,204 wallets…' },
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
    cyan: 'text-accent-300',
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
