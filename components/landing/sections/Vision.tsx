'use client';

import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

type Card = {
  title: string;
  subtitle: string;
  description: string;
  status: string;
  ring: string;
  text: string;
  pillBg: string;
  Icon: () => JSX.Element;
};

const CARDS: Card[] = [
  {
    title: 'Earth',
    subtitle: 'Attention',
    description:
      "See where the world's stories are forming, by country, in real time.",
    status: 'Shipping',
    ring: 'border-cyan-400/55',
    text: 'text-cyan-300',
    pillBg: 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300',
    Icon: () => (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
    ),
  },
  {
    title: 'Moon',
    subtitle: 'Capital',
    description:
      'See which tokens are launching around those narratives. Galaxy clusters by theme.',
    status: 'Q2 2026',
    ring: 'border-amber-400/55',
    text: 'text-amber-300',
    pillBg: 'bg-amber-400/10 border-amber-400/40 text-amber-300',
    Icon: () => (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    title: 'Bots',
    subtitle: 'Execution',
    description:
      'Trade through integrated bots without leaving the terminal. One-click signal → trade.',
    status: 'Q3 2026',
    ring: 'border-red-500/55',
    text: 'text-red-400',
    pillBg: 'bg-red-500/10 border-red-500/40 text-red-300',
    Icon: () => (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <path d="M9 12h.01M15 12h.01M12 4v3M8 19v2M16 19v2" />
      </svg>
    ),
  },
];

export default function Vision() {
  return (
    <section className="relative w-full bg-[#05080F] px-6 py-[120px] md:px-10">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="05" label="Vision" align="center" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 text-center font-sans text-[36px] font-black leading-[1.06] tracking-[-0.02em] text-white md:text-[48px]">
            The all-in-one terminal for on-chain traders.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mx-auto mt-5 max-w-[700px] text-center text-[16px] leading-snug text-slate-400 md:text-[18px]">
            Three products. One immersive command center.
          </p>
        </FadeUp>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <FadeUp key={card.title} delay={i * 0.1}>
              <article
                className={[
                  'relative flex h-full flex-col gap-5 rounded-[4px] border bg-[#0B1220] p-8',
                  card.ring,
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute right-4 top-4 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.32em]',
                    card.pillBg,
                  ].join(' ')}
                >
                  {card.status}
                </span>
                <div className={card.text}>
                  <card.Icon />
                </div>
                <h3 className="font-sans text-[36px] font-black leading-none tracking-[-0.02em] text-white">
                  {card.title}
                </h3>
                <span
                  className={`font-mono text-[12px] uppercase tracking-[0.4em] ${card.text}`}
                >
                  {card.subtitle}
                </span>
                <p className="text-[14px] leading-relaxed text-slate-400">
                  {card.description}
                </p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
