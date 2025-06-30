import { Navigation } from '@/components/organisms/Navigation';
import { HeroSection } from '@/components/organisms/HeroSection';
import { ROICalculator } from '@/components/organisms/ROICalculator';
import { Footer } from '@/components/organisms/Footer';

export default function Home() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <ROICalculator />
      <Footer />
    </main>
  );
}
