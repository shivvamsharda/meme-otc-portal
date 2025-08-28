import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Feature } from '@/components/ui/feature-with-advantages';
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
      <Feature />
      <LiveListings />
      <WhyMemeOTC />
      <Community />
      <Footer />
    </div>
  );
};

export default Index;
