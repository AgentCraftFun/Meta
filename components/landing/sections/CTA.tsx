'use client';

import CTAButton from '../CTAButton';
import FadeUp from '../FadeUp';
import SectionLabel from '../SectionLabel';

export default function CTA() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#05080F] px-6 py-[160px] md:px-10"
      style={{
        backgroundImage:
          'radial-gradient(circle at center, rgba(34, 211, 238, 0.07) 0%, transparent 60%)',
      }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col items-center text-center">
        <FadeUp>
          <SectionLabel index="→" label="Enter" align="center" />
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="mt-8 max-w-[920px] font-sans text-[48px] font-black leading-[1.04] tracking-[-0.025em] text-white md:text-[80px]">
            Be early to the terminal that watches the world.
          </h2>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-slate-400">
            No signup. No paywall. Just open it and watch.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-12">
            <CTAButton href="/app" size="lg">
              Enter the Terminal
            </CTAButton>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
