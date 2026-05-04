'use client';

import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

const FEATURES = [
  {
    title: 'Hyperrealistic 3D Globe',
    desc: 'Cinematic earth from orbit. Click and drag through real-time data.',
  },
  {
    title: 'Beacons By Country',
    desc: 'Heat-coded light pillars mark trending narratives on the surface.',
  },
  {
    title: 'Live Twitter / X Data',
    desc: 'Refreshed every 5 minutes across 38 priority countries.',
  },
  {
    title: 'Time Windows',
    desc: 'Breaking now / 24h / 7d. Watch attention build over time.',
  },
];

const MOCK_NARRATIVES = [
  { rank: '01', title: 'Spot ETH ETF inflows hit record', vol: 94, mom: '+72', heat: 'red' },
  { rank: '02', title: 'PBOC unexpectedly cuts RRR by 25bps', vol: 91, mom: '+81', heat: 'red' },
  { rank: '03', title: 'CBRT surprise 250bps hike to 50%', vol: 76, mom: '+71', heat: 'amber' },
  { rank: '04', title: 'DeepSeek v4 weights drop with vision', vol: 84, mom: '+69', heat: 'amber' },
];

const HEAT_COLOR: Record<string, { dot: string; bar: string; ring: string }> = {
  red: {
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.85)]',
    bar: 'bg-red-500/85',
    ring: 'border-red-500/55',
  },
  amber: {
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
    bar: 'bg-amber-400/85',
    ring: 'border-amber-400/55',
  },
};

export default function Product() {
  return (
    <section className="relative w-full bg-[#05080F] px-6 py-[120px] md:px-10">
      <div className="mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="03" label="The Product" />
        </FadeUp>

        <div className="mt-12 grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16">
          {/* Left — text */}
          <div>
            <FadeUp delay={0.1}>
              <h2 className="font-sans text-[36px] font-black leading-[1.06] tracking-[-0.02em] text-white md:text-[48px]">
                A 3D earth that shows you what the world is talking about.
              </h2>
            </FadeUp>

            <ul className="mt-12 flex flex-col gap-7">
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={0.1 + i * 0.08}>
                  <li className="flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300">
                      <span className="block h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                    </span>
                    <div>
                      <h3 className="font-mono text-[13px] uppercase tracking-[0.32em] text-cyan-300">
                        {f.title}
                      </h3>
                      <p className="mt-1.5 max-w-[420px] text-[14px] leading-relaxed text-slate-400">
                        {f.desc}
                      </p>
                    </div>
                  </li>
                </FadeUp>
              ))}
            </ul>
          </div>

          {/* Right — product mock */}
          <FadeUp delay={0.2}>
            <ProductMock />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function ProductMock() {
  return (
    <div className="overflow-hidden rounded-sm border border-[#1E293B] bg-[#0B1220] shadow-[0_30px_80px_-30px_rgba(34,211,238,0.18)]">
      {/* Mock top bar */}
      <div className="flex items-center justify-between border-b border-[#1E293B] bg-black/30 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
          MetaMap · Live
        </div>
        <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.32em]">
          <span className="border border-transparent px-2 py-1 text-slate-500">
            Breaking
          </span>
          <span className="bg-cyan-300/95 px-2 py-1 text-black">24h</span>
          <span className="border border-transparent px-2 py-1 text-slate-500">7d</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_220px]">
        {/* Globe area */}
        <div className="relative aspect-[5/4] overflow-hidden border-r border-[#1E293B] bg-gradient-to-b from-[#03060B] to-[#070C18]">
          <MockGlobeBackdrop />
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-2 p-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.32em] text-slate-500">
            🇺🇸 United States · #1
          </div>
          <ol className="flex flex-col gap-2">
            {MOCK_NARRATIVES.map((n) => {
              const c = HEAT_COLOR[n.heat] ?? HEAT_COLOR.amber;
              return (
                <li
                  key={n.rank}
                  className={`rounded-sm border ${c.ring} bg-black/30 px-2.5 py-2`}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-[9px] tabular-nums text-slate-500">
                      #{n.rank}
                    </span>
                    <span
                      className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`}
                    />
                    <p className="text-[10.5px] font-medium leading-snug text-white">
                      {n.title}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-[2px] flex-1 bg-white/8">
                      <div
                        className={`h-full ${c.bar}`}
                        style={{ width: `${n.vol}%` }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums text-emerald-300/85">
                      ▲ {n.mom}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight static SVG-and-CSS mock of the globe. Cheaper than a full
 * second R3F canvas; reads as the product without the GPU cost.
 */
function MockGlobeBackdrop() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Atmosphere halo */}
      <div className="absolute h-[78%] w-[78%] rounded-full bg-cyan-400/25 blur-2xl" />
      {/* Planet */}
      <div className="relative h-[68%] w-[68%] rounded-full bg-gradient-to-br from-[#0a3b78] via-[#072546] to-[#02101f] shadow-[inset_-30px_-40px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(34,211,238,0.18)]">
        {/* Continents (cheap blobs) */}
        <div className="absolute left-[18%] top-[28%] h-[18%] w-[20%] rounded-full bg-[#244d2c]/85 blur-[2px]" />
        <div className="absolute left-[42%] top-[42%] h-[22%] w-[26%] rounded-full bg-[#28552f]/75 blur-[2px]" />
        <div className="absolute left-[64%] top-[34%] h-[16%] w-[22%] rounded-full bg-[#2c5a31]/80 blur-[2px]" />
        <div className="absolute left-[24%] top-[56%] h-[14%] w-[16%] rounded-full bg-[#1f4426]/80 blur-[2px]" />

        {/* Beacons */}
        <Beacon left="34%" top="40%" color="#ef4444" />
        <Beacon left="58%" top="44%" color="#fbbf24" />
        <Beacon left="72%" top="38%" color="#fbbf24" />
        <Beacon left="48%" top="60%" color="#f1f5f9" />
        <Beacon left="22%" top="50%" color="#ef4444" />
      </div>

      {/* Stars */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => {
          const x = (i * 37) % 100;
          const y = (i * 71) % 100;
          return (
            <span
              key={i}
              className="absolute h-px w-px bg-white/55"
              style={{ left: `${x}%`, top: `${y}%`, opacity: ((i * 17) % 80) / 100 }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Beacon({ left, top, color }: { left: string; top: string; color: string }) {
  return (
    <div className="absolute" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
      <span
        className="absolute inset-0 m-auto block h-1.5 w-1.5 animate-pulse rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 1,
          height: 22,
          background: `linear-gradient(to top, ${color}, transparent)`,
          opacity: 0.85,
        }}
      />
    </div>
  );
}
