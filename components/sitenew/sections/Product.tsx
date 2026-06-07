'use client';

import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import SectionLabel from '../SectionLabel';
import TacticalFrame from '../TacticalFrame';

const FEATURES = [
  {
    code: 'GLB-01',
    title: 'Hyperrealistic 3D Globe',
    desc: 'Cinematic earth from orbit. Click and drag through real-time data.',
    Icon: GlobeIcon,
  },
  {
    code: 'BCN-02',
    title: 'Beacons By Country',
    desc: 'Heat-coded light pillars mark trending narratives on the surface.',
    Icon: BeaconIcon,
  },
  {
    code: 'NET-03',
    title: 'Live Twitter / X Data',
    desc: 'Refreshed every 5 minutes across 38 priority countries.',
    Icon: PulseIcon,
  },
  {
    code: 'TIM-04',
    title: 'Time Windows',
    desc: 'Breaking now / 24h / 7d. Watch attention build over time.',
    Icon: ClockIcon,
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
    <section className="relative w-full overflow-hidden bg-[#05080F]/75 px-6 py-[140px] md:px-10">
      <GridBackdrop step={72} color="rgba(34, 211, 238, 0.04)" />

      <div className="relative mx-auto max-w-[1240px]">
        <FadeUp>
          <SectionLabel index="03" label="The Product" />
        </FadeUp>

        <div className="mt-12 grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-20">
          {/* Left — text */}
          <div>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-[40px] font-bold leading-[1.04] tracking-[-0.025em] text-white md:text-[56px]">
                A 3D earth that shows you{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                  what the world is talking about
                </span>
                .
              </h2>
            </FadeUp>

            <ul className="mt-14 grid grid-cols-1 gap-3">
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={0.1 + i * 0.08}>
                  <FeatureRow
                    code={f.code}
                    title={f.title}
                    desc={f.desc}
                    Icon={f.Icon}
                  />
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

function FeatureRow({
  code,
  title,
  desc,
  Icon,
}: {
  code: string;
  title: string;
  desc: string;
  Icon: () => JSX.Element;
}) {
  return (
    <li className="group relative">
      <TacticalFrame color="rgba(34, 211, 238, 0.18)" size={10}>
        <div className="flex items-start gap-5 bg-[#0B1220]/55 p-5 transition-colors duration-200 group-hover:bg-[#111A2E]/85">
          <span className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center border border-cyan-400/35 bg-cyan-400/10 text-cyan-300">
            <Icon />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-cyan-400/65">
                {code}
              </span>
              <span aria-hidden className="h-px flex-1 bg-cyan-400/15" />
            </div>
            <h3 className="mt-2 font-display text-[17px] font-bold uppercase tracking-[0.04em] text-white">
              {title}
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-slate-400">
              {desc}
            </p>
          </div>
        </div>
      </TacticalFrame>
    </li>
  );
}

function ProductMock() {
  return (
    <TacticalFrame color="rgba(34, 211, 238, 0.45)" size={16} thickness={1.5}>
      <div className="overflow-hidden rounded-sm bg-[#0B1220] shadow-[0_30px_80px_-30px_rgba(34,211,238,0.22)]">
        {/* Top bar */}
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
                      <div className="h-[2px] flex-1 bg-white/10">
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
    </TacticalFrame>
  );
}

function MockGlobeBackdrop() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-[78%] w-[78%] animate-pulse rounded-full bg-cyan-400/25 blur-2xl" />
      <div className="relative h-[68%] w-[68%] rounded-full bg-gradient-to-br from-[#0a3b78] via-[#072546] to-[#02101f] shadow-[inset_-30px_-40px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(34,211,238,0.18)]">
        <div className="absolute left-[18%] top-[28%] h-[18%] w-[20%] rounded-full bg-[#244d2c]/85 blur-[2px]" />
        <div className="absolute left-[42%] top-[42%] h-[22%] w-[26%] rounded-full bg-[#28552f]/75 blur-[2px]" />
        <div className="absolute left-[64%] top-[34%] h-[16%] w-[22%] rounded-full bg-[#2c5a31]/80 blur-[2px]" />
        <div className="absolute left-[24%] top-[56%] h-[14%] w-[16%] rounded-full bg-[#1f4426]/80 blur-[2px]" />
        <Beacon left="34%" top="40%" color="#ef4444" />
        <Beacon left="58%" top="44%" color="#fbbf24" />
        <Beacon left="72%" top="38%" color="#fbbf24" />
        <Beacon left="48%" top="60%" color="#f1f5f9" />
        <Beacon left="22%" top="50%" color="#ef4444" />
      </div>
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

function GlobeIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  );
}

function BeaconIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="20" r="1.5" />
      <path d="M12 18.5V5" />
      <path d="M5 5h14" />
      <path d="M7 5l-2-3M17 5l2-3" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
