import { Twitter, Send, ExternalLink } from 'lucide-react';

const Community = () => {
  const socials = [
    {
      icon: Twitter,
      name: "Twitter",
      handle: "@meme_otc",
      followers: "12.4K",
      color: "primary",
      link: "https://x.com/meme_otc"
    },
    {
      icon: Send,
      name: "Telegram",
      handle: "t.me/meme_otc", 
      followers: "8.9K",
      color: "accent",
      link: "https://t.me/meme_otc"
    }
  ];

  const leaderboards = [
    {
      title: "Most Traded Tokens",
      items: [
        { name: "BONK", volume: "420K SOL", rank: 1 },
        { name: "PEPE", volume: "380K SOL", rank: 2 },
        { name: "DOGE", volume: "310K SOL", rank: 3 },
        { name: "SHIB", volume: "280K SOL", rank: 4 }
      ]
    },
    {
      title: "Biggest OTC Buys",
      items: [
        { name: "degen_ape.sol", volume: "125 SOL", rank: 1 },
        { name: "meme_lord.sol", volume: "98 SOL", rank: 2 },
        { name: "bonk_king.sol", volume: "87 SOL", rank: 3 },
        { name: "pepe_chad.sol", volume: "76 SOL", rank: 4 }
      ]
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
                    <p className="text-sm font-semibold mt-2">{social.followers} members</p>
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

        {/* Leaderboards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {leaderboards.map((board, boardIndex) => (
            <div 
              key={boardIndex}
              className="card-glow p-8 rounded-3xl animate-on-scroll"
              style={{ animationDelay: `${boardIndex * 200}ms` }}
            >
              <h3 className="text-2xl font-bold mb-6 gradient-text-primary">
                {board.title}
              </h3>
              
              <div className="space-y-4">
                {board.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        item.rank === 1 ? 'bg-gradient-primary text-white' :
                        item.rank === 2 ? 'bg-gradient-secondary text-white' :
                        item.rank === 3 ? 'bg-gradient-accent text-white' :
                        'bg-muted text-foreground'
                      }`}>
                        {item.rank}
                      </div>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium">{item.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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