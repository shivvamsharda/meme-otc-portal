import { Shield, Eye, Coins, Scale } from 'lucide-react';
const WhyNeoOTC = () => {
  const features = [{
    icon: Shield,
    title: "Escrow-Backed Trust",
    description: "Every deal is protected by a secure smart contract. Tokens and SOL are only exchanged when both sides commit.",
    color: "primary"
  }, {
    icon: Eye,
    title: "Private Peer-to-Peer Listings",
    description: "No public order books. No frontrunning. Just direct negotiations between holders and buyers.",
    color: "accent"
  }, {
    icon: Coins,
    title: "Token-Centric Infrastructure",
    description: "Purpose-built for the crypto meta. Any SPL token. Any deal size. No gatekeeping.",
    color: "meme"
  }, {
    icon: Scale,
    title: "Fully Controlled Terms",
    description: "Set your price, your quantity, and your conditions. No slippage, no bots, no automated match engines.",
    color: "secondary"
  }];
  const getGradientClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'text-white';
      case 'accent':
        return 'text-white';
      case 'meme':
        return 'text-white';
      default:
        return 'text-white';
    }
  };
  const getIconBg = (color: string) => {
    return 'bg-black shadow-lg';
  };
  return <section className="py-32 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-white/5" />
      
      <div className="container mx-auto px-6 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-on-scroll">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Why Serious <span className="text-white">Traders</span> Use NeoOTC
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            The go-to OTC desk for private, direct Solana token deals — no noise, no middlemen, just clean peer-to-peer execution.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
          const Icon = feature.icon;
          return <div key={index} className="relative group animate-on-scroll" style={{
            animationDelay: `${index * 150}ms`
          }}>
                
                {/* Feature Card */}
                <div className="card-glow p-8 rounded-3xl text-center h-full">
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${getIconBg(feature.color)} p-4`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-2xl font-bold mb-4 ${getGradientClass(feature.color)}`}>
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                </div>
              </div>;
        })}
        </div>

        {/* Bottom Stats */}
        
      </div>
    </section>;
};
export default WhyNeoOTC;