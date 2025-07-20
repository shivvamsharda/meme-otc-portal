
import { useState } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import WalletButton from './WalletButton';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Browse Listings', href: '/listings' },
    { name: 'Supported Tokens', href: '/tokens' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'About', href: '/about' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - refined */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              MEMEOTC
            </Link>
          </div>

          {/* Desktop Navigation - cleaner spacing */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 font-medium text-sm tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA - refined buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/listings">
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Listing
              </Button>
            </Link>
            <WalletButton className="px-8 py-3 text-sm" />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-border/30">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/listings">
                <Button variant="outline" className="flex items-center gap-2 w-full mt-2">
                  <Plus className="w-4 h-4" />
                  Create Listing
                </Button>
              </Link>
              <WalletButton className="px-8 py-3 text-sm mt-4 w-full" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
