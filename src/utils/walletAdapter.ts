
import { WalletContextState } from '@solana/wallet-adapter-react'

// Create a compatibility wrapper to convert WalletContextState to Supabase's expected format
export const createSolanaWalletAdapter = (wallet: WalletContextState) => {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not properly connected')
  }

  const adapted: any = {
    ...wallet,
    connected: wallet.connected,
  }

  // Attach capabilities only if supported by the underlying wallet
  if (typeof (wallet as any).signMessage === 'function') {
    adapted.signMessage = (message: Uint8Array) => (wallet as any).signMessage!(message)
  }

  if (typeof (wallet as any).signIn === 'function') {
    adapted.signIn = async (input: any) => {
      const result = await (wallet as any).signIn!(input)
      return Array.isArray(result) ? result : [result]
    }
  }

  return adapted
}