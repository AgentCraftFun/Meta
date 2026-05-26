'use client';

import Delta from '@/components/primitives/Delta';
import Pill from '@/components/primitives/Pill';
import Sparkline from '@/components/primitives/Sparkline';

/**
 * Dev-only visual smoke test for the primitive layer. Drops one of every
 * variant of every primitive onto a token-driven surface so we can eyeball
 * the design system without having to render a real product view.
 *
 * NOTE: Next 14's "private folder" convention excludes `_design` from
 * routing. If this page should be reachable as a URL, rename the folder
 * to `app/design/page.tsx`.
 */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') return null;

  const upTrend = [12, 14, 13, 17, 16, 21, 19, 24, 23, 29];
  const downTrend = [29, 27, 28, 24, 22, 19, 21, 14, 12, 9];
  const flat = [10, 10, 10, 10, 10];
  const wobble = [5, 12, 7, 18, 9, 22, 11, 26, 14, 31];

  return (
    <main className="min-h-screen bg-ds-bg-base font-ds-sans text-ds-text-primary">
      <div className="mx-auto max-w-[1100px] px-ds6 py-ds11">
        <header className="border-b border-ds-border-subtle pb-ds6">
          <p className="font-ds-mono text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
            MetaMap / Design / Primitives
          </p>
          <h1 className="mt-ds2 font-display text-[28px] font-bold tracking-[-0.02em] text-ds-text-primary">
            Visual smoke test
          </h1>
          <p className="mt-ds2 max-w-[640px] text-[13px] leading-relaxed text-ds-text-secondary">
            Token-driven primitives. Toggle OS reduced-motion to verify the
            pulse halts and the globe stops auto-orbiting.
          </p>
        </header>

        <Section title="Pill / variants">
          <Row>
            <Pill variant="default">Default</Pill>
            <Pill variant="info">Info</Pill>
            <Pill variant="bull">Bull</Pill>
            <Pill variant="bear">Bear</Pill>
            <Pill variant="warn">Warn</Pill>
          </Row>
        </Section>

        <Section title="Pill / sizes">
          <Row>
            <Pill variant="default" size="sm">Sm Default</Pill>
            <Pill variant="info" size="sm">Sm Info</Pill>
            <Pill variant="bull" size="sm">Sm Bull</Pill>
            <Pill variant="bear" size="sm">Sm Bear</Pill>
            <Pill variant="warn" size="sm">Sm Warn</Pill>
            <span className="text-ds-text-tertiary">·</span>
            <Pill variant="default" size="md">Md Default</Pill>
            <Pill variant="info" size="md">Md Info</Pill>
            <Pill variant="bull" size="md">Md Bull</Pill>
            <Pill variant="bear" size="md">Md Bear</Pill>
            <Pill variant="warn" size="md">Md Warn</Pill>
          </Row>
        </Section>

        <Section title="Pill / pulse">
          <Row>
            <Pill variant="info" pulse>Live</Pill>
            <Pill variant="bull" pulse>+0.40%</Pill>
            <Pill variant="bear" pulse>−1.21%</Pill>
            <Pill variant="warn" pulse>Breaking</Pill>
            <Pill variant="default" pulse>Idle</Pill>
          </Row>
        </Section>

        <Section title="Delta / percent">
          <Row>
            <Delta value={12.34} />
            <Delta value={3.05} />
            <Delta value={0.4} />
            <Delta value={0} />
            <Delta value={0.0005} />
            <Delta value={-0.87} />
            <Delta value={-4.5} />
            <Delta value={-23.18} />
          </Row>
        </Section>

        <Section title="Delta / absolute">
          <Row>
            <Delta value={1820345} format="abs" />
            <Delta value={419.7} format="abs" />
            <Delta value={0.012} format="abs" />
            <Delta value={0} format="abs" />
            <Delta value={-12.5} format="abs" />
            <Delta value={-9_500_000} format="abs" />
          </Row>
        </Section>

        <Section title="Sparkline">
          <div className="flex flex-wrap items-center gap-ds6">
            <SparkSlot label="Up">
              <Sparkline data={upTrend} color="#00D982" />
            </SparkSlot>
            <SparkSlot label="Down">
              <Sparkline data={downTrend} color="#FF4D6D" />
            </SparkSlot>
            <SparkSlot label="Flat">
              <Sparkline data={flat} color="#A0A6B0" />
            </SparkSlot>
            <SparkSlot label="Volatile">
              <Sparkline data={wobble} color="#4DD4FF" />
            </SparkSlot>
            <SparkSlot label="Wide">
              <Sparkline data={wobble} width={160} height={32} />
            </SparkSlot>
            <SparkSlot label="Empty">
              <Sparkline data={[]} />
            </SparkSlot>
          </div>
        </Section>

        <Section title="Color tokens">
          <div className="grid grid-cols-2 gap-ds4 md:grid-cols-4">
            <Swatch name="bg.base" value="#0A0B0E" className="bg-ds-bg-base" />
            <Swatch name="bg.surface" value="#13151A" className="bg-ds-bg-surface" />
            <Swatch name="bg.surfaceHi" value="#1A1D24" className="bg-ds-bg-surfaceHi" />
            <Swatch name="border.subtle" value="#1F2228" className="bg-ds-border-subtle" />
            <Swatch name="border.strong" value="#2A2E37" className="bg-ds-border-strong" />
            <Swatch name="text.primary" value="#FFFFFF" className="bg-ds-text-primary" />
            <Swatch name="text.secondary" value="#A0A6B0" className="bg-ds-text-secondary" />
            <Swatch name="text.tertiary" value="#5A6068" className="bg-ds-text-tertiary" />
            <Swatch name="accent.cyan" value="#4DD4FF" className="bg-ds-accent-cyan" />
            <Swatch name="accent.bull" value="#00D982" className="bg-ds-accent-bull" />
            <Swatch name="accent.bear" value="#FF4D6D" className="bg-ds-accent-bear" />
            <Swatch name="accent.warn" value="#FFB84D" className="bg-ds-accent-warn" />
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-ds9">
      <h2 className="font-ds-mono text-[10px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        {title}
      </h2>
      <div className="mt-ds3 rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5">
        {children}
      </div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-ds3">{children}</div>
  );
}

function SparkSlot({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-ds2">
      <span className="font-ds-mono text-[9px] uppercase tracking-[0.36em] text-ds-text-tertiary">
        {label}
      </span>
      <div className="rounded-ds-sm border border-ds-border-subtle bg-ds-bg-surfaceHi px-ds3 py-ds2">
        {children}
      </div>
    </div>
  );
}

function Swatch({
  name,
  value,
  className,
}: {
  name: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-ds3 rounded-ds-sm border border-ds-border-subtle bg-ds-bg-surfaceHi p-ds3">
      <span
        aria-hidden
        className={`h-9 w-9 rounded-ds-sm border border-ds-border-strong ${className}`}
      />
      <div className="flex flex-col">
        <span className="font-ds-mono text-[11px] text-ds-text-primary">
          {name}
        </span>
        <span
          data-numeric="true"
          className="font-ds-mono text-[10px] text-ds-text-tertiary"
        >
          {value}
        </span>
      </div>
    </div>
  );
}
