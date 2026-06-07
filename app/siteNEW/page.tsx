import CTA from '@/components/sitenew/sections/CTA';
import Footer from '@/components/sitenew/sections/Footer';
import Hero from '@/components/sitenew/sections/Hero';
import HowItWorks from '@/components/sitenew/sections/HowItWorks';
import Insight from '@/components/sitenew/sections/Insight';
import Problem from '@/components/sitenew/sections/Problem';
import Product from '@/components/sitenew/sections/Product';
import Vision from '@/components/sitenew/sections/Vision';
import GlobePlacer from '@/components/sitenew/scene/GlobePlacer';
import GlobeStageController from '@/components/sitenew/scene/GlobeStageController';
import MoonCanvas from '@/components/sitenew/scene/MoonCanvas';
import SceneCanvas from '@/components/sitenew/scene/SceneCanvas';
import BootSequence from '@/components/sitenew/system/BootSequence';
import Grade from '@/components/sitenew/system/Grade';
import LiveSignal from '@/components/sitenew/system/LiveSignal';
import Reticle from '@/components/sitenew/system/Reticle';
import ScrollDirector from '@/components/sitenew/system/ScrollDirector';
import SmoothScroll from '@/components/sitenew/system/SmoothScroll';
import SnapStage from '@/components/sitenew/system/SnapStage';

export { metadata } from './metadata';

/** Stable per-section anchor id (kebab-cased label) for hash / skip links. */
const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Section order — index aligns with the camera waypoint table. Labels expose
// each region to assistive tech.
const SECTIONS: { Component: () => JSX.Element; label: string }[] = [
  { Component: Hero, label: 'Hero' },
  { Component: Problem, label: 'The problem' },
  { Component: Insight, label: 'The insight' },
  { Component: Product, label: 'The product' },
  { Component: HowItWorks, label: 'How it works' },
  { Component: Vision, label: 'Vision' },
  { Component: CTA, label: 'Enter the terminal' },
  { Component: Footer, label: 'Footer' },
];

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* Skip link — first focusable, above everything (z-60). */}
      <a
        href="#sn-main"
        className="sr-only z-[60] rounded-sm bg-cyan-300 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.3em] text-[#05080F] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Persistent globe — one fixed canvas (z-0) behind the whole page. */}
      <SceneCanvas />
      {/* §5 Vision moon — second fixed canvas (z-0), parked on the Moon card. */}
      <MoonCanvas />
      {/* Travelling-globe scroll controller (damps the #globe-transform). */}
      <GlobeStageController />
      {/* DEV-ONLY live placement tool — inert unless the URL has ?place. */}
      <GlobePlacer />
      <BootSequence />
      <Grade />
      {/* Scroll → activeSection / sectionProgress for the camera + beacons. */}
      <ScrollDirector />
      {/* Hero targeting-reticle cursor. */}
      <Reticle />
      {/* Ambient live-signal strip (ticker + refresh clock). */}
      <LiveSignal />

      {/* Content floats over the globe; transparent main, z-10. In snap mode
          SnapStage locks this to one section at a time; otherwise it is an inert
          pass-through and the sections stack and scroll natively. */}
      <main id="sn-main" className="relative z-10 w-full text-slate-100">
        <SnapStage>
          {SECTIONS.map(({ Component, label }, i) => (
            <div
              key={i}
              id={slug(label)}
              data-sn-section={i}
              role="region"
              aria-label={label}
            >
              {/* Reveal target — snap drives opacity/translateY here so the
                  100vh block itself stays perfectly aligned in the strip. */}
              <div data-snap-reveal>
                <Component />
              </div>
            </div>
          ))}
        </SnapStage>
      </main>
    </SmoothScroll>
  );
}
