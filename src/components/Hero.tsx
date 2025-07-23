
import { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

const Hero = () => {
  const [bouncingBubbles, setBouncingBubbles] = useState<Set<string>>(new Set());

  const handleBubbleClick = (bubbleId: string) => {
    if (bouncingBubbles.has(bubbleId)) return; // Prevent rapid clicking
    
    setBouncingBubbles(prev => new Set([...prev, bubbleId]));
    
    // Return to original position after 3 seconds
    setTimeout(() => {
      setBouncingBubbles(prev => {
        const newSet = new Set(prev);
        newSet.delete(bubbleId);
        return newSet;
      });
    }, 3000);
  };

  const getBubbleClasses = (bubbleId: string, baseClasses: string) => {
    const isBouncing = bouncingBubbles.has(bubbleId);
    return `${baseClasses} ${isBouncing ? 'animate-[bounce-around_3s_ease-in-out]' : ''} cursor-pointer hover:scale-110 hover:shadow-xl transition-all duration-200 pointer-events-auto`;
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Clean dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
      
      {/* Interactive Floating Memecoin Avatars */}
      <div className="absolute inset-0">
        {/* BONK - Top left */}
        <div 
          onClick={() => handleBubbleClick('bonk')}
          className={getBubbleClasses('bonk', "absolute top-24 left-16 w-24 h-24 rounded-full shadow-lg overflow-hidden border border-white/10 backdrop-blur-sm")}
        >
          <img 
            src="/lovable-uploads/c20442fe-b06a-40f4-9fb4-fad85a5bf1cd.png" 
            alt="BONK" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* WIF/dogwifhat - Top right */}
        <div 
          onClick={() => handleBubbleClick('wif')}
          className={getBubbleClasses('wif', "absolute top-32 right-20 w-24 h-24 rounded-full shadow-lg overflow-hidden border border-white/10 backdrop-blur-sm bg-white")}
        >
          <img 
            src="/lovable-uploads/5158b8e4-ca6d-4434-aad7-7c33ccd68cbb.png" 
            alt="dogwifhat" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* PEPE - Bottom left */}
        <div 
          onClick={() => handleBubbleClick('pepe')}
          className={getBubbleClasses('pepe', "absolute bottom-40 left-12 w-24 h-24 rounded-full shadow-lg overflow-hidden border border-white/10 backdrop-blur-sm")}
        >
          <img 
            src="/lovable-uploads/5c1b6715-c4bd-462d-8f6e-fbfb61a8f071.png" 
            alt="PEPE" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* POPCAT - Bottom right */}
        <div 
          onClick={() => handleBubbleClick('popcat')}
          className={getBubbleClasses('popcat', "absolute bottom-32 right-16 w-24 h-24 rounded-full shadow-lg overflow-hidden border border-white/10 backdrop-blur-sm")}
        >
          <img 
            src="/lovable-uploads/147e08a4-6b9c-4e42-bcf1-0f36f73682d3.png" 
            alt="POPCAT" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* JUP (Jupiter) - Middle right */}
        <div 
          onClick={() => handleBubbleClick('jup')}
          className={getBubbleClasses('jup', "absolute top-1/2 right-12 w-24 h-24 rounded-full shadow-lg overflow-hidden border border-white/10 backdrop-blur-sm")}
        >
          <img 
            src="/lovable-uploads/c25e50ad-f670-47cb-9103-898ce9cb25f5.png" 
            alt="Jupiter" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-12 animate-fade-in-scale">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card/40 backdrop-blur-xl border border-primary/20 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Now Live on Solana</span>
          </div>

          {/* Main Headline - Matching reference typography */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight">
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
            <button className="group relative px-10 py-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl font-semibold text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3">
              <span>Start Trading</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button className="group px-10 py-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl font-semibold text-lg text-foreground hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center gap-3">
              <Play className="w-5 h-5" />
              <span>View Demo</span>
            </button>
          </div>

          {/* Stats - matching reference layout */}
          <div className="grid grid-cols-3 gap-8 pt-20 max-w-2xl mx-auto">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                $2.4M+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Volume Traded</div>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">
                420+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Active Traders</div>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                150+
              </div>
              <div className="text-sm text-muted-foreground font-medium">Memecoins Listed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
