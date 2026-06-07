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
import SmoothScroll from '@/components/sitenew/system/SmoothScroll';

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* Persistent globe — one fixed canvas (z-0) behind the whole page. */}
      <SceneCanvas />
      <BootSequence />
      <Grade />
      {/* Content floats over the globe; transparent main, z-10. */}
      <main className="relative z-10 w-full text-slate-100">
        <Hero />
        <Problem />
        <Insight />
        <Product />
        <HowItWorks />
        <Vision />
        <CTA />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
