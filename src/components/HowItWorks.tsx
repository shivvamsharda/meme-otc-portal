import { Upload, Shield, Zap } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Create Your Listing",
      description: "Specify your SPL token, amount, and asking price in SOL. Your offer is now live for OTC buyers.",
      step: "01"
    },
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "Once a buyer accepts, funds are locked in a smart contract. Neither party can rug — guaranteed.",
      step: "02"
    },
    {
      icon: Zap,
      title: "Settle Instantly",
      description: "SOL is released to the seller. Tokens are released to the buyer. Private, peer-to-peer. No middlemen.",
      step: "03"
    }
  ];

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-on-scroll">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            How <span className="gradient-text-primary">MemeOTC</span> Works
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Three simple steps to privately exchange any Solana memecoin with zero slippage, no front-running, and full escrow protection.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className="relative group animate-on-scroll"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                
                {/* Connection Line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-[calc(100%+1.5rem)] w-12 h-0.5 bg-gradient-primary opacity-30" />
                )}

                {/* Step Card */}
                <div className="card-glow p-8 rounded-3xl text-center h-full">
                  
                  {/* Step Number */}
                  <div className="text-6xl font-bold gradient-text-meme mb-4 opacity-20">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-primary p-4 shadow-glow-primary">
                    <Icon className="w-full h-full text-primary-foreground" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-on-scroll">
          <button className="btn-gradient px-8 py-4 rounded-2xl font-semibold text-lg">
            Create Your First Listing
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;