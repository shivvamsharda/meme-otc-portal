import { ArrowRight, Search, Twitter, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const FloatingPaths = ({
  position
}: {
  position: number;
}) => {
  const paths = Array.from({
    length: 36
  }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03
  }));
  return <div className="absolute inset-0 pointer-events-none z-0">
      <svg className="w-full h-full text-white/30" viewBox="0 0 696 316" fill="none">
        {paths.map(path => <motion.path key={path.id} d={path.d} stroke="currentColor" strokeWidth={path.width * 2} strokeOpacity={0.15 + path.id * 0.02} initial={{
        pathLength: 0.3,
        opacity: 0.6
      }} animate={{
        pathLength: 1,
        opacity: [0.3, 0.7, 0.3],
        pathOffset: [0, 1, 0]
      }} transition={{
        duration: 20 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear"
      }} />)}
      </svg>
    </div>;
};
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
      
      {/* Animated Background Paths */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
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
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-inter-tight font-bold leading-[0.9] tracking-tight">
              The{' '}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                OTC Platform
              </span>
              <br />
              powering the
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-orange-400 bg-clip-text text-transparent">
                Solana memecoin
              </span>
              <br />
              future
            </h1>
          </div>

          {/* Subheadline - cleaner spacing */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
              Secure, private, and efficient OTC trading for Solana memecoins. 
              Access exclusive liquidity and competitive pricing.
            </p>
          </div>

          {/* CTA Buttons - styled like reference */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={handleCreateDeal}
              className="group relative px-10 py-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl font-semibold text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
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

          {/* Social Media Links */}
          <div className="flex justify-center items-center gap-6 pt-8">
            <a 
              href="https://x.com/memeotc_" 
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/30 transition-all duration-300 hover:bg-card/60"
            >
              <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </a>
            
            <a 
              href="https://t.me/memeotc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-3 rounded-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/30 transition-all duration-300 hover:bg-card/60"
            >
              <Send className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </a>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;