
import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';

// Import default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  const [customRpcUrl, setCustomRpcUrl] = useState<string | null>(null);

  // Fetch custom RPC URL from Supabase edge function
  useEffect(() => {
    const fetchRpcConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-rpc-config');
        if (error) {
          console.warn('Failed to fetch custom RPC, using default:', error);
          return;
        }
        if (data?.rpcUrl) {
          setCustomRpcUrl(data.rpcUrl);
        }
      } catch (error) {
        console.warn('Failed to fetch custom RPC, using default:', error);
      }
    };
    
    fetchRpcConfig();
  }, []);

  // Use custom RPC if available, otherwise fall back to default
  const endpoint = useMemo(() => {
    return customRpcUrl || clusterApiUrl(network);
  }, [customRpcUrl, network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
