import CTA from '@/components/sitenew/sections/CTA';
import Footer from '@/components/sitenew/sections/Footer';
import Hero from '@/components/sitenew/sections/Hero';
import HowItWorks from '@/components/sitenew/sections/HowItWorks';
import Insight from '@/components/sitenew/sections/Insight';
import Problem from '@/components/sitenew/sections/Problem';
import Product from '@/components/sitenew/sections/Product';
import Vision from '@/components/sitenew/sections/Vision';
import BootSequence from '@/components/sitenew/system/BootSequence';
import Grade from '@/components/sitenew/system/Grade';
import SmoothScroll from '@/components/sitenew/system/SmoothScroll';

export default function LandingPage() {
  return (
    <SmoothScroll>
      <BootSequence />
      <Grade />
      <main className="w-full bg-[#05080F] text-slate-100">
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
