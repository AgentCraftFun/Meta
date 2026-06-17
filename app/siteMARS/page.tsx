import CTA from '@/components/sitemars/sections/CTA';
import Hero from '@/components/sitemars/sections/Hero';
import HowItWorks from '@/components/sitemars/sections/HowItWorks';
import Insight from '@/components/sitemars/sections/Insight';
import Problem from '@/components/sitemars/sections/Problem';
import Product from '@/components/sitemars/sections/Product';
import Vision from '@/components/sitemars/sections/Vision';
import GlobePlacer from '@/components/sitenew/scene/GlobePlacer';
import GlobeStageController from '@/components/sitenew/scene/GlobeStageController';
import MoonCanvas from '@/components/sitenew/scene/MoonCanvas';
import JupiterCanvas from '@/components/sitemars/scene/JupiterCanvas';
import SceneCanvasMars from '@/components/sitemars/scene/SceneCanvasMars';
import StageLock from '@/components/sitemars/scene/StageLock';
import { SLOTS_MARS } from '@/components/sitemars/scene/globeSlotsMars';
import BootSequence from '@/components/sitemars/system/BootSequence';
import Grade from '@/components/sitenew/system/Grade';
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
  { Component: Product, label: 'The token' },
  { Component: HowItWorks, label: 'How it works' },
  { Component: Vision, label: 'Tokenomics' },
  { Component: CTA, label: 'Acquire STAR' },
];

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* MARS THEME SCOPE — this plain wrapper carries `.theme-mars`, which
          redefines the accent CSS vars (cyan → Mars palette) and activates the
          Mars glass. It sets only CSS variables, so it creates no stacking
          context and the fixed z-0 canvases / z-10 content layer exactly as on
          /siteNEW. /siteNEW has no such wrapper, so it stays cyan. */}
      <div className="theme-mars overflow-x-clip">
        {/* Centre-lock the globe stage to the tuned 1512×752 viewport (Mars only). */}
        <StageLock />
        {/* Skip link — first focusable, above everything (z-60). */}
        <a
          href="#sn-main"
          className="sr-only z-[60] rounded-sm bg-accent-300 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.3em] text-[#05080F] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>

        {/* Persistent Mars body — one fixed canvas (z-0) behind the whole page.
            It also docks on the §5 Tokenomics "SPCX" card (vision-globe-earth). */}
        <SceneCanvasMars />
        {/* §5 moon — fixed canvas (z-0), parked on the middle "Passive" card. */}
        <MoonCanvas />
        {/* §5 Jupiter — fixed canvas (z-0), parked on the Buy Backs card. */}
        <JupiterCanvas />
        {/* Travelling-globe scroll controller (damps the #globe-transform).
            §3 (The Token) and §5 (Tokenomics — SPCX card) centre the globe on the
            MEASURED content boxes, so they're exact at ANY screen size; §3 also
            size-matches the globe to the mock cutout. */}
        <GlobeStageController
          slots={SLOTS_MARS}
          tracks={[
            { index: 3, id: 'product-globe-cutout', fitH: 1.07 },
            { index: 5, id: 'vision-globe-earth' },
          ]}
        />
        {/* DEV-ONLY live placement tool — inert unless the URL has ?place. */}
        <GlobePlacer />
        <BootSequence />
        <Grade />
        {/* Scroll → activeSection / sectionProgress for the camera + beacons. */}
        <ScrollDirector />
        {/* Hero targeting-reticle cursor. */}
        <Reticle />

        {/* Content floats over the globe; transparent main, z-10. In snap mode
            SnapStage locks this to one section at a time; otherwise it is an inert
            pass-through and the sections stack and scroll natively. */}
        <main id="sn-main" className="relative z-10 w-full text-slate-100">
          <SnapStage liveGlass>
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
      </div>
    </SmoothScroll>
  );
}
