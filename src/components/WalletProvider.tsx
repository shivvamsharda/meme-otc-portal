
import { useMemo, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { RPC_URL, NETWORK } from '@/contracts/config'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

interface SolanaWalletProviderProps {
  children: ReactNode
}

export const SolanaWalletProvider = ({ children }: SolanaWalletProviderProps) => {
  const endpoint = useMemo(() => RPC_URL, [])
  
  const adapterNetwork = useMemo(() => {
    const net = NETWORK as string
    if (net === 'devnet') return WalletAdapterNetwork.Devnet
    if (net === 'testnet') return WalletAdapterNetwork.Testnet
    return WalletAdapterNetwork.Mainnet
  }, [])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: adapterNetwork }),
    ],
    [adapterNetwork]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
