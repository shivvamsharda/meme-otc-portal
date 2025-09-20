import { Twitter, Send, ExternalLink } from 'lucide-react';

const Community = () => {
  const socials = [
    {
      icon: Twitter,
      name: "Twitter",
      handle: "@meme_otc",
      color: "primary",
      link: "https://x.com/memeotc_"
    },
    {
      icon: Send,
      name: "Telegram",
      handle: "t.me/meme_otc", 
      color: "accent",
      link: "https://t.me/meme_otc"
    }
  ];


  const getGradientClass = (color: string) => {
    switch (color) {
      case 'primary': return 'gradient-text-primary';
      case 'accent': return 'gradient-text-accent';
      case 'meme': return 'gradient-text-meme';
      default: return 'gradient-text-primary';
    }
  };

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-on-scroll">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Join the <span className="gradient-text-meme">Degens</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Connect with the most active memecoin trading community on Solana.
          </p>
        </div>

        {/* Social Links */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {socials.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.link}
                className="card-glow p-8 rounded-3xl text-center group cursor-pointer animate-on-scroll"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-4 shadow-glow-primary group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-full h-full text-white" />
                  </div>
                  
                  <div>
                    <h3 className={`text-2xl font-bold ${getGradientClass(social.color)}`}>
                      {social.name}
                    </h3>
                    <p className="text-muted-foreground mt-1">{social.handle}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Join Community
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Community Stats */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          <div className="card-glow p-8 rounded-3xl animate-on-scroll text-center">
            <h3 className="text-2xl font-bold mb-6 gradient-text-primary">
              Most Traded Tokens
            </h3>
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Coming Soon</p>
              <p className="text-sm">Real trading data will appear here once the platform goes live</p>
            </div>
          </div>
          
          <div className="card-glow p-8 rounded-3xl animate-on-scroll text-center">
            <h3 className="text-2xl font-bold mb-6 gradient-text-primary">
              Biggest OTC Buys
            </h3>
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Coming Soon</p>
              <p className="text-sm">Top traders will be featured here once deals are completed</p>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="text-center animate-on-scroll">
          <blockquote className="text-2xl md:text-3xl font-bold mb-6">
            "Built on <span className="gradient-text-primary">Solana</span>. 
            Fuelled by <span className="gradient-text-meme">memes</span>. 
            Powered by <span className="gradient-text-accent">you</span>."
          </blockquote>
          <p className="text-muted-foreground">— The MemeOTC Team</p>
        </div>
      </div>
    </section>
  );
};

export default Community;