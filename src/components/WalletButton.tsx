
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
  const { connected, publicKey, disconnect, wallet } = useWallet();

  const baseClasses = variant === 'primary' 
    ? `group relative px-10 py-4 bg-gradient-to-r from-primary to-purple-500 rounded-2xl font-semibold text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 ${className}`
    : `group px-10 py-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl font-semibold text-lg text-foreground hover:bg-card hover:border-primary/30 transition-all duration-300 flex items-center gap-3 ${className}`;

  const handleSignIn = async () => {
    if (connected && publicKey && wallet?.adapter) {
      try {
        console.log('Attempting to sign in with wallet:', publicKey.toString());
        
        const { data, error } = await supabase.auth.signInWithWeb3({
          chain: 'solana',
          statement: 'I accept the Terms of Service for MemeOTC',
          wallet: wallet.adapter,
        });

        if (error) {
          console.error('Error signing in with Web3:', error);
        } else {
          console.log('Successfully signed in with Web3:', data);
        }
      } catch (error) {
        console.error('Error during Web3 sign in:', error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={handleSignIn} className={baseClasses}>
          <span>Sign in with Solana</span>
          {variant === 'primary' && (
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          )}
        </button>
        <button 
          onClick={handleDisconnect}
          className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
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
