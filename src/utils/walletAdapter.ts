
import { WalletContextState } from '@solana/wallet-adapter-react'

// Create a compatibility wrapper to convert WalletContextState to Supabase's expected format
export const createSolanaWalletAdapter = (wallet: WalletContextState) => {
  if (!wallet.connected || !wallet.signMessage || !wallet.publicKey) {
    throw new Error('Wallet not properly connected')
  }

  return {
    ...wallet,
    signIn: async (input: any) => {
      // Convert the wallet's signIn method to match Supabase's expected format
      if (wallet.signIn) {
        const result = await wallet.signIn(input)
        // Ensure we return the result in the expected format
        return Array.isArray(result) ? result : [result]
      }
      throw new Error('Wallet does not support signIn')
    },
    publicKey: new Uint8Array(wallet.publicKey.toBytes()),
    signMessage: wallet.signMessage,
    connected: wallet.connected,
  }
}
