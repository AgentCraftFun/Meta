import CTA from '@/components/sitenew/sections/CTA';
import Footer from '@/components/sitenew/sections/Footer';
import Hero from '@/components/sitenew/sections/Hero';
import HowItWorks from '@/components/sitenew/sections/HowItWorks';
import Insight from '@/components/sitenew/sections/Insight';
import Problem from '@/components/sitenew/sections/Problem';
import Product from '@/components/sitenew/sections/Product';
import Vision from '@/components/sitenew/sections/Vision';
import SceneCanvas from '@/components/sitenew/scene/SceneCanvas';
import BootSequence from '@/components/sitenew/system/BootSequence';
import Grade from '@/components/sitenew/system/Grade';
import Reticle from '@/components/sitenew/system/Reticle';
import ScrollDirector from '@/components/sitenew/system/ScrollDirector';
import SmoothScroll from '@/components/sitenew/system/SmoothScroll';

// Section order — index aligns with the camera waypoint table.
const SECTIONS = [Hero, Problem, Insight, Product, HowItWorks, Vision, CTA, Footer];

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* Persistent globe — one fixed canvas (z-0) behind the whole page. */}
      <SceneCanvas />
      <BootSequence />
      <Grade />
      {/* Scroll → activeSection / sectionProgress for the camera + beacons. */}
      <ScrollDirector />
      {/* Hero targeting-reticle cursor. */}
      <Reticle />
      {/* Content floats over the globe; transparent main, z-10. */}
      <main className="relative z-10 w-full text-slate-100">
        {SECTIONS.map((Section, i) => (
          <div key={i} data-sn-section={i}>
            <Section />
          </div>
        ))}
      </main>
    </SmoothScroll>
  );
}
