
import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WalletButtonProps {
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
  className?: string;
}

export const WalletButton: React.FC<WalletButtonProps> = ({ 
  variant = 'primary', 
  children = 'Launch App',
  className = ''
}) => {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const baseClasses = variant === 'primary' 
    ? `group relative px-10 py-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl font-semibold text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 ${className}`
    : `group px-10 py-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl font-semibold text-lg text-foreground hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center gap-3 ${className}`;

  const handleSignIn = async () => {
    if (connected && window.solana && publicKey) {
      try {
        await supabase.auth.signInWithWeb3({
          chain: 'solana',
          statement: 'I accept the Terms of Service for MemeOTC',
          wallet: window.solana,
        });
      } catch (error) {
        console.error('Error signing in:', error);
      }
    }
  };

  if (connected && publicKey) {
    return (
      <button onClick={handleSignIn} className={baseClasses}>
        <span>Sign in with Solana</span>
        {variant === 'primary' && (
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        )}
      </button>
    );
  }

  return (
    <WalletMultiButton 
      className={`!bg-transparent !border-none !p-0 !m-0 !h-auto !rounded-none`}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        padding: 0, 
        margin: 0,
        height: 'auto',
        borderRadius: 0
      }}
    >
      <div className={baseClasses}>
        <span>{children}</span>
        {variant === 'primary' && (
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        )}
      </div>
    </WalletMultiButton>
  );
};

export default WalletButton;
