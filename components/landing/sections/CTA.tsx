'use client';

import CTAButton from '../CTAButton';
import FadeUp from '../FadeUp';
import GridBackdrop from '../GridBackdrop';
import SectionLabel from '../SectionLabel';

export default function CTA() {
  return (
    <section className="relative w-full overflow-hidden bg-[#05080F] px-6 py-[180px] md:px-10">
      {/* Concentric orbital rings — slow rotation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        {[1, 1.5, 2.1, 2.8, 3.7].map((scale, i) => (
          <span
            key={i}
            className="absolute rounded-full border border-cyan-400/10"
            style={{
              width: `${scale * 320}px`,
              height: `${scale * 320}px`,
              animation: `cta-spin ${30 + i * 12}s linear infinite ${i % 2 ? 'reverse' : ''}`,
            }}
          />
        ))}
        {/* Tick markers on the outermost ring */}
        <div
          aria-hidden
          className="absolute"
          style={{ width: 1184, height: 1184 }}
        >
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * 360;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-590px)`,
                  width: 1,
                  height: 14,
                  background:
                    i % 6 === 0
                      ? 'rgba(34, 211, 238, 0.55)'
                      : 'rgba(34, 211, 238, 0.15)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Soft cyan radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(34, 211, 238, 0.10) 0%, transparent 55%)',
        }}
      />

      <GridBackdrop step={96} color="rgba(34, 211, 238, 0.04)" />

      <div className="relative mx-auto flex max-w-[1100px] flex-col items-center text-center">
        <FadeUp>
          <SectionLabel index="→" label="Enter" align="center" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-10 max-w-[940px] font-display text-[52px] font-bold leading-[1.0] tracking-[-0.035em] text-white md:text-[88px]">
            Be early to the terminal that{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              watches the world
            </span>
            .
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-7 max-w-[520px] text-[16px] leading-relaxed text-slate-400">
            No signup. No paywall. Just open it and watch.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-12">
            <CTAButton href="/" size="lg">
              Enter the Terminal
            </CTAButton>
          </div>
        </FadeUp>

        <FadeUp delay={0.45}>
          <div className="mt-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.45em] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            38 countries · live signal
          </div>
        </FadeUp>
      </div>

      <style jsx>{`
        @keyframes cta-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
