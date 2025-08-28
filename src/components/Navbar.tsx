
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { WalletButton } from './WalletButton';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Browse Deals', href: '/deals' },
    { name: 'Create Deal', href: '/create-deal' },
    { name: 'My Deals', href: '/my-deals' },
    { name: 'About', href: '#about' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - refined */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img 
                src="https://ebmiuqrdzzdliupgcqsy.supabase.co/storage/v1/object/public/logos/NeoOTC_WEB%20(1).png" 
                alt="NeoOTC Logo" 
                className="h-11 w-auto"
              />
            </a>
          </div>

          {/* Desktop Navigation - cleaner spacing */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium text-sm tracking-wide"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA - replaced with WalletButton */}
          <div className="hidden lg:block">
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-border/30">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="mt-4">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
