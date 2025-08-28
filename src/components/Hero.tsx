import { ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrismaticBurst from '@/components/ui/PrismaticBurst';
const Hero = () => {
  const navigate = useNavigate();

  const handleCreateDeal = () => {
    navigate('/create-deal');
  };

  const handleBrowseDeals = () => {
    navigate('/deals');
  };

  return <section className="relative min-h-screen flex items-start justify-center overflow-hidden bg-background pt-20 md:pt-24">
      {/* Clean dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
      
      {/* Prismatic Burst Background */}
      <div className="absolute inset-0">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={1.8}
          speed={0.25}
          distort={6}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.2}
          rayCount={16}
          mixBlendMode="lighten"
          colors={['#ffffff', '#ffffff', '#ffffff']}
        />
      </div>
      

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-12 animate-fade-in-scale">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card/40 backdrop-blur-xl border border-primary/20 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Now Live on Solana Mainnet</span>
          </div>

          {/* Main Headline - Matching reference typography */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-inter-tight font-bold leading-[0.9] tracking-tight text-white">
              Trustless. Transparent.
              <br />
              OTC on Solana
            </h1>
          </div>

          {/* Subheadline - cleaner spacing */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
              Built for Solana. Scaled for the future of decentralized finance.
            </p>
          </div>

          {/* CTA Buttons - styled like reference */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center -translate-y-6 sm:-translate-y-8 md:-translate-y-10">
            <button 
              onClick={handleCreateDeal}
              className="group relative px-10 py-4 bg-white rounded-2xl font-semibold text-lg text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <span>Create Deal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button 
              onClick={handleBrowseDeals}
              className="group px-10 py-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl font-semibold text-lg text-foreground hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center gap-3"
            >
              <Search className="w-5 h-5" />
              <span>Browse Deals</span>
            </button>
          </div>

          {/* Stats - matching reference layout */}
          
        </div>
      </div>
    </section>;
};
export default Hero;