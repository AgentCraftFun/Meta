import CTA from '@/components/sitenew/sections/CTA';
import Footer from '@/components/sitenew/sections/Footer';
import Hero from '@/components/sitenew/sections/Hero';
import HowItWorks from '@/components/sitenew/sections/HowItWorks';
import Insight from '@/components/sitenew/sections/Insight';
import Problem from '@/components/sitenew/sections/Problem';
import Product from '@/components/sitenew/sections/Product';
import Vision from '@/components/sitenew/sections/Vision';

export default function LandingPage() {
  return (
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
  );
}
