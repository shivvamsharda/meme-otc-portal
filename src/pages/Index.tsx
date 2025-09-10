import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import LiveListings from '@/components/LiveListings';
import WhyMemeOTC from '@/components/WhyMemeOTC';
import Community from '@/components/Community';
import Footer from '@/components/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Index = () => {
  useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <LiveListings />
      <WhyMemeOTC />
      <Community />
      <Footer />
    </div>
  );
};

export default Index;
