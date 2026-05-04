import CTA from '@/components/landing/sections/CTA';
import Footer from '@/components/landing/sections/Footer';
import Hero from '@/components/landing/sections/Hero';
import HowItWorks from '@/components/landing/sections/HowItWorks';
import Insight from '@/components/landing/sections/Insight';
import Problem from '@/components/landing/sections/Problem';
import Product from '@/components/landing/sections/Product';
import Vision from '@/components/landing/sections/Vision';

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
