import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Tools } from '@/components/sections/Tools';
import { Pricing } from '@/components/sections/Pricing';
import { HolderPerks } from '@/components/sections/HolderPerks';
import { Stats } from '@/components/sections/Stats';
import { Testimonials } from '@/components/sections/Testimonials';
import { FAQ } from '@/components/sections/FAQ';
import { CTA } from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Tools />
      <Pricing />
      <HolderPerks />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
